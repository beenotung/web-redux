import {
  Action,
  ID,
  SocketMessage,
  SocketMessageType,
  SelectorDict,
  StoreState,
} from 'web-redux-core'
import type ws from 'typestub-ws'
import { SelectorType, StoreServer } from './store-server'

type Unsubscribe = () => void

export function attachSocketServer<
  RootSelectorDict extends SelectorDict<any, any, any>,
  RootAction extends Action,
>(
  store: StoreServer<StoreState<RootSelectorDict>, RootAction>,
  selector_dict: RootSelectorDict,
  wss: ws.WebSocketServer,
) {
  wss.on('connection', (ws) => {
    const active_selector_dict: Record<ID, Unsubscribe> = {}
    ws.on('close', () => {
      Object.entries(active_selector_dict).forEach(([id, unsubscribe]) => {
        unsubscribe()
        delete active_selector_dict[id]
      })
    })
    ws.on('message', (data) => {
      let message: SocketMessage = JSON.parse(String(data))
      switch (message.type) {
        case SocketMessageType.dispatch: {
          store.dispatch(message.action as RootAction)
          return
        }
        case SocketMessageType.subscribe: {
          let id = message.id
          let map_state = selector_dict[message.key]
          let selector: SelectorType<StoreState<RootSelectorDict>> = {
            map_state,
            receive_state(state: unknown) {
              let message: SocketMessage = {
                type: SocketMessageType.update,
                id,
                state,
              }
              ws.send(JSON.stringify(message))
            },
          }
          active_selector_dict[id] = store.subscribe(selector)
          return
        }
        case SocketMessageType.unsubscribe: {
          let unsubscribe = active_selector_dict[message.id]
          if (unsubscribe) {
            unsubscribe()
            delete active_selector_dict[message.id]
          }
          return
        }
        default:
          console.debug('received unknown socket message:', message)
      }
    })
  })
}
