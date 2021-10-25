import { Action } from 'web-redux-core'

const initialAction = { type: '@@INIT' } as any

export type SelectorType<RootState, Options = unknown, SubState = unknown> = {
  options: Options
  map_state: (state: RootState, options: Options) => SubState
  receive_state: (sub_state: SubState) => void
}

export type Unsubscribe = () => void

export type Reducer<State, RootAction extends Action> = (
  state: State | undefined,
  action: RootAction,
) => State

export type StoreServer<RootState, RootAction extends Action> = {
  getState: () => RootState
  replaceReducer: (newReducer: Reducer<RootState, RootAction>) => void
  dispatch: (action: RootAction) => void
  subscribe: <SubState>(
    selector: SelectorType<RootState, SubState>,
  ) => Unsubscribe
}

export function createStoreServer<RootState, RootAction extends Action>(
  reducer: (state: RootState | undefined, action: RootAction) => RootState,
): StoreServer<RootState, RootAction> {
  let state = reducer(undefined, initialAction)
  type Selector<SubState> = SelectorType<RootState, SubState>
  // Selector<SubState> -> SubState
  let selector_map = new Map<Selector<any>, any>()
  function getState(): RootState {
    return state
  }
  function replaceReducer(newReducer: typeof reducer) {
    reducer = newReducer
  }
  function dispatch(action: RootAction): void {
    let newState = reducer(state, action)
    if (newState === state) return
    state = newState
    selector_map.forEach((old_sub_state, selector) => {
      let new_sub_state = selector.map_state(state, selector.options)
      if (new_sub_state !== old_sub_state) {
        selector.receive_state(new_sub_state)
        selector_map.set(selector, new_sub_state)
      }
    })
  }
  function subscribe<SubState>(selector: Selector<SubState>) {
    let sub_state = selector.map_state(state, selector.options)
    selector_map.set(selector, sub_state)
    selector.receive_state(sub_state)

    function unsubscribe(): void {
      selector_map.delete(selector)
    }

    return unsubscribe
  }

  return {
    getState,
    replaceReducer,
    dispatch,
    subscribe,
  }
}
