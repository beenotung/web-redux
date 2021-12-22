import { makeSyncComputeCacheByArguments } from 'cache-compute'
import { Callback } from 'web-redux-core'
import { AppState, ID, Item } from './state'

const MaxItemPerPage = 20

const selectItemList = (
  items: AppState['collection']['data']['items'],
  offset: number,
  count: number,
): Item[] => {
  console.log('select item list:', { offset, count })
  return Object.values(items).slice(offset, offset + count)
}
const selectItemListCache = newCache(selectItemList)

const selectItemDetail = (item: Item): Item => {
  console.log('select item detail:', item)
  return item
}
const selectItemDetailCache = newCache(selectItemDetail)

function newCache<F extends (...args: any[]) => any>(computeFn: F) {
  const cache = new WeakMap<
    Callback<ReturnType<F>>,
    (...args: Parameters<F>) => void
  >()
  function cacheCompute(callback: Callback<ReturnType<F>>) {
    let compute = cache.get(callback)
    if (!compute) {
      compute = makeSyncComputeCacheByArguments(computeFn, callback)
      cache.set(callback, compute)
    }
    return compute
  }
  return cacheCompute
}

export let selector_dict = {
  item_list(
    state: AppState,
    options: { offset?: number; count?: number },
    callback: Callback<Item[]>,
  ): void {
    let compute = selectItemListCache(callback)
    let offset = options.offset || 0
    let count = options.count || MaxItemPerPage
    count = Math.min(count, MaxItemPerPage)
    let items = state.collection.data.items || {}
    compute(items, offset, count)
  },

  item_count(state: AppState, options: {}, callback: Callback<number>): void {
    callback(state.item_count)
  },

  item_detail(
    state: AppState,
    options: { id: ID },
    callback: Callback<Item>,
  ): void {
    let compute = selectItemDetailCache(callback)
    let id = +options.id
    let item = state.collection.data.items[id]
    compute(item)
  },
}

export type AppSelectorDict = typeof selector_dict
