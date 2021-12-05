export enum SocketMessageType {
  subscribe,
  update,
  unsubscribe,
}

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
  | SubscribeMessage
  | StateUpdateMessage
  | UnsubscribeMessage
