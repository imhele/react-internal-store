import React, { createContext, ReactElement, ReactNode, useContext, useRef } from 'react';

export interface RuntimeOnlyContextProviderProps<Value> {
  children?: ReactNode;
  value: Value;
}

export type RuntimeOnlyContextProviderComponentType<Value> = (
  props: RuntimeOnlyContextProviderProps<Value>,
) => ReactElement;

/**
 * 创建无 defaultValue 的 Context ，如果使用 useContext() 时发现当前组件不在
 * Provider 下时，直接 throw error 。
 */
export function createRuntimeOnlyContext<Value>(
  name = 'Anonymous',
): [useContext: () => Value, Provider: RuntimeOnlyContextProviderComponentType<Value>] {
  // 创建 Context ，由于 Value 也有可能为 null ，所以用数组包一下
  const Context = createContext<readonly [Value] | null>(null);
  // 设置 displayName 便于调试
  Context.displayName = name;

  return [useRuntimeOnlyContext, RuntimeOnlyContextProvider];

  function useRuntimeOnlyContext(): Value {
    // 读取 Context 当前的值
    const value = useContext(Context);
    // value 不存在，说明当前组件不在 Provider 下，直接 throw error
    if (!value) throw new Error(`Failed to read the context '${name}', it may not be mounted.`);
    // 返回 value 数组中实际存储的值
    return value[0];
  }

  function RuntimeOnlyContextProvider(props: RuntimeOnlyContextProviderProps<Value>): ReactElement {
    const { children, value } = props;

    const next = [value] as const;
    const memorized = useRef(next);

    // 只有 value 变化时，才更新 memorized.current
    if (memorized.current[0] !== value) memorized.current = next;

    return <Context.Provider value={memorized.current}>{children}</Context.Provider>;
  }
}
