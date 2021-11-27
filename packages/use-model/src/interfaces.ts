import type { ReactElement, ReactNode } from 'react';

/**
 * Model 的定义。
 */
export interface ModelDefinition<Actions, State> {
  /**
   * Model 运行的主体逻辑，是一个 React Hook 。
   */
  readonly hook: () => readonly [state: State, actions: Actions];
}

/**
 * 挂载 Store 所需的 props 。
 */
export interface StoreProps {
  children?: ReactNode;
}

/**
 * Store 的组件类型。
 */
export interface StoreComponentType {
  (props: StoreProps): ReactElement;
  displayName: string;
}

/**
 * 任意 Model 定义。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyModelDefinition = ModelDefinition<any, any>;

/**
 * 任意 Model 定义的映射，其中 key 为 Model 的名称， value 为 Model 的定义。
 */
export type AnyModelDefinitionsMap = {
  readonly [ModelName in string]: AnyModelDefinition;
};

/**
 * 根据 Store 创建的消费 Model 状态的 React Hook useModel() ，可以从对应的
 * Store 中获取 state 与 actions 。
 */
export interface ModelConsumeHookType<Actions, State> {
  (): [state: State, actions: Actions];
  <SelectedState>(select: (state: State) => SelectedState): [
    state: SelectedState,
    actions: Actions,
  ];
}

/**
 * 根据 Model 定义的映射，生成对应的 useModel() React Hook 映射。
 *
 * @example
 * ```ts
 * interface DefinitionsMap {
 *   MyModel: Model<number, (next: number) => void>;
 * }
 * ⬇️ ⬇️ ⬇️
 * interface ConsumeHooksMap {
 *   useMyModel: ModelConsumeHookType<number, (next: number) => void>;
 * }
 * ```
 */
export type ModelConsumeHooksMap<DefinitionsMap extends AnyModelDefinitionsMap> = {
  [Name in keyof DefinitionsMap &
    string as `use${Name}`]: DefinitionsMap[Name] extends ModelDefinition<
    infer Actions,
    infer State
  >
    ? ModelConsumeHookType<Actions, State>
    : never;
};

/**
 * 根据 Models 定义创建的 Store 类型，其本身是一个 React Component ，同时包含所有
 * Models 对应的 React Hooks ，你可以通过 Store.useMyModel() 使用。
 */
export type Store<DefinitionsMap extends AnyModelDefinitionsMap> = StoreComponentType &
  ModelConsumeHooksMap<DefinitionsMap>;
