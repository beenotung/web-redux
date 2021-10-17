import { SelectorKey, SelectorState } from 'common'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Socket } from './socket'
import { createStoreClient, StoreClient, Unsubscribe } from './store'

export const StoreContext = createContext<StoreClient | null>(null)

export function StoreProvider(props: {
  url: string
  children: JSX.Element
  debug?: boolean
}) {
  const { url, children, debug } = props
  const store = useMemo(
    () => createStoreClient(new Socket({ url, debug })),
    [url, debug],
  )
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

export type SuspendState<Key extends SelectorKey = SelectorKey> =
  | {
      isLoading: true
    }
  | {
      isLoading: false
      value: SelectorState<Key>
    }

export function useSelector<Key extends SelectorKey>(selector: Key) {
  const store = useStore()

  const [state, setState] = useState<SuspendState<Key>>({ isLoading: true })

  useEffect(
    () =>
      store.subscribe(selector, (value: SelectorState<Key>) =>
        setState({ isLoading: false, value }),
      ),
    [selector, store],
  )

  return state
}

export function useSelectorObject<Key extends SelectorKey, K extends string>(
  selectorObject: Record<K, Key>,
) {
  const store = useStore()

  const [state, setState] = useState<Record<K, SuspendState<Key>>>(() => {
    let state = {} as Record<K, SuspendState<Key>>
    for (let key in selectorObject) {
      state[key] = { isLoading: true }
    }
    return state
  })

  useEffect(() => {
    let unsubscribeList: Unsubscribe[] = []
    for (let key in selectorObject) {
      let selector = selectorObject[key]
      let unsubscribe = store.subscribe(selector, (value: SelectorState<Key>) =>
        setState((state) => ({ ...state, [key]: { isLoading: false, value } })),
      )
      unsubscribeList.push(unsubscribe)
    }
    return () => unsubscribeList.forEach((unsubscribe) => unsubscribe())
  }, [selectorObject, store])

  return state
}
