export enum SocketMessageType {
  dispatch,
  subscribe,
  update,
  unsubscribe,
}

/* client or storage to server */
export type DispatchMessage<ActionName = string, ActionOptions = unknown> = [
  type: SocketMessageType.dispatch,
  actionType: ActionName,
  actionOptions: ActionOptions,
]

/* client to server */
export type SubscribeMessage<
  SelectorName = string,
  SelectorOptions = unknown,
> = [
  type: SocketMessageType.subscribe,
  subscribeID: number,
  selectorType: SelectorName,
  selectorOptions: SelectorOptions,
]

/* server to client (response to subscribe) */
export type StateUpdateMessage<SubState = unknown> = [
  type: SocketMessageType.update,
  subscribeID: number,
  subState: SubState,
]

/* client to server */
export type UnsubscribeMessage = [
  type: SocketMessageType.unsubscribe,
  subscribeID: number,
]

export type SocketMessage =
  | DispatchMessage
  | SubscribeMessage
  | StateUpdateMessage
  | UnsubscribeMessage
