import { useStore, useSelector, useDispatch, useSelectorObject } from './hooks'
import { StoreClient } from '../store-client'
import {
  Action,
  Dispatch,
  SelectorDict,
  SelectorKey,
  SelectorState,
} from '../../../web-redux/src/types'

export type MapStateToProps<
  RootSelectorDict extends SelectorDict<any, any, any>,
  SelectorKey extends keyof RootSelectorDict,
  Field extends string,
> = () => Record<Field, SelectorKey>

export type MapDispatchToProps<
  RootAction extends Action,
  Field extends string,
> = () => Record<Field, (dispatch: Dispatch<RootAction>) => void>

export function connect<
  RootSelectorDict extends SelectorDict<any, any, any>,
  Key extends SelectorKey<RootSelectorDict>,
  RootAction extends Action,
  StateField extends string,
  ActionField extends string,
>(
  mapStateToProps?: MapStateToProps<RootSelectorDict, Key, StateField>,
  mapDispatchToProps?: MapDispatchToProps<RootAction, ActionField>,
): <Props, State>(
  Component: React.ComponentClass<Props, State>,
) => (props: Omit<Props, StateField | ActionField>) => JSX.Element {
  return function <Props, State>(
    Component: React.ComponentClass<Props, State>,
  ) {
    return function (props: Omit<Props, StateField | ActionField>) {
      const dispatch = useDispatch()

      let selectorObject = mapStateToProps ? mapStateToProps() : {}
      let selectorStateObject = useSelectorObject(selectorObject)

      let childProps = { ...props, ...selectorStateObject } as Props

      if (mapDispatchToProps) {
        let props = mapDispatchToProps()
        for (let key in props) {
          let method = props[key](dispatch)
          ;(childProps as any)[key] = method
        }
      }
      return <Component {...childProps} />
    }
  }
}

export function connectSuspend<
  RootSelectorDict extends SelectorDict<any, any, any>,
  Key extends string & SelectorKey<RootSelectorDict>,
  RootAction extends Action,
>(props: {
  selector: Key
  renderLoading: () => JSX.Element
  render: (props: {
    value: SelectorState<RootSelectorDict, Key>
    store: StoreClient<RootSelectorDict, RootAction>
    dispatch: Dispatch<RootAction>
  }) => JSX.Element
}) {
  return () => {
    const store = useStore<RootSelectorDict, RootAction>()
    const state = useSelector<RootSelectorDict, Key>(props.selector)

    let Loading = props.renderLoading
    let Content = props.render

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
