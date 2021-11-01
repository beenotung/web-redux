import type {
  ReducerDict,
  SelectorDict,
  ExtractActionOptions,
  ExtractSelectorOptions,
  ExtractSelectorSubState,
} from 'web-redux-core'

export class StoreServer<
  State,
  AppReducerDict extends ReducerDict<State, any, any>,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
> {
  private state: State
  private subscriptionSet = new Set<{
    selectorName: keyof AppSelectorDict
    selectorOptions: ExtractSelectorOptions<AppSelectorDict, any>
    receiveSubState: (
      subState: ExtractSelectorSubState<AppSelectorDict, any>,
    ) => void
    subState: ExtractSelectorSubState<AppSelectorDict, any>
  }>()

  constructor(
    initialState: () => State,
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
    this.subscriptionSet.forEach(subscription => {
      const selector = this.selectorDict[subscription.selectorName]
      const newSubState = selector(this.state, subscription.selectorOptions)
      if (newSubState === subscription.subState) return
      subscription.subState = newSubState
      subscription.receiveSubState(newSubState)
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
    const subState = selector(this.state, selectorOptions)
    receiveSubState(subState)

    const subscription = {
      selectorName,
      selectorOptions,
      receiveSubState,
      subState,
    }
    this.subscriptionSet.add(subscription)

    const unsubscribe = () => {
      this.subscriptionSet.delete(subscription)
    }
    return unsubscribe
  }
}
