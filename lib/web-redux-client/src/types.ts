import type {
  ExtractActionOptions,
  ExtractSelectorOptions,
  ExtractSelectorCallback,
  ReducerDict,
  SelectorDict,
  ExtractActionResult,
} from 'web-redux-core'

export interface StoreClient<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppReducerDict extends ReducerDict<State, any, any, any>,
> {
  dispatch: Dispatch<State, AppReducerDict>

  subscribe: Subscribe<State, AppSelectorDict>

  close(): void
}

export type Dispatch<
  State,
  AppReducerDict extends ReducerDict<State, any, any, any>,
> = <ActionName extends keyof AppReducerDict>(
  actionName: ActionName & string,
  actionOption: ExtractActionOptions<AppReducerDict, ActionName>,
) => Promise<ExtractActionResult<AppReducerDict, ActionName>>

export type Subscribe<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
> = <SelectorName extends keyof AppSelectorDict>(
  selectorName: SelectorName,
  selectorOptions: ExtractSelectorOptions<AppSelectorDict, SelectorName>,
  receiveSubState: ExtractSelectorCallback<AppSelectorDict, SelectorName>,
) => Unsubscribe

export type Unsubscribe = () => void
