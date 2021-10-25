export type ID = string | number
export type Key = string | number

export type Action = {
  type: Key
}

export type SelectorDict<
  RootState,
  SelectorKey extends Key,
  Options,
  SubState,
> = Record<SelectorKey, (state: RootState, options: Options) => SubState>

export type SelectorKey<Dict extends SelectorDict<any, any, any, any>> =
  keyof Dict

export type Selector<
  RootSelectorDict extends SelectorDict<any, any, any, any>,
  Key extends SelectorKey<RootSelectorDict>,
> = RootSelectorDict[Key]

export type StoreState<
  RootSelectorDict extends SelectorDict<any, any, any, any>,
> = Parameters<Selector<RootSelectorDict, keyof RootSelectorDict>>[0]

export type SelectorOptions<
  RootSelectorDict extends SelectorDict<any, any, any, any>,
  Key extends keyof RootSelectorDict,
> = Parameters<Selector<RootSelectorDict, Key>>[1]

export type SelectorState<
  RootSelectorDict extends SelectorDict<any, any, any, any>,
  Key extends SelectorKey<RootSelectorDict>,
> = ReturnType<Selector<RootSelectorDict, Key>>

export type Dispatch<RootAction extends Action> = (action: RootAction) => void
