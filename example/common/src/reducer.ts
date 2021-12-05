import type { Callback } from 'web-redux-core'
import { CollectionData, DictData, ID, AppState } from './state'
import { Collection, Dict } from 'live-data-sync'
import { newDB } from 'better-sqlite3-schema'

export function initialState(): AppState {
  let db = newDB({ path: 'data/state.db', migrate: false })
  let collection = new Collection<CollectionData>(db)
  let dict = new Dict<DictData>(db)
  let item_count = collection.data.items
    ? Object.keys(collection.data.items).length
    : 0
  return {
    collection,
    dict,
    item_count,
  }
}

// for error messages
type ActionResult = string

export let reducer_dict = {
  addItem(
    state: AppState,
    options: { text: string },
    callback: Callback<ActionResult>,
  ): AppState {
    if (!options.text) {
      callback('Item text cannot be empty')
      return state
    }
    let id = state.collection.add('items', {
      id: null as any,
      text: options.text,
      tick: 0,
    }) as number
    state.collection.update('items', id, { id })
    callback('')
    return {
      ...state,
      item_count: state.item_count + 1,
    }
  },

  tickItem(
    state: AppState,
    options: { id: ID },
    callback: Callback<ActionResult>,
  ): AppState {
    let id = options.id as number
    let item = state.collection.data.items[id]
    state.collection.update('items', id, { tick: item.tick + 1 })
    callback('')
    return { ...state }
  },

  renameItem(
    state: AppState,
    options: { id: ID; text: string },
    callback: Callback<ActionResult>,
  ): AppState {
    if (!options.text) {
      callback('Item text cannot be empty')
      return state
    }
    let id = options.id as number
    state.collection.update('items', id, { text: options.text })
    callback('')
    return { ...state }
  },

  deleteItem(
    state: AppState,
    options: { id: ID },
    callback: Callback<ActionResult>,
  ): AppState {
    let id = options.id as number
    if (!(id in state.collection.data.items)) {
      return state
    }
    state.collection.delete('items', id)
    callback('')
    return {
      ...state,
      item_count: state.item_count - 1,
    }
  },
}

export type AppReducerDict = typeof reducer_dict
