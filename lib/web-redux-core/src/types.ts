export type ID = number | string

export type Selector<State, SelectorOptions, SubState> = (
  state: State,
  selectorOptions: SelectorOptions,
  callback: Callback<SubState>,
) => void

export type Reducer<State, ActionOptions> = (
  state: State,
  actionOptions: ActionOptions,
) => State

export type SelectorDict<
  State,
  SelectorName extends string,
  SelectorOptions,
  SubState,
> = Record<SelectorName, Selector<State, SelectorOptions, SubState>>

export type ReducerDict<
  State,
  ActionName extends string,
  ActionOptions,
> = Record<ActionName, Reducer<State, ActionOptions>>

export type ExtractActionOptions<
  AppReducerDict extends ReducerDict<any, any, any>,
  ActionName extends keyof AppReducerDict,
> = Parameters<AppReducerDict[ActionName]>[1]

export type ExtractSelectorOptions<
  AppSelectorDict extends SelectorDict<any, any, any, any>,
  SelectorName extends keyof AppSelectorDict,
> = Parameters<AppSelectorDict[SelectorName]>[1]

export type ExtractSelectorSubState<
  AppSelectorDict extends SelectorDict<any, any, any, any>,
  SelectorName extends keyof AppSelectorDict,
> = CallbackData<Parameters<AppSelectorDict[SelectorName]>[2]>

export type Callback<T> = (data: T) => void

export type CallbackData<C extends Callback<any>> = Parameters<C>[0]
