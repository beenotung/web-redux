import { SelectorKey, RootDispatch, SelectorState } from 'common'
import { useStore, useSelector, useDispatch, useSelectorObject } from './hooks'
import { StoreClient } from './store'

export type MapStateToProps<
  Field extends string,
  Key extends SelectorKey,
> = () => Record<Field, Key>

export type MapDispatchToProps<Field extends string> = () => Record<
  Field,
  (dispatch: RootDispatch) => void
>

export function connect<
  Key extends SelectorKey,
  StateField extends string,
  ActionField extends string,
>(
  mapStateToProps?: MapStateToProps<StateField, Key>,
  mapDispatchToProps?: MapDispatchToProps<ActionField>,
) {
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

export function connectSuspend<Key extends SelectorKey>(props: {
  selector: Key
  renderLoading: () => JSX.Element
  render: (props: {
    value: SelectorState<Key>
    store: StoreClient
    dispatch: RootDispatch
  }) => JSX.Element
}) {
  return () => {
    const store = useStore()
    const state = useSelector<Key>(props.selector)

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
