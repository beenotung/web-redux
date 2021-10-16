import {
  ID,
  RootAction,
  Selector,
  SelectorKey,
  SocketMessage,
  SocketMessageType,
} from 'common'

export type StoreClient = ReturnType<typeof createStoreClient>

export type Unsubscribe = () => void

export function createStoreClient(socket: WebSocket) {
  let nextID = 1

  const state_listener_dict: Record<ID, (sub_state: any) => void> = {}

  socket.addEventListener('message', (ev) => {
    let message: SocketMessage = JSON.parse(String(ev.data))
    switch (message.type) {
      case SocketMessageType.update: {
        let listener = state_listener_dict[message.id]
        listener?.(message.state)
        return
      }
      default:
        console.debug('received unknown socket message:', message)
    }
  })

  let messageBuffer: string[] = []

  socket.addEventListener('open', () => {
    if (messageBuffer.length === 0) return
    debug('flush socket message buffer:', messageBuffer)
    messageBuffer.forEach((msg) => socket.send(msg))
    messageBuffer = []
  })

  function sendMessage(message: SocketMessage) {
    let msg = JSON.stringify(message)
    if (socket.readyState === socket.OPEN) {
      socket.send(msg)
    } else {
      debug('socket not ready, save pending message to buffer:', message)
      messageBuffer.push(msg)
    }
  }

  function dispatch(action: RootAction): void {
    sendMessage({
      type: SocketMessageType.dispatch,
      action,
    })
  }

  function subscribe<Key extends SelectorKey>(
    key: Key,
    state_listener: (subState: ReturnType<Selector<Key>>) => void,
  ): Unsubscribe {
    const id = nextID
    nextID++

    state_listener_dict[id] = state_listener

    sendMessage({
      type: SocketMessageType.subscribe,
      key,
      id,
    })

    function unsubscribe() {
      delete state_listener_dict[id]
      sendMessage({
        type: SocketMessageType.unsubscribe,
        id,
      })
    }

    return unsubscribe
  }

  function close() {
    socket.close()
    Object.keys(state_listener_dict).forEach(
      (key) => delete state_listener_dict[key],
    )
  }

  return {
    dispatch,
    subscribe,
    close,
  }
}

let verbose = false
let debug = verbose ? console.debug.bind(console) : noop

function noop() {}
