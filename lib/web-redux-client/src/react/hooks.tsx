import type {
  ExtractSelectorOptions,
  ExtractSelectorSubState,
  ReducerDict,
  SelectorDict,
} from 'web-redux-core'
import type { WebClientOptions } from '../web-client'
import type { Dispatch, StoreClient } from '../types'
import { WebClient } from '../web-client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export interface StoreContextValue<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppReducerDict extends ReducerDict<State, any, any, any>,
> {
  store: StoreClient<State, AppSelectorDict, AppReducerDict>
  socketStatus: SocketStatus
}

export type SocketStatus = 'open' | 'close'

export const StoreContext = createContext<StoreContextValue<
  any,
  any,
  any
> | null>(null)

export function StoreProvider<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppReducerDict extends ReducerDict<State, any, any, any>,
>(props: {
  children: JSX.Element
  options: Omit<WebClientOptions, 'onSocketOpen' | 'onSocketClose'>
}) {
  const { children, options } = props
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('close')
  const store = useMemo(
    (): StoreClient<State, AppSelectorDict, AppReducerDict> =>
      new WebClient<State, AppSelectorDict, AppReducerDict>({
        ...options,
        onSocketOpen: () => setSocketStatus('open'),
        onSocketClose: () => setSocketStatus('close'),
      }),
    [options],
  )
  useEffect(() => () => store.close(), [store])
  return (
    <StoreContext.Provider
      value={{
        store,
        socketStatus,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStoreContext<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppReducerDict extends ReducerDict<State, any, any, any>,
>(): StoreContextValue<State, AppSelectorDict, AppReducerDict> {
  const context = useContext(StoreContext)
  if (!context) {
    throw new ReferenceError(
      'StoreContext is not initialized. You should the component inside <StoreProvider></StoreProvider> or <StoreContext.Provider></StoreContext.Provider>',
    )
  }
  return context
}

export function useStore<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppReducerDict extends ReducerDict<State, any, any, any>,
>(): StoreClient<State, AppSelectorDict, AppReducerDict> {
  const context = useStoreContext()
  return context.store
}

export function useSocketStatus(): SocketStatus {
  const context = useStoreContext()
  return context.socketStatus
}

export function useDispatch<
  State,
  AppReducerDict extends ReducerDict<State, any, any, any>,
>(): Dispatch<State, AppReducerDict> {
  const store = useStore()
  return store.dispatch
}

export type SuspendState<Value> =
  | {
      isLoading: true
    }
  | {
      isLoading: false
      value: Value
    }

export const LoadingState: SuspendState<any> = { isLoading: true }

export function useSelector<
  AppState,
  AppSelectorDict extends SelectorDict<AppState, any, any, any>,
  SelectorName extends keyof AppSelectorDict & string,
>(
  selector: SelectorName,
  options: ExtractSelectorOptions<AppSelectorDict, SelectorName>,
) {
  type SubState = ExtractSelectorSubState<AppSelectorDict, SelectorName>
  type State = SuspendState<SubState>
  const store = useStore()

  const [state, setState] = useState<State>(LoadingState)

  useEffect(
    () =>
      store.subscribe(selector, options, (value: SubState) =>
        setState({ isLoading: false, value }),
      ),
    [store, selector, JSON.stringify(options)],
  )

  return state
}
