import type { DependencyList, ReactElement, ReactNode } from 'react';

/**
 * Model 的定义，其本质是一个约定了返回内容的 React Hook 。
 */
export interface ModelDefinition<Actions, State> {
  (): readonly [state: State, actions: Actions];
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
 * 根据 Model 状态选取一部分来使用。
 */
export type ModelStateSelector<State, SelectedState> = (
  state: State,
  prev?: SelectedState,
) => SelectedState;

/**
 * 根据 Store 创建的消费 Model 的 React Hook useModel() ，可以从对应的
 * Store 中获取 state 与 actions 。
 *
 * 如果传入了 select 函数，则会在每次 Model 更新时以最新的 state
 * 以及 select 上一次返回的内容为入参调用此函数，当返回的结果发生变化时，触发当前组件重新渲染。
 *
 * 另外的，还可以向 useModel 传入第二个参数 deps 作为依赖项列表，当 deps
 * 数组的内容发生变化时，将重新调用 select 函数，当返回的结果发生变化时，触发当前组件重新渲染。
 */
export interface ModelConsumeHookType<Actions, State> {
  (): [state: State, actions: Actions];
  <SelectedState>(
    select: ModelStateSelector<State, SelectedState> | undefined,
    deps?: DependencyList,
  ): [state: SelectedState, actions: Actions];
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
