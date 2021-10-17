import { Action, ID, Key } from './types'

export enum SocketMessageType {
  dispatch,
  subscribe,
  update,
  unsubscribe,
}

/* client or storage to server */
export type DispatchMessage = {
  type: SocketMessageType.dispatch
  action: Action
}

/* client to server */
export type SubscribeMessage = {
  type: SocketMessageType.subscribe
  key: Key
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
