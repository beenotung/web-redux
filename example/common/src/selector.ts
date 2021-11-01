import { RootState } from './state'

let MaxItemPerPage = 20

export let selector_dict = {
  item_list(state: RootState, options: { offset?: number; count?: number }) {
    let offset = options.offset || 0
    let count = options.count || MaxItemPerPage
    count = Math.min(count, MaxItemPerPage)

    return Object.values(state.item_list.dict).slice(offset, offset + count)
  },

  item_count(state: RootState, options: {}) {
    return state.item_list.dict.size
  },
}

export type SelectorDict = typeof selector_dict
