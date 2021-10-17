import { List, RootState, RootAction, ID, User, ActionType } from 'common'

export function setList<T>(list: List<T>, key: ID, value: T): List<T> {
  let dict: typeof list['dict'] = { ...list.dict, [key]: value }
  let array: typeof list['array'] = Object.values(dict)
  return {
    array,
    dict,
  }
}

export function emptyList(): List<any> {
  return {
    array: [],
    dict: {},
  }
}
export function initialState(): RootState {
  return {
    user_list: emptyList(),
    post_list: emptyList(),
    comment_list: emptyList(),
  }
}

function nextID(list: List<any>): ID {
  let dict = list.dict
  for (let i = 1; ; i++) {
    if (!(i in dict)) return i
  }
}

export const rootReducer = (
  state: RootState = initialState(),
  action: RootAction,
): RootState => {
  switch (action.type) {
    case ActionType.sign_up: {
      let user: User = {
        id: nextID(state.user_list),
        username: action.username,
        password: action.password,
      }
      return {
        ...state,
        user_list: setList(state.user_list, user.id, user),
      }
    }
    case ActionType.change_username: {
      let user = state.user_list.dict[action.user_id]
      if (!user) return state
      if (
        !state.user_list.array.some((user) => user.username === action.username)
      )
        return state
      user = {
        ...user,
        username: action.username,
      }
      return {
        ...state,
        user_list: setList(state.user_list, user.id, user),
      }
    }
    default:
      return state
  }
}
