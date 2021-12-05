import { useEffect, useMemo, useState } from 'react'
import type {
  ExtractActionOptions,
  ExtractSelectorOptions,
  ExtractSelectorSubState,
  Reducer,
  ReducerDict,
  SelectorDict,
} from 'web-redux-core'
import type { Dispatch, StoreClient, Unsubscribe } from '../types'
import {
  useStore,
  useSelector,
  useDispatch,
  SuspendState,
  LoadingState,
} from './hooks'

export type SelectorProps<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  Field extends string,
> = Record<Field, Selector<State, AppSelectorDict, keyof AppSelectorDict>>

export type MapStateToProps<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppSelectorProps extends SelectorProps<State, AppSelectorDict, any>,
> = () => AppSelectorProps

export type DispatchProps = Record<any, (...args: any[]) => void>

export type MapDispatchToProps<
  State,
  AppReducerDict extends ReducerDict<State, any, any, any>,
  AppDispatchProps extends DispatchProps,
> = (dispatch: Dispatch<State, AppReducerDict>) => AppDispatchProps

export function connect<
  AppState,
  AppSelectorDict extends SelectorDict<AppState, any, any, any>,
  AppReducerDict extends ReducerDict<AppState, any, any, any>,
  AppSelectorProps extends SelectorProps<AppState, AppSelectorDict, any>,
  AppDispatchProps extends DispatchProps,
>(
  mapStateToProps?: MapStateToProps<
    AppState,
    AppSelectorDict,
    AppSelectorProps
  >,
  mapDispatchToProps?: MapDispatchToProps<
    AppState,
    AppReducerDict,
    AppDispatchProps
  >,
): <Props, State>(
  Component: React.ComponentClass<Props, State>,
) => (
  props: Omit<Props, keyof AppSelectorProps | keyof AppDispatchProps>,
) => JSX.Element {
  return function componentConnector<Props, State>(
    Component: React.ComponentClass<Props, State>,
  ) {
    return function (
      props: Omit<Props, keyof AppSelectorProps | keyof AppDispatchProps>,
    ) {
      const dispatch = useDispatch()

      const selectorObject = useMemo(
        () => mapStateToProps?.(),
        [mapStateToProps],
      )

      const selectorStateObject = useSelectorObject<
        AppState,
        AppSelectorDict,
        AppSelectorProps
      >(selectorObject)

      const dispatchObject: AppDispatchProps | undefined = useMemo(() => {
        if (mapDispatchToProps) {
          return mapDispatchToProps(dispatch)
        }
      }, [dispatch, mapDispatchToProps])

      const childProps = {
        ...props,
        ...selectorStateObject,
        ...dispatchObject,
      } as unknown as Props

      return <Component {...childProps} />
    }
  }
}

export function connectSuspend<
  AppState,
  AppReducerDict extends ReducerDict<AppState, any, any, any>,
  AppSelectorDict extends SelectorDict<AppState, any, any, any>,
  SelectorName extends keyof AppSelectorDict & string,
>(props: {
  selectorName: SelectorName
  selectorOptions: ExtractSelectorOptions<AppSelectorDict, SelectorName>
  renderLoading: () => JSX.Element
  render: (props: {
    value: ExtractSelectorSubState<AppSelectorDict, SelectorName>
    store: StoreClient<AppState, AppSelectorDict, AppReducerDict>
    dispatch: Dispatch<AppState, AppReducerDict>
  }) => JSX.Element
}) {
  return () => {
    const store = useStore<AppState, AppSelectorDict, AppReducerDict>()
    const state = useSelector<AppState, AppSelectorDict, SelectorName>(
      props.selectorName,
      props.selectorOptions,
    )

    const Loading = props.renderLoading
    const Content = props.render

    return (
      <>
        {state.isLoading === true ? (
          <Loading />
        ) : (
          <Content
            value={state.value}
            store={store}
            dispatch={store.dispatch}
          />
        )}
      </>
    )
  }
}

export type Selector<
  AppState,
  AppSelectorDict extends SelectorDict<AppState, any, any, any>,
  SelectorName extends keyof AppSelectorDict,
> = {
  selectorName: SelectorName
  selectorOptions: ExtractSelectorOptions<AppSelectorDict, SelectorName>
}

function useSelectorObject<
  AppState,
  AppSelectorDict extends SelectorDict<AppState, any, any, any>,
  AppSelectorProps extends SelectorProps<AppState, AppSelectorDict, any>,
>(selectorObject: undefined | AppSelectorProps) {
  type State = {
    [Field in keyof AppSelectorProps]: SuspendState<
      ExtractSelectorSubState<
        AppSelectorDict,
        AppSelectorProps[Field]['selectorName']
      >
    >
  }

  const store = useStore()

  const [state, setState] = useState<State>(() => {
    const state = {} as State
    if (selectorObject) {
      for (const field in selectorObject) {
        state[field] = LoadingState
      }
    }
    return state
  })

  useEffect(() => {
    if (!selectorObject) return
    const unsubscribeList: Unsubscribe[] = []
    for (const field in selectorObject) {
      const selector = selectorObject[field]
      const unsubscribe = store.subscribe(
        selector.selectorName,
        selector.selectorOptions,
        (value: ExtractSelectorSubState<AppSelectorDict, typeof field>) =>
          setState((state) => ({
            ...state,
            [field]: { isLoading: false, value },
          })),
      )
      unsubscribeList.push(unsubscribe)
    }
    return () => unsubscribeList.forEach((unsubscribe) => unsubscribe())
  }, [store, JSON.stringify(selectorObject)])

  return state
}

export type ReducerObject<
  AppState,
  AppReducerDict extends ReducerDict<AppState, any, any, any>,
  ActionName extends keyof AppReducerDict,
  Field extends string,
> = Record<Field, AppReducerDict[ActionName]>
