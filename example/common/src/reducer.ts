import { CollectionData, DictData, ID, RootState } from './state'
import { Collection, Dict } from 'live-data-sync'
import { newDB } from 'better-sqlite3-schema'

export function initialState(): RootState {
  let db = newDB({ path: 'data/state.db', migrate: false })
  let collection = new Collection<CollectionData>(db)
  let dict = new Dict<DictData>(db)
  let item_count = Object.keys(collection.data.items).length
  return {
    collection,
    dict,
    item_count,
  }
}

export let reducer_dict = {
  addItem(state: RootState, options: { text: string }): RootState {
    let id = state.collection.add('items', {
      id: null as any,
      text: options.text,
      tick: 0,
    }) as number
    state.collection.update('items', id, { id })
    return {
      ...state,
      item_count: state.item_count + 1,
    }
  },

  tickItem(state: RootState, options: { id: ID }): RootState {
    let id = options.id as number
    let item = state.collection.data.items[id]
    state.collection.update('items', id, { tick: item.tick + 1 })
    return { ...state }
  },

  renameItem(state: RootState, options: { id: ID; text: string }): RootState {
    let id = options.id as number
    state.collection.update('items', id, { text: options.text })
    return { ...state }
  },

  deleteItem(state: RootState, options: { id: ID }): RootState {
    let id = options.id as number
    if (!(id in state.collection.data.items)) {
      return state
    }
    state.collection.delete('items', id)
    return {
      ...state,
      item_count: state.item_count - 1,
    }
  },
}

export type ReducerDict = typeof reducer_dict
