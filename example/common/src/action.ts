import { ID } from './state'
import type { Dispatch } from 'web-redux-client'

export enum ActionType {
  sign_up,
  login,
  change_username,
}

export type SignUpAction = {
  type: ActionType.sign_up
  username: string
  password: string
}

export type LoginAction = {
  type: ActionType.login
  username: string
  password: string
}

export type ChangeUsernameAction = {
  type: ActionType.change_username
  user_id: ID
  username: string
}

export type RootAction = SignUpAction | LoginAction | ChangeUsernameAction

export type RootDispatch = Dispatch<RootAction>
