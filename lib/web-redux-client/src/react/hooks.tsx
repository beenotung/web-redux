import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { SocketClient } from '../socket-client'
import { createStoreClient, StoreClient, Unsubscribe } from '../store-client'
import {
  Action,
  Dispatch,
  SelectorDict,
  SelectorKey,
  SelectorState,
} from 'web-redux'

export const StoreContext = createContext<StoreClient<any, any> | null>(null)

export function StoreProvider(props: {
  url: string
  children: JSX.Element
  debug?: boolean
}) {
  const { url, children, debug } = props
  const store = useMemo(
    () => createStoreClient(new SocketClient({ url, debug })),
    [url, debug],
  )
  useEffect(() => () => store.close(), [store])
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore<
  RootSelectorDict extends SelectorDict<any, any, any>,
  RootAction extends Action,
>(): StoreClient<RootSelectorDict, RootAction> {
  const store = useContext(StoreContext)

  if (!store) {
    throw new ReferenceError(
      'Store is not defined in context. You should wrap the component inside <StoreContext.Provider value={store}>',
    )
  }

  return store
}

export function useDispatch<RootAction extends Action>(): Dispatch<RootAction> {
  const store = useStore()
  return store.dispatch
}

export type SuspendState<
  RootSelectorDict extends SelectorDict<any, any, any>,
  Key extends SelectorKey<RootSelectorDict>,
> =
  | {
      isLoading: true
    }
  | {
      isLoading: false
      value: SelectorState<RootSelectorDict, Key>
    }

export function useSelector<
  RootSelectorDict extends SelectorDict<any, any, any>,
  Key extends string & SelectorKey<RootSelectorDict>,
>(selector: Key) {
  const store = useStore()

  const [state, setState] = useState<SuspendState<RootSelectorDict, Key>>({
    isLoading: true,
  })

  useEffect(
    () =>
      store.subscribe(selector, (value: SelectorState<RootSelectorDict, Key>) =>
        setState({ isLoading: false, value }),
      ),
    [selector, store],
  )

  return state
}

export function useSelectorObject<
  RootSelectorDict extends SelectorDict<any, any, any>,
  Key extends string & SelectorKey<RootSelectorDict>,
  Field extends string,
>(selectorObject: Record<Field, Key>) {
  const store = useStore()

  type State = SuspendState<RootSelectorDict, Key>
  type StateDict = Record<Field, State>
  const [state, setState] = useState<StateDict>(() => {
    let state = {} as StateDict
    for (let key in selectorObject) {
      state[key] = { isLoading: true }
    }
    return state
  })

  useEffect(() => {
    let unsubscribeList: Unsubscribe[] = []
    for (let key in selectorObject) {
      let selector = selectorObject[key]
      let unsubscribe = store.subscribe(
        selector,
        (value: SelectorState<RootSelectorDict, Key>) =>
          setState((state) => ({
            ...state,
            [key]: { isLoading: false, value },
          })),
      )
      unsubscribeList.push(unsubscribe)
    }
    return () => unsubscribeList.forEach((unsubscribe) => unsubscribe())
  }, [selectorObject, store])

  return state
}
