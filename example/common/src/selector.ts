import { Item, AppState } from './state'
import {
  makeSyncComputeCacheByOptions,
  makeSyncComputeCacheByArguments,
} from 'cache-compute'
import { Callback } from 'web-redux-core'

const MaxItemPerPage = 20

let selectItemList = (
  items: AppState['collection']['data']['items'],
  offset: number,
  count: number,
): Item[] => {
  return Object.values(items).slice(offset, offset + count)
}

export let selector_dict = {
  item_list(
    state: AppState,
    options: { offset?: number; count?: number },
    callback: Callback<Item[]>,
  ): void {
    let compute = makeSyncComputeCacheByArguments(selectItemList, callback)
    let offset = options.offset || 0
    let count = options.count || MaxItemPerPage
    count = Math.min(count, MaxItemPerPage)

    let items = state.collection.data.items
    compute(items, offset, count)
  },

  item_count(state: AppState, options: {}, callback: Callback<number>): void {
    callback(state.item_count)
  },
}

export type AppSelectorDict = typeof selector_dict
