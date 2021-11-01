import {
  DispatchMessage,
  SocketMessageType,
  StateUpdateMessage,
  SubscribeMessage,
  UnsubscribeMessage,
} from 'web-redux-core'
import { SocketClient } from './socket-client'

export class StoreClient<
  ActionName extends string,
  ActionOptions,
  SelectorName extends string,
  SelectorOptions,
  SubState,
> {
  private nextSubscriptionID = 1
  
  // subscribeID -> unsubscribe
  private subscriptionDict: Record<
    number,
    {
      subscribeID: number
      selectorName: SelectorName
      selectorOptions: SelectorOptions
      receivedSubState: (subState: SubState) => void
    }
  > = {}

  constructor(public socket: SocketClient) {
    socket.addEventListener('reconnect', () => {
      Object.values(this.subscriptionDict).forEach(subscription => {
        const msg: SubscribeMessage = [
          SocketMessageType.subscribe,
          subscription.subscribeID,
          subscription.selectorName,
          subscription.selectorOptions,
        ]
        socket.sendMessage(msg)
      })
    })

    socket.addEventListener('message', ev => {
      const msg: StateUpdateMessage<SubState> = JSON.parse(String(ev.data))
      if (msg[0] !== SocketMessageType.update) {
        console.debug('received unknown socket message:', msg)
        return
      }
      const subscription = this.subscriptionDict[msg[1]]
      if (!subscription) return
      subscription.receivedSubState(msg[2])
    })
  }

  dispatch(actionName: ActionName, actionOptions: ActionOptions) {
    const msg: DispatchMessage = [
      SocketMessageType.dispatch,
      actionName,
      actionOptions,
    ]
    this.socket.sendMessage(msg)
  }

  subscribe(
    selectorName: SelectorName,
    selectorOptions: SelectorOptions,
    receivedSubState: (subState: SubState) => void,
  ) {
    const subscribeID = this.nextSubscriptionID
    this.nextSubscriptionID++

    this.subscriptionDict[subscribeID] = {
      subscribeID,
      selectorName,
      selectorOptions,
      receivedSubState,
    }

    const msg: SubscribeMessage = [
      SocketMessageType.subscribe,
      subscribeID,
      selectorName,
      selectorOptions,
    ]
    this.socket.sendMessage(msg)

    const unsubscribe = () => {
      const msg: UnsubscribeMessage = [
        SocketMessageType.unsubscribe,
        subscribeID,
      ]
      this.socket.sendMessage(msg)
    }
    return unsubscribe
  }

  close() {
    const code = SocketClient.NORMAL_CLOSURE
    const reason = 'StoreClient closed'
    this.socket.close(code, reason)
    this.subscriptionDict = {}
  }
}
