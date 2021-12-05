import type {
  ExtractActionOptions,
  ExtractSelectorOptions,
  ExtractSelectorCallback,
  ReducerDict,
  SelectorDict,
  ExtractActionResult,
  SubscribeMessage,
  UnsubscribeMessage,
  Callback,
  SocketMessage,
} from 'web-redux-core'
import type { SocketEventHandlers, SocketOptions } from './socket-client'
import type { StoreClient, Unsubscribe } from './types'
import { SocketMessageType } from 'web-redux-core'
import { SocketClient } from './socket-client'

export interface WebClientOptions {
  baseUrl: string
  socketOptions: SocketOptions
  onSocketClose: Callback<void>
}

interface Subscription<SubState = unknown> {
  subscribeMessage: string
  receiveSubState: Callback<SubState>
}

export class WebClient<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppReducerDict extends ReducerDict<State, any, any, any>,
> implements
    SocketEventHandlers<SocketMessage>,
    StoreClient<State, AppSelectorDict, AppReducerDict>
{
  private dispatchUrl: string
  private socket: SocketClient<SocketMessage>

  private subscribeMessageDict: Record<number, Subscription> = {}
  private nextSubscriptionID = 1

  readonly onSocketClose: Callback<void>

  constructor(options: WebClientOptions) {
    this.dispatchUrl = options.baseUrl + '/dispatch/'
    this.onSocketClose = () => {
      this.teardown()
      options.onSocketClose()
    }
    this.socket = new SocketClient({
      socketOptions: options.socketOptions,
      eventHandlers: this,
    })
  }

  readonly onSocketOpen = () => {
    Object.values(this.subscribeMessageDict).forEach((subscription) =>
      this.socket.send(subscription.subscribeMessage),
    )
  }

  readonly onSocketMessage = () => {}

  dispatch = async <ActionName extends keyof AppReducerDict>(
    actionName: ActionName,
    actionOptions: ExtractActionOptions<AppReducerDict, ActionName>,
  ): Promise<ExtractActionResult<AppReducerDict, ActionName>> => {
    return fetch(this.dispatchUrl + actionName, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionOptions),
    }).then((res) => res.json())
  }

  subscribe = <SelectorName extends keyof AppSelectorDict>(
    selectorName: SelectorName,
    selectorOptions: ExtractSelectorOptions<AppSelectorDict, SelectorName>,
    receiveSubState: ExtractSelectorCallback<AppSelectorDict, SelectorName>,
  ): Unsubscribe => {
    const id = this.nextSubscriptionID
    this.nextSubscriptionID++
    const message: SubscribeMessage<
      SelectorName,
      ExtractActionOptions<AppSelectorDict, SelectorName>
    > = [SocketMessageType.subscribe, id, selectorName, selectorOptions]
    const data = JSON.stringify(message)
    this.subscribeMessageDict[id] = {
      subscribeMessage: data,
      receiveSubState,
    }
    this.socket.send(data)
    const unsubscribe = () => {
      delete this.subscribeMessageDict[id]
      const message: UnsubscribeMessage = [SocketMessageType.unsubscribe, id]
      this.socket.send(JSON.stringify(message))
    }
    return unsubscribe
  }

  private teardown() {
    this.subscribeMessageDict = {}
  }

  close = () => {
    this.teardown()
    this.socket.close(SocketClient.NORMAL_CLOSURE, 'normal closure')
  }
}
