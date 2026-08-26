import type {
  DownloadedFileAction,
  DownloadedFileConsent,
  DownloadedFileEntry,
  DownloadedFileReader
} from '@webskill/sdk/agent';
import i18n from '../../i18n';

/**
 * 本机下载文件的取件通路（0.14.0 分册 20）。
 *
 * 浏览器没有「下载目录」的概念，唯一入口是 File System Access API：
 * 首次列出时弹目录选择器（startIn 定位到系统下载目录），句柄存 IndexedDB，
 * 之后复用。选择器要用户手势——策略层先弹授权卡，用户点「允许」后的
 * transient activation 窗口内调 picker，时序刚好成立。
 *
 * 引擎侧只收端口：授权卡出口、能力开关、读图判定、docx/xlsx 抽取器、
 * 审计全由 chatbot 从适配器既有字段接线，宿主不重复判断。
 */

/** 一次列出交给模型的条目上限：下载目录可能上千个文件，全列会撑爆工具结果 */
const LIST_LIMIT = 50;

const IDB_NAME = 'agile-webskill';
const IDB_STORE = 'fs-handles';
const HANDLE_KEY = 'downloads-dir';

const CONSENT_PREFIX = 'agile.downloads.consent:';

// lib.dom（TS 6.0）尚未收录 picker 与句柄权限方法，这里按 WICG 草案补最小声明
interface DirectoryPickerOptions {
  id?: string;
  startIn?: 'downloads' | 'documents' | 'desktop' | 'music' | 'pictures' | 'videos';
  mode?: 'read' | 'readwrite';
}
type ShowDirectoryPicker = (options?: DirectoryPickerOptions) => Promise<FileSystemDirectoryHandle>;
interface HandlePermission {
  queryPermission(desc: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission(desc: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
}

const picker = (): ShowDirectoryPicker | undefined =>
  (window as unknown as { showDirectoryPicker?: ShowDirectoryPicker }).showDirectoryPicker;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** 句柄持久化失败（隐私模式等）只意味着下次重新选目录，不阻断通路 */
async function loadHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).get(HANDLE_KEY);
      req.onsuccess = () => resolve(req.result as FileSystemDirectoryHandle | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const req = db.transaction(IDB_STORE, 'readwrite').objectStore(IDB_STORE).put(handle, HANDLE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // 同上：持久化是便利不是前提
  }
}

/**
 * 取件实现。`id` 是每次列出时现发的随机取件号（FR-20.2：不得可反推出路径），
 * 句柄表只活在本实例内存里——再次列出即全部作废，模型只能拿最新清单里的号。
 */
export function createAgileDownloadedFileReader(): DownloadedFileReader {
  const handles = new Map<string, FileSystemFileHandle>();

  // 英文：报错会进 LLM 上下文与错误上报
  const resolveDir = async (): Promise<FileSystemDirectoryHandle> => {
    const pick = picker();
    if (pick === undefined) {
      throw new Error('This browser does not support the File System Access API; reading downloaded files requires a Chromium-based browser.');
    }
    let dir = await loadHandle();
    if (dir === undefined) {
      dir = await pick({ id: 'agile-downloads', startIn: 'downloads', mode: 'read' });
      await saveHandle(dir);
    }
    const perms = dir as unknown as HandlePermission;
    let state = await perms.queryPermission({ mode: 'read' });
    if (state === 'prompt') state = await perms.requestPermission({ mode: 'read' });
    if (state !== 'granted') {
      throw new Error('Permission to read the downloads directory was denied.');
    }
    return dir;
  };

  return {
    async list(): Promise<readonly DownloadedFileEntry[]> {
      const dir = await resolveDir();
      const files: { handle: FileSystemFileHandle; file: File }[] = [];
      for await (const handle of dir.values()) {
        if (handle.kind !== 'file') continue;
        const fileHandle = handle as FileSystemFileHandle;
        files.push({ handle: fileHandle, file: await fileHandle.getFile() });
      }
      files.sort((a, b) => b.file.lastModified - a.file.lastModified);
      handles.clear();
      return files.slice(0, LIST_LIMIT).map(({ handle, file }) => {
        const id = crypto.randomUUID();
        handles.set(id, handle);
        return {
          id,
          name: file.name,
          contentType: file.type || 'application/octet-stream',
          size: file.size,
          at: new Date(file.lastModified).toISOString()
        };
      });
    },

    async read(id: string): Promise<{ contentType: string; bytes: Uint8Array }> {
      const handle = handles.get(id);
      if (handle === undefined) {
        throw new Error(`Unknown downloaded file id "${id}"; call list_downloaded_files again for a fresh id.`);
      }
      const file = await handle.getFile();
      // contentType 必须在读取时重新给出（FR-20：两次调用之间文件可能被替换）
      return {
        contentType: file.type || 'application/octet-stream',
        bytes: new Uint8Array(await file.arrayBuffer())
      };
    }
  };
}

/**
 * 「不再询问」记忆端口。粒度 = 整个已选下载目录 × 动作（列出 / 读取），
 * localStorage 持久化；不注入则确认卡没有复选框、每次都问。
 */
export function createAgileDownloadsConsent(): DownloadedFileConsent {
  const keyOf = (action: DownloadedFileAction): string => `${CONSENT_PREFIX}${action}`;
  return {
    recall(action: DownloadedFileAction): boolean {
      try {
        return localStorage.getItem(keyOf(action)) === '1';
      } catch {
        // 读不动存储就按「没记过」处理：宁可多问一次
        return false;
      }
    },
    remember(action: DownloadedFileAction): void {
      try {
        localStorage.setItem(keyOf(action), '1');
      } catch {
        // 记不上就下次再问，不阻断本次放行
      }
    },
    /** 复选框文案必须说出真实粒度：记住的是整个下载目录，不是单个文件 */
    describeScope(action: DownloadedFileAction): string {
      const zh = i18n.language.startsWith('zh');
      if (action === 'list') {
        return zh ? '以后不再询问列出下载目录里的文件' : 'Don’t ask again to list files in the downloads folder';
      }
      return zh ? '以后不再询问读取下载目录里的文件' : 'Don’t ask again to read files from the downloads folder';
    }
  };
}
