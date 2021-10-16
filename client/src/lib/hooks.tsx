import { SelectorKey, Selector, RootAction } from 'common'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createStoreClient, StoreClient } from './store'

export const StoreContext = createContext<StoreClient | null>(null)

export function StoreProvider(props: { url: string; children: JSX.Element }) {
  const { url, children } = props
  const store = useMemo(() => createStoreClient(new WebSocket(url)), [url])
  useEffect(() => () => store.close(), [store])
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore() {
  const store = useContext(StoreContext)

  if (!store) {
    throw new ReferenceError(
      'Store is not defined in context. You should wrap the component inside <StoreContext.Provider value={store}>',
    )
  }

  return store
}

export function useDispatch() {
  const store = useStore()
  return store.dispatch
}

export function useSelector<Key extends SelectorKey>(selector: Key) {
  const store = useStore()

  type Value = ReturnType<Selector<Key>>
  type State =
    | {
        isLoading: true
      }
    | {
        isLoading: false
        value: Value
      }
  const [state, setState] = useState<State>({ isLoading: true })

  useEffect(
    () =>
      store.subscribe(selector, (value: Value) =>
        setState({ isLoading: false, value }),
      ),
    [selector, store],
  )

  return state
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
  return () => {
    const store = useStore()
    const state = useSelector<Key>(props.selector)

    let Loading = props.renderLoading
    let Content = props.render

    return (
      <>
        {state.isLoading ? (
          <Loading />
        ) : (
          <Content
            state={state.value}
            store={store}
            dispatch={store.dispatch}
          />
        )}
      </>
    )
  }
}
