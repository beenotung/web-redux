import { RootState } from './state'

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

export type RootSelectorDict = typeof selector_dict
