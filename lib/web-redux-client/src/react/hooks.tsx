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

export const StoreContext = createContext<StoreClient<any, any, any> | null>(
  null,
)

export function StoreProvider<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppReducerDict extends ReducerDict<State, any, any, any>,
>(props: { children: JSX.Element; options: WebClientOptions }) {
  const { children, options } = props
  const store = useMemo(
    (): StoreClient<State, AppSelectorDict, AppReducerDict> =>
      new WebClient<State, AppSelectorDict, AppReducerDict>(options),
    [options],
  )
  useEffect(() => () => store.close(), [store])
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppReducerDict extends ReducerDict<State, any, any, any>,
>(): StoreClient<State, AppSelectorDict, AppReducerDict> {
  const store = useContext(StoreContext)

  if (!store) {
    throw new ReferenceError(
      'Store is not defined in context. You should wrap the component inside <StoreProvider options={options}> or <StoreContext.Provider value={store}>',
    )
  }

  return store
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
