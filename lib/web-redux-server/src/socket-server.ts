import type ws from 'typestub-ws'
import type { StoreServer } from './store-server'
import {
  ID,
  SocketMessage,
  SocketMessageType,
  DispatchMessage,
  SubscribeMessage,
  StateUpdateMessage,
  UnsubscribeMessage,
  ReducerDict,
  SelectorDict,
  ExtractActionOptions,
  ExtractSelectorOptions,
  ExtractSelectorSubState,
} from 'web-redux-core'

export function attachSocketServer<
  State,
  AppReducerDict extends ReducerDict<State, any, any>,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
>(
  store: StoreServer<State, AppReducerDict, AppSelectorDict>,
  wss: ws.WebSocketServer,
) {
  wss.on('connection', (ws) => {
    // subscribeID -> unsubscribe
    const subscriptionDict: Record<ID, () => void> = {}
    ws.on('close', () => {})
    ws.on('message', (data) => {
      const message: SocketMessage = JSON.parse(String(data))
      switch (message[0]) {
        case SocketMessageType.dispatch: {
          const msg = message as DispatchMessage<
            keyof AppReducerDict,
            ExtractActionOptions<AppReducerDict, keyof AppReducerDict>
          >
          store.dispatch(msg[1], msg[2])
          break
        }
        case SocketMessageType.subscribe: {
          const msg = message as SubscribeMessage<
            keyof AppSelectorDict,
            ExtractSelectorOptions<AppSelectorDict, keyof AppSelectorDict>
          >
          const id = msg[1]
          const unsubscribe = store.subscribe(msg[2], msg[3], (subState) => {
            const message: StateUpdateMessage<
              ExtractSelectorSubState<AppSelectorDict, keyof AppSelectorDict>
            > = [SocketMessageType.update, id, subState]
            ws.send(JSON.stringify(message))
          })
          subscriptionDict[id] = unsubscribe
          break
        }
        case SocketMessageType.update: {
          console.debug(
            "Shouldn't received update message from client. This should be sent from server to client only.",
          )
          break
        }
        case SocketMessageType.unsubscribe: {
          const msg = message as UnsubscribeMessage
          const id = msg[1]
          const unsubscribe = subscriptionDict[id]
          if (unsubscribe) {
            unsubscribe()
            delete subscriptionDict[id]
          }
          break
        }
        default: {
          const msg: never = message
          console.debug('received unknown socket message:', msg)
        }
      }
    })
  })
}
