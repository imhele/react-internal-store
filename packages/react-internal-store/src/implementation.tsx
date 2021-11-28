import React, { DependencyList, useEffect, useRef, useState } from 'react';
import type {
  AnyModelDefinition,
  AnyModelDefinitionsMap,
  ModelConsumeHooksMap,
  ModelDefinition,
  ModelStateSelector,
  Store,
  StoreComponentType,
} from './interfaces';
import { useConstant } from './utils/hooks';
import { createRuntimeOnlyContext } from './utils/runtime-only-context';

/**
 * 定义一个 Model 。
 *
 * 目前，这个函数的功能只是将传入的 hook 原样返回，主要是为了提升代码可读性、少写几个
 * typescript 类型。
 */
export function defineModel<Actions, State>(
  hook: ModelDefinition<Actions, State>,
): ModelDefinition<Actions, State> {
  return hook;
}

/**
 * 根据 Model 定义的映射，生成一个 Store 。
 */
export function createStore<DefinitionsMap extends AnyModelDefinitionsMap>(
  definitionsMap: DefinitionsMap,
): Store<DefinitionsMap> {
  // 将 definitionsMap 转换为数组形式，便于后续遍历
  const names: readonly string[] = Object.keys(definitionsMap);
  const definitions: readonly AnyModelDefinition[] = names.map((name) => definitionsMap[name]);

  // 创建一个 provider ，用于 Store 与 Model 的数据交换
  const [useRuntime, RuntimeProvider] = createRuntimeOnlyContext<StoreRuntime>();

  // 创建 Store 组件，用于运行与承载 Model
  const Store: StoreComponentType = ({ children }) => {
    // Model 的运行结果，我们能确保 hook 严格按顺序执行，所以其结果可以用数组保存
    const snapshots = useConstant((): ModelSnapshot[] => new Array(definitions.length));

    // 与使用 useModel 的后代组件进行数据交换的 API ，通过 RuntimeProvider 下发
    const runtime = useConstant((): StoreRuntime => {
      return { callbacks: definitions.map(() => new Set()), snapshots };
    });

    // 按顺序执行 Model hook ，并将运行结果存储在 snapshots 中
    for (let index = 0; index < definitions.length; index += 1) {
      const definition = definitions[index];
      const callbacks = runtime.callbacks[index];
      // 不使用 definitions[index]() 避免通过 this 暴露自身
      const snapshot = definition();
      // 储存 hook 运行结果
      snapshots[index] = snapshot;

      useEffect(() => {
        // 当 hook 运行结果发生变化时，触发回调函数
        callbacks.forEach((callback) => callback());
      }, snapshot);
    }

    return <RuntimeProvider value={runtime}>{children}</RuntimeProvider>;
  };

  Store.displayName = 'Store';

  return names.reduce((map, name, index) => {
    (map as ModelConsumeHooksMap<AnyModelDefinitionsMap>)[`use${name}`] = useModel;
    return map;

    function useModel<Actions, State, SelectedState>(
      select: ModelStateSelector<State, SelectedState> = defaultSelect as typeof select,
      deps?: DependencyList,
    ): [selected: SelectedState, actions: Actions] {
      // 从 Store 中获取 runtime API
      const runtime = useRuntime();
      // select 不计入 deps 当中，以减少 select 操作的执行次数
      const selectRef = useRef(select);

      // 从 Store 中读取 Model 快照
      const readSnapshot = useConstant(() => () => {
        return runtime.snapshots[index] as [state: State, actions: Actions];
      });

      // 触发一次更新
      const update = useConstant(() => () => {
        const snapshot = readSnapshot();
        setActions(() => snapshot[1]);
        setSelected((prev) => selectRef.current(snapshot[0], prev));
      });

      // 在当前组件内部维护新的状态
      const [actions, setActions] = useState(() => readSnapshot()[1]);
      const [selected, setSelected] = useState(() => select(readSnapshot()[0]));

      useEffect(() => {
        selectRef.current = select;
      });

      useEffect(() => {
        // runtime 或是 deps 内容发生更新时，主动触发一次更新
        update();
      }, ([runtime] as DependencyList).concat(deps));

      useEffect(() => {
        // 注册回调，在 Model 更新时触发调用
        const callbacks = runtime.callbacks[index];
        callbacks.add(update);
        return () => {
          callbacks.delete(update);
        };
      }, [runtime]);

      return [selected, actions];
    }
  }, Store as Store<DefinitionsMap>);
}

function defaultSelect<State>(state: State): State {
  return state;
}

/**
 * Model 在 Store 中运行的快照，其实就是 ModelDefinition hook 的返回结果。
 */
type ModelSnapshot = ReturnType<ModelDefinition<unknown, unknown>>;

/**
 * 内部使用的 runtime API ， useModel() 会使用此 API 进行初始化与注册。
 */
interface StoreRuntime {
  /**
   * 储存所有 Model 变更的回调函数。
   */
  readonly callbacks: readonly Set<() => void>[];
  /**
   * 所有 Model 在 Store 中运行的快照。
   */
  readonly snapshots: readonly ModelSnapshot[];
}
