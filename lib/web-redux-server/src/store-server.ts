import type {
  ReducerDict,
  SelectorDict,
  ExtractActionOptions,
  ExtractSelectorOptions,
  ExtractActionCallback,
  ExtractSelectorCallback,
} from 'web-redux-core'

export class StoreServer<
  AppState,
  AppSelectorDict extends SelectorDict<AppState, any, any, any>,
  AppReducerDict extends ReducerDict<AppState, any, any, any>,
> {
  private state: AppState
  private subscriptionSet = new Set<{
    selectorName: keyof AppSelectorDict
    selectorOptions: ExtractSelectorOptions<AppSelectorDict, any>
    receiveSubState: ExtractSelectorCallback<AppSelectorDict, any>
  }>()

  constructor(
    initialState: () => AppState,
    public selectorDict: AppSelectorDict,
    public reducerDict: AppReducerDict,
  ) {
    this.state = initialState()
  }

  getState() {
    return this.state
  }

  setState(state: AppState) {
    if (state === this.state) return
    this.state = state
    this.subscriptionSet.forEach((subscription) => {
      const selector = this.selectorDict[subscription.selectorName]
      selector(
        state,
        subscription.selectorOptions,
        subscription.receiveSubState,
      )
    })
  }

  dispatch<ActionName extends keyof AppReducerDict>(
    actionName: ActionName,
    actionOptions: ExtractActionOptions<AppReducerDict, ActionName>,
    callback: ExtractActionCallback<AppReducerDict, ActionName>,
  ) {
    const selector = this.reducerDict[actionName]
    const state = selector(this.state, actionOptions, callback)
    this.setState(state)
  }

  subscribe<SelectorName extends keyof AppSelectorDict>(
    selectorName: SelectorName,
    selectorOptions: ExtractSelectorOptions<AppSelectorDict, SelectorName>,
    receiveSubState: ExtractSelectorCallback<AppSelectorDict, SelectorName>,
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
