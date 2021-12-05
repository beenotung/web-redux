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
  onSocketOpen?: Callback<void>
  onSocketClose?: Callback<void>
  debug?: boolean
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

  private subscriptionDict: Record<number, Subscription> = {}
  private nextSubscriptionID = 1

  // readonly onSocketOpen: Callback<void>
  // readonly onSocketClose: Callback<void>
  // readonly onSocketMessage: Callback<SocketMessage>

  constructor(private options: WebClientOptions) {
    this.dispatchUrl = options.baseUrl + '/dispatch/'
    this.socket = new SocketClient({
      socketOptions: options.socketOptions,
      eventHandlers: this,
    })
  }

  onSocketOpen = () => {
    if (this.options.debug) {
      console.debug('web-redux websocket connected')
    }
    Object.values(this.subscriptionDict).forEach((subscription) =>
      this.socket.send(subscription.subscribeMessage),
    )
    this.options.onSocketOpen?.()
  }

  onSocketClose = () => {
    if (this.options.debug) {
      console.debug('web-redux websocket closed')
    }
    this.teardown()
    this.options.onSocketClose?.()
  }

  onSocketMessage = (message: SocketMessage) => {
    switch (message[0]) {
      case SocketMessageType.update: {
        const id: number = message[1]
        const subState = message[2]
        const subscription = this.subscriptionDict[id]
        if (subscription) {
          subscription.receiveSubState(subState)
        }
        break
      }
      default:
        if (this.options.debug) {
          console.debug('unexpected socket message:', message)
        }
    }
  }

  dispatch = <ActionName extends keyof AppReducerDict>(
    actionName: ActionName,
    actionOptions: ExtractActionOptions<AppReducerDict, ActionName>,
  ): Promise<ExtractActionResult<AppReducerDict, ActionName>> => {
    if (this.options.debug) {
      console.debug('web-redux dispatch', actionName, actionOptions)
    }
    return fetch(this.dispatchUrl + actionName, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionOptions),
    }).then((res) => res.json())
  }

  subscribe = <SelectorName extends keyof AppSelectorDict>(
    selectorName: SelectorName,
    selectorOptions: ExtractSelectorOptions<AppSelectorDict, SelectorName>,
    receiveSubState: ExtractSelectorCallback<AppSelectorDict, SelectorName>,
  ): Unsubscribe => {
    if (this.options.debug) {
      console.debug('web-redux subscribe', selectorName, selectorOptions)
    }
    const id = this.nextSubscriptionID
    this.nextSubscriptionID++
    const message: SubscribeMessage<
      SelectorName,
      ExtractActionOptions<AppSelectorDict, SelectorName>
    > = [SocketMessageType.subscribe, id, selectorName, selectorOptions]
    const data = JSON.stringify(message)
    this.subscriptionDict[id] = {
      subscribeMessage: data,
      receiveSubState: this.options.debug
        ? (subState) => {
            console.debug(
              'web-redux receiveSubState, selector:',
              selectorName,
              'subState:',
              subState,
            )
            receiveSubState(subState)
          }
        : receiveSubState,
    }
    this.socket.send(data)
    const unsubscribe = () => {
      delete this.subscriptionDict[id]
      const message: UnsubscribeMessage = [SocketMessageType.unsubscribe, id]
      this.socket.send(JSON.stringify(message))
    }
    return unsubscribe
  }

  private teardown() {
    this.subscriptionDict = {}
  }

  close = () => {
    this.teardown()
    this.socket.close(SocketClient.NORMAL_CLOSURE, 'normal closure')
  }
}
