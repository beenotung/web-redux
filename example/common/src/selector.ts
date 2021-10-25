import { RootState } from './state'

let MaxPageItems = 20

export let selector_dict = {
  user_list: (
    state: RootState,
    options: { offset?: number; count?: number },
  ) => {
    let offset = options.offset || 0
    let count = options.count || MaxPageItems
    count = Math.min(count, MaxPageItems)

    return state.user_list.array
      .map((user) => {
        return { id: user.id, username: user.username }
      })
      .slice(offset)
      .slice(0, count)
  },
  user_count: (state: RootState, options: {}) => {
    return state.user_list.array.length
  },
}

export type RootSelectorDict = typeof selector_dict
