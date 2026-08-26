import { useEffect, useState } from 'react';
import { getWebSkillRuntime, type AgileWebSkillRuntime } from './runtime';

export function useWebSkillRuntime(): { runtime?: AgileWebSkillRuntime; error?: Error } {
  const [runtime, setRuntime] = useState<AgileWebSkillRuntime>();
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let alive = true;
    getWebSkillRuntime().then(
      (r) => {
        if (alive) setRuntime(r);
      },
      // 不要吞异常：装配失败必须可见，否则后面所有症状都会指向错误的方向
      (e: unknown) => {
        if (alive) setError(e instanceof Error ? e : new Error(String(e)));
      }
    );
    return () => {
      alive = false;
    };
  }, []);

  return { runtime, error };
}
