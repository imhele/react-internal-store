import React, {
  DependencyList,
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  AnyModelDefinition,
  AnyModelDefinitionsMap,
  ModelConsumeHooksMap,
  ModelDefinition,
  Store,
  StoreComponentType,
} from './interfaces';
import { useConstant } from './utils/hooks';
import { createRuntimeOnlyContext } from './utils/runtime-only-context';

/**
 * 定义一个 Model 。
 */
export function defineModel<Actions, State>(
  hook: ModelDefinition<Actions, State>['hook'],
): ModelDefinition<Actions, State> {
  return { hook };
}

export function createStore<DefinitionsMap extends AnyModelDefinitionsMap>(
  definitionsMap: DefinitionsMap,
): Store<DefinitionsMap> {
  const [useRuntime, RuntimeProvider] = createRuntimeOnlyContext<StoreRuntime>();

  const models = Object.keys(definitionsMap).map((name) => {
    const definition = definitionsMap[name];
    const [useState, StateProvider] = createRuntimeOnlyContext(`${name}State`);
    const [useActions, ActionsProvider] = createRuntimeOnlyContext(`${name}Actions`);
    return { ActionsProvider, definition, name, StateProvider, useActions, useState } as const;
  });

  const Store: StoreComponentType = ({ children }) => {
    const modelStatesMemo = useConstant(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new WeakMap<AnyModelDefinition, readonly [state: any]>();
    });

    const setCallbacksMemo = useConstant(() => {
      return new WeakMap<AnyModelDefinition, Dispatch<SetStateAction<readonly UpdateCallback[]>>>();
    });

    const runtime = useConstant((): StoreRuntime => {
      return {
        register: (model, callback) => {
          const setCallbacks = read(setCallbacksMemo, model);
          setCallbacks((prev) => prev.concat(callback));
          return () => setCallbacks((prev) => prev.filter((exists) => exists !== callback));
        },
        snapshot: (model) => read(modelStatesMemo, model)[0],
      };

      function read<Value>(
        memo: WeakMap<AnyModelDefinition, Value>,
        definition: AnyModelDefinition,
      ): Value {
        const value = memo.get(definition);
        if (!value) throw new Error('Failed to read the model, it may not be mounted.');
        return value;
      }
    });

    return models.reduce((element, model) => {
      const [state, actions] = model.definition.hook();
      const [callbacks, setCallbacks] = useState<readonly UpdateCallback[]>([]);

      useEffect(() => {
        callbacks.forEach((callback) => callback(state));
      }, [state]);

      modelStatesMemo.set(model.definition, state);
      setCallbacksMemo.set(model.definition, setCallbacks);

      return (
        <model.ActionsProvider value={actions}>
          <model.StateProvider value={state}>{element}</model.StateProvider>
        </model.ActionsProvider>
      );
    }, <RuntimeProvider value={runtime}>{children}</RuntimeProvider>);
  };

  Store.displayName = 'Store';

  return models.reduce((map, model) => {
    (map as ModelConsumeHooksMap<AnyModelDefinitionsMap>)[`use${model.name}`] = useModel;
    return map;

    function useModel<SelectedState>(
      select: (state: unknown) => SelectedState = defaultSelect as never,
      deps?: DependencyList,
    ): [selected: SelectedState, actions: unknown] {
      const runtime = useRuntime();
      const actions = model.useActions();
      const selectorRef = useRef(select);

      selectorRef.current = select;

      const [selected, setSelected] = useState(() => {
        return select(runtime.snapshot(model.definition));
      });

      useEffect(() => {
        return runtime.register(model.definition, (next: unknown) => {
          setSelected(selectorRef.current(next));
        });
      }, [runtime]);

      useEffect(() => {
        setSelected(select(runtime.snapshot(model.definition)));
      }, ([runtime] as DependencyList).concat(deps));

      return [selected, actions];
    }
  }, Store as Store<DefinitionsMap>);
}

function defaultSelect<State>(state: State): State {
  return state;
}

/**
 * Model 状态变更的回调函数。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UpdateCallback<State = any> = (state: State) => void;

/**
 * 内部使用的 runtime API ， useModel() 会使用此 API 进行初始化与注册。
 */
interface StoreRuntime {
  /**
   * 在 definition 对应的 Model 上注册一个回调函数，在其状态变更时调用。
   */
  readonly register: <Actions, State>(
    definition: ModelDefinition<Actions, State>,
    callback: UpdateCallback<State>,
  ) => () => void;
  /**
   * 获取 definition 对应的 Model 当前的状态快照。
   */
  readonly snapshot: <Actions, State>(definition: ModelDefinition<Actions, State>) => State;
}
