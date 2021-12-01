import type {
  ReducerDict,
  SelectorDict,
  ExtractActionOptions,
  ExtractSelectorOptions,
  ExtractSelectorSubState,
} from 'web-redux-core'

export class StoreServer<
  AppState,
  AppReducerDict extends ReducerDict<AppState, any, any>,
  AppSelectorDict extends SelectorDict<AppState, any, any, any>,
> {
  private state: AppState
  private subscriptionSet = new Set<{
    selectorName: keyof AppSelectorDict
    selectorOptions: ExtractSelectorOptions<AppSelectorDict, any>
    receiveSubState: (
      subState: ExtractSelectorSubState<AppSelectorDict, any>,
    ) => void
  }>()

  constructor(
    initialState: () => AppState,
    public reducerDict: AppReducerDict,
    public selectorDict: AppSelectorDict,
  ) {
    this.state = initialState()
  }

  getState() {
    return this.state
  }

  dispatch<ActionName extends keyof AppReducerDict>(
    actionName: ActionName,
    actionOptions: ExtractActionOptions<AppReducerDict, ActionName>,
  ) {
    const reducer = this.reducerDict[actionName]
    const newState = reducer(this.state, actionOptions)
    if (newState === this.state) return
    this.state = newState
    this.subscriptionSet.forEach((subscription) => {
      const selector = this.selectorDict[subscription.selectorName]
      selector(
        this.state,
        subscription.selectorOptions,
        subscription.receiveSubState,
      )
    })
  }

  subscribe<SelectorName extends keyof AppSelectorDict>(
    selectorName: SelectorName,
    selectorOptions: ExtractSelectorOptions<AppSelectorDict, SelectorName>,
    receiveSubState: (
      subState: ExtractSelectorSubState<AppSelectorDict, SelectorName>,
    ) => void,
  ) {
    const selector = this.selectorDict[selectorName]
    selector(this.state, selectorOptions, receiveSubState)

    const subscription = {
      selectorName,
      selectorOptions,
      receiveSubState,
    }
    this.subscriptionSet.add(subscription)

    const unsubscribe = () => {
      this.subscriptionSet.delete(subscription)
    }
    return unsubscribe
  }
}
