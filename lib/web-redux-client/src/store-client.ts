import {
  ID,
  Action,
  SelectorKey,
  SelectorState,
  SelectorDict,
  Dispatch,
  SocketMessage,
  SocketMessageType,
  SelectorOptions,
} from 'web-redux-core'
import { SocketClient } from './socket-client'

export type StoreClient<
  RootSelectorDict extends SelectorDict<any, any, any, any>,
  RootAction extends Action,
> = {
  dispatch: Dispatch<RootAction>
  subscribe: Subscribe<RootSelectorDict, string & SelectorKey<RootSelectorDict>>
  close: () => void
}

export type Subscribe<
  RootSelectorDict extends SelectorDict<any, any, any, any>,
  Key extends SelectorKey<RootSelectorDict>,
> = (
  key: Key,
  options: SelectorOptions<RootSelectorDict, Key>,
  stateListener: (subState: SelectorState<RootSelectorDict, Key>) => void,
) => Unsubscribe

export type Unsubscribe = () => void

export function createStoreClient<
  RootSelectorDict extends SelectorDict<any, any, any, any>,
  RootAction extends Action,
>(socket: SocketClient): StoreClient<RootSelectorDict, RootAction> {
  type Subscription = {
    key: string & SelectorKey<RootSelectorDict>
    options: any
    state_listener: (subState: any) => void
  }
  const subscriptionDict: Record<ID, Subscription> = {}
  let nextID = 1

  socket.addEventListener('reconnect', () => {
    Object.entries(subscriptionDict).forEach(([id, subscription]) => {
      socket.sendMessage({
        type: SocketMessageType.subscribe,
        id,
        key: subscription.key,
        options: subscription.options,
      })
    })
  })

  socket.addEventListener('message', (ev) => {
    let message: SocketMessage = JSON.parse(String(ev.data))
    switch (message.type) {
      case SocketMessageType.update: {
        let subscription = subscriptionDict[message.id]
        subscription?.state_listener(message.state)
        return
      }
      default:
        console.debug('received unknown socket message:', message)
    }
  })

  function dispatch(action: RootAction) {
    socket.sendMessage({
      type: SocketMessageType.dispatch,
      action,
    })
  }

  function subscribe<
    Key extends string & SelectorKey<RootSelectorDict>,
    Options,
  >(
    key: Key,
    options: Options,
    stateListener: (subState: SelectorState<RootSelectorDict, Key>) => void,
  ): Unsubscribe {
    const id = nextID
    nextID++

    subscriptionDict[id] = {
      key,
      options,
      state_listener: stateListener,
    }

    socket.sendMessage({
      type: SocketMessageType.subscribe,
      key,
      id,
      options,
    })

    function unsubscribe() {
      delete subscriptionDict[id]
      socket.sendMessage({
        type: SocketMessageType.unsubscribe,
        id,
      })
    }

    return unsubscribe
  }

  function close() {
    let code = SocketClient.NORMAL_CLOSURE
    let reason = 'StoreClient closed'
    socket.close(code, reason)
    Object.keys(subscriptionDict).forEach((key) => delete subscriptionDict[key])
  }

  return {
    dispatch,
    subscribe,
    close,
  }
}
