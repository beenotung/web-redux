import { ID, List, RootState } from './state'

export function initialState(): RootState {
  return {
    item_list: emptyList(),
  }
}

export let reducer_dict = {
  addItem(state: RootState, options: { text: string }): RootState {
    return {
      ...state,
      item_list: appendList(state.item_list, {
        id: state.item_list.next_id,
        text: options.text,
        tick: 0,
      }),
    }
  },

  tickItem(state: RootState, options: { id: ID }): RootState {
    return {
      ...state,
      item_list: updateListItem(state.item_list, options.id, item => ({
        ...item,
        tick: item.tick + 1,
      })),
    }
  },

  renameItem(state: RootState, options: { id: ID; text: string }): RootState {
    return {
      ...state,
      item_list: updateListItem(state.item_list, options.id, item => ({
        ...item,
        text: options.text,
      })),
    }
  },

  deleteItem(state: RootState, options: { id: ID }): RootState {
    return {
      ...state,
      item_list: removeListItem(state.item_list, options.id),
    }
  },
}

export type ReducerDict = typeof reducer_dict

function emptyList<T>(): List<T> {
  return {
    dict: {},
    next_id: 1,
    size: 0,
  }
}

function appendList<T>(list: List<T>, item: T): List<T> {
  return {
    dict: { ...list.dict, [list.next_id]: item },
    next_id: list.next_id + 1,
    size: list.size + 1,
  }
}

function removeListItem<T>(list: List<T>, id: ID): List<T> {
  if (!(id in list.dict)) {
    return list
  }
  const { [id]: item, ...newDict } = list.dict
  return {
    dict: newDict,
    size: list.size - 1,
    next_id: list.next_id,
  }
}

function updateListItem<T>(
  list: List<T>,
  id: ID,
  update: (item: T) => T,
): List<T> {
  if (!(id in list.dict)) {
    return list
  }
  const item = list.dict[id]
  const newItem = update(item)
  return {
    dict: { ...list.dict, [id]: newItem },
    next_id: list.next_id,
    size: list.size,
  }
}
