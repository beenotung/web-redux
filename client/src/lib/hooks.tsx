import { SelectorKey, Selector, SocketMessageType, RootAction } from 'common'
import { createContext, useEffect, useState } from 'react'
import { createStoreClient, StoreClient } from './store'

export let StoreContext = createContext<StoreClient | null>(null)

enum Status {
  loading,
  ready,
}

export function connect<Key extends SelectorKey>(props: {
  selector: Key
  renderLoading: () => JSX.Element
  render: (props: {
    state: ReturnType<Selector<Key>>
    store: StoreClient
    dispatch: (action: RootAction) => void
  }) => JSX.Element
}) {
  return () => (
    <StoreContext.Consumer>
      {(store) => {
        if (!store) {
          throw new ReferenceError(
            'store client is not defined. You should wrap the component inside <StoreContext.Provider value={store}>',
          )
        }
        return <Connected store={store} {...props} />
      }}
    </StoreContext.Consumer>
  )
}

export function Connected<Key extends SelectorKey>(props: {
  store: StoreClient
  selector: Key
  renderLoading: () => JSX.Element
  render: (props: {
    state: ReturnType<Selector<Key>>
    store: StoreClient
    dispatch: (action: RootAction) => void
  }) => JSX.Element
}) {
  type SubState = ReturnType<Selector<Key>>

  type State =
    | {
        status: Status.loading
      }
    | {
        status: Status.ready
        subState: SubState
      }

  const key = props.selector
  const store = props.store
  const { subscribe, dispatch } = store

  const [state, setState] = useState<State>({ status: Status.loading })

  useEffect(() => {
    let state_listener = (subState: SubState) =>
      setState({ status: Status.ready, subState })
    let unsubscribe = subscribe(key, state_listener)
    return unsubscribe
  }, [key, subscribe])

  if (state.status === Status.loading) {
    const Component = props.renderLoading
    return <Component />
  } else {
    const Component = props.render
    return (
      <Component state={state.subState} store={store} dispatch={dispatch} />
    )
  }
}
