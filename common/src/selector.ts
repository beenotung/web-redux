import { RootState } from '.'

export let selector_dict = {
  user_list: (state: RootState) => {
    return state.user_list.array.map((user) => {
      return { id: user.id, username: user.username }
    })
  },
  user_count: (state: RootState) => {
    return state.user_list.array.length
  },
}

export type SelectorKey = keyof typeof selector_dict

export type Selector<Key extends SelectorKey = SelectorKey> =
  typeof selector_dict[Key]

export type SelectorState<Key extends SelectorKey = SelectorKey> = ReturnType<
  Selector<Key>
>
