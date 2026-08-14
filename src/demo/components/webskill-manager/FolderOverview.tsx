import React from 'react';
import { Folder } from 'lucide-react';
import { useAgileData } from '../../context/AgileDataContext';

export function FolderOverview({ skill, folderPath }: { skill: any; folderPath: string }) {
  const { lang } = useAgileData();
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
        const content = typeof skill[p] === 'string' ? skill[p] : '';
        totalSize += content.length;
      }
    }
  });

  const sizeInKb = (totalSize / 1024).toFixed(2);
  const occupiedInKb = (Math.ceil(totalSize / 4096) * 4).toFixed(0);

  return (
    <div className="p-6 w-full space-y-6 text-foreground">
      <div className="border border-border rounded-xl overflow-hidden shadow-xs bg-card">
        <div className="px-6 py-4 bg-secondary/50 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
            <Folder className="w-4 h-4 text-muted-foreground" />
            <span>
              {lang === 'zh' ? '文件夹信息：' : 'Folder Info: '}
              <span className="font-mono">{folderPath}</span>
            </span>
          </h2>
        </div>
        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground block text-xs font-medium">{lang === 'zh' ? '位置' : 'Location'}</span>
              <span className="font-mono font-medium text-foreground">
                {skill.root}/{folderPath}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs font-medium">{lang === 'zh' ? '创建时间' : 'Created At'}</span>
              <span className="font-mono font-medium text-foreground">2026-05-25 10:00:00</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs font-medium">{lang === 'zh' ? '大小' : 'Size'}</span>
              <span className="font-mono font-medium text-foreground">
                {sizeInKb} KB ({totalSize} {lang === 'zh' ? '字节' : 'bytes'})
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs font-medium">{lang === 'zh' ? '占用空间' : 'Space Occupied'}</span>
              <span className="font-mono font-medium text-foreground">{occupiedInKb} KB</span>
            </div>
          </div>
          <div className="border-t border-border pt-4 flex gap-6">
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground font-medium">{lang === 'zh' ? '包含文件数:' : 'Contains Files:'}</span>
              <span className="font-mono font-bold text-foreground bg-secondary border border-border px-2 py-0.5 rounded-md">
                {filesCount} {lang === 'zh' ? '个文件' : 'files'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-muted-foreground font-medium">{lang === 'zh' ? '包含文件夹数:' : 'Contains Folders:'}</span>
              <span className="font-mono font-bold text-foreground bg-secondary border border-border px-2 py-0.5 rounded-md">
                {foldersCount} {lang === 'zh' ? '个文件夹' : 'folders'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
