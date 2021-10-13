const initialAction = { type: '@@INIT' } as any

export type SelectorType<State, SubState = unknown> = {
  map_state: (state: State) => SubState
  receive_state: (sub_state: SubState) => void
}

export function createStoreServer<State, Action>(
  reducer: (state: State | undefined, action: Action) => State,
) {
  let state = reducer(undefined, initialAction)
  type Selector<SubState> = SelectorType<State, SubState>
  let selector_map = new Map<Selector<any>, any>()
  function getState(): State {
    return state
  }
  function dispatch(action: Action): void {
    state = reducer(state, action)
    selector_map.forEach((old_sub_state, selector) => {
      let new_sub_state = selector.map_state(state)
      if (new_sub_state !== old_sub_state) {
        selector.receive_state(new_sub_state)
        selector_map.set(selector, new_sub_state)
      }
    })
  }
  function subscribe<SubState>(selector: Selector<SubState>): void {
    let sub_state = selector.map_state(state)
    selector_map.set(selector, sub_state)
    selector.receive_state(sub_state)
  }
  function unsubscribe(selector: Selector<any>): void {
    selector_map.delete(selector)
  }
  return {
    getState,
    dispatch,
    subscribe,
    unsubscribe,
  }
}
