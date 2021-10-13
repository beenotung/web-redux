import { RootAction } from './action'
import { SelectorKey } from './selector'
import { ID } from './state'

export enum SocketMessageType {
  dispatch,
  subscribe,
  update,
  unsubscribe,
}

/* client or storage to server */
export type DispatchMessage = {
  type: SocketMessageType.dispatch
  action: RootAction
}

/* client to server */
export type SubscribeMessage = {
  type: SocketMessageType.subscribe
  key: SelectorKey
  id: ID
}

/* server to client */
export type StateUpdateMessage<SubState = unknown> = {
  type: SocketMessageType.update
  id: ID
  state: SubState
}

/* client to server */
export type UnsubscribeMessage = {
  type: SocketMessageType.unsubscribe
  id: ID
}

export type SocketMessage =
  | DispatchMessage
  | SubscribeMessage
  | StateUpdateMessage
  | UnsubscribeMessage
