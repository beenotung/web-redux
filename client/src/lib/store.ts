import { Socket } from './socket'
import { SelectorState } from 'common'
import {
  ID,
  RootAction,
  SelectorKey,
  SocketMessage,
  SocketMessageType,
} from 'common'

export type StoreClient = ReturnType<typeof createStoreClient>

export type Unsubscribe = () => void

type Subscription = {
  key: SelectorKey
  state_listener: (subState: SelectorState<SelectorKey>) => void
}

export function createStoreClient(socket: Socket) {
  let nextID = 1

  const subscription_dict: Record<ID, Subscription> = {}

  socket.addEventListener('reconnect', () => {
    console.debug('store reconnect')
    Object.entries(subscription_dict).forEach(([id, subscription]) => {
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
        let subscription = subscription_dict[message.id]
        subscription?.state_listener(
          message.state as SelectorState<SelectorKey>,
        )
        return
      }
      default:
        console.debug('received unknown socket message:', message)
    }
  })

  function dispatch(action: RootAction): void {
    socket.sendMessage({
      type: SocketMessageType.dispatch,
      action,
    })
  }

  function subscribe<Key extends SelectorKey>(
    key: Key,
    state_listener: (subState: SelectorState<Key>) => void,
  ): Unsubscribe {
    const id = nextID
    nextID++

    subscription_dict[id] = {
      key,
      state_listener: state_listener as (
        state: SelectorState<SelectorKey>,
      ) => void,
    }

    socket.sendMessage({
      type: SocketMessageType.subscribe,
      key,
      id,
    })

    function unsubscribe() {
      delete subscription_dict[id]
      socket.sendMessage({
        type: SocketMessageType.unsubscribe,
        id,
      })
    }

    return unsubscribe
  }

  function close() {
    let code = Socket.NORMAL_CLOSURE
    let reason = 'StoreClient closed'
    socket.close(code, reason)
    Object.keys(subscription_dict).forEach(
      (key) => delete subscription_dict[key],
    )
  }

  return {
    dispatch,
    subscribe,
    close,
  }
}
