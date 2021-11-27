import { useRef } from 'react';

/**
 * 创建单例 / 常量。
 */
export function useConstant<Constant>(initializer: () => Constant): Constant {
  const ref = useRef<readonly [Constant]>();

  if (!ref.current) ref.current = [initializer()];

  return ref.current[0];
}
