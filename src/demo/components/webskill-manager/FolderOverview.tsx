import React from 'react';
import { Folder } from 'lucide-react';
import { useAgileData } from '../../context/AgileDataContext';

export function FolderOverview({ skill, folderPath }: { skill: any; folderPath: string }) {
  const { lang } = useAgileData();
  // Let's list all keys in skill excluding metadata keys
  const excludeKeys = ['name', 'source', 'root', 'refs'];
  const allSubPaths = Object.keys(skill).filter((k) => !excludeKeys.includes(k));

  const cleanPath = (path: string) => (path.endsWith('/') ? path.slice(0, -1) : path);
  const cleanFolder = cleanPath(folderPath);
  const prefix = cleanFolder === '' ? '' : `${cleanFolder}/`;

  let filesCount = 0;
  let foldersCount = 0;
  let totalSize = 0;

  allSubPaths.forEach((p) => {
    const cleanP = cleanPath(p);
    if (p.startsWith(prefix) && cleanP !== cleanFolder) {
      if (p.endsWith('/') || skill[p] === true) {
        foldersCount++;
      } else {
        filesCount++;
        // Calculate approx size based on content length
        const content = typeof skill[p] === 'string' ? skill[p] : '';
        totalSize += content.length;
      }
    }
  });

  // Calculate simulated occupied space (typically aligning up to multiples of 4KB)
  const sizeInKb = (totalSize / 1024).toFixed(2);
  const occupiedInKb = (Math.ceil(totalSize / 4096) * 4).toFixed(0);

  return (
    <div className="p-8 w-full space-y-6 animate-fadeIn">
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-[#1E293B]">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center">
            <Folder className="w-5 h-5 mr-2 text-indigo-500" />
            <span>
              {lang === 'zh' ? '文件夹信息：' : 'Folder Info: '}
              {folderPath}
            </span>
          </h2>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block text-xs font-medium">{lang === 'zh' ? '位置' : 'Location'}</span>
              <span className="font-semibold text-slate-800 dark:text-[#F1F5F9]">
                {skill.root}/{folderPath}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs font-medium">{lang === 'zh' ? '创建时间' : 'Created At'}</span>
              <span className="font-semibold text-slate-800 dark:text-[#F1F5F9]">2026-05-25 10:00:00</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs font-medium">{lang === 'zh' ? '大小' : 'Size'}</span>
              <span className="font-semibold text-slate-800 dark:text-[#F1F5F9]">
                {sizeInKb} KB ({totalSize} {lang === 'zh' ? '字节' : 'bytes'})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs font-medium">{lang === 'zh' ? '占用空间' : 'Space Occupied'}</span>
              <span className="font-semibold text-slate-800 dark:text-[#F1F5F9]">{occupiedInKb} KB</span>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-6">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">{lang === 'zh' ? '包含文件数:' : 'Contains Files:'}</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
                {filesCount} {lang === 'zh' ? '个文件' : 'files'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">{lang === 'zh' ? '包含文件夹数:' : 'Contains Folders:'}</span>
              <span className="font-mono font-bold text-amber-650 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
                {foldersCount} {lang === 'zh' ? '个文件夹' : 'folders'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
