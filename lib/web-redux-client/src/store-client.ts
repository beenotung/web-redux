import { SocketClient } from './socket-client'
import { SocketMessage, SocketMessageType } from 'web-redux'
import {
  ID,
  Action,
  SelectorKey,
  SelectorState,
  SelectorDict,
  Dispatch,
} from 'web-redux/src/types'

export type StoreClient<
  RootSelectorDict extends SelectorDict<any, any, any>,
  RootAction extends Action,
> = {
  dispatch: Dispatch<RootAction>
  subscribe: Subscribe<RootSelectorDict, string & SelectorKey<RootSelectorDict>>
  close: () => void
}

export type Subscribe<
  RootSelectorDict extends SelectorDict<any, any, any>,
  Key extends SelectorKey<RootSelectorDict>,
> = (
  key: Key,
  stateListener: (subState: SelectorState<RootSelectorDict, Key>) => void,
) => Unsubscribe

export type Unsubscribe = () => void

export function createStoreClient<
  RootSelectorDict extends SelectorDict<any, any, any>,
  RootAction extends Action,
>(socket: SocketClient): StoreClient<RootSelectorDict, RootAction> {
  type Subscription = {
    key: string & SelectorKey<RootSelectorDict>
    state_listener: (subState: any) => void
  }
  const subscriptionDict: Record<ID, Subscription> = {}
  let nextID = 1

  socket.addEventListener('reconnect', () => {
    Object.entries(subscriptionDict).forEach(([id, subscription]) => {
      socket.sendMessage({
        type: SocketMessageType.subscribe,
        key: subscription.key,
        id,
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

  function subscribe<Key extends string & SelectorKey<RootSelectorDict>>(
    key: Key,
    stateListener: (subState: SelectorState<RootSelectorDict, Key>) => void,
  ): Unsubscribe {
    const id = nextID
    nextID++

    subscriptionDict[id] = {
      key,
      state_listener: stateListener,
    }

    socket.sendMessage({
      type: SocketMessageType.subscribe,
      key,
      id,
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
