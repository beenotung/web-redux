import express from 'express'
import { print } from 'listening-on'
import { rootReducer } from './reducer'
import { createStoreServer, SelectorType } from './store'
import ws from 'typestub-ws'
import http from 'http'
import {
  ID,
  RootAction,
  SocketMessageType,
  RootState,
  selector_dict,
  SocketMessage,
} from 'common'

let store = createStoreServer<RootState, RootAction>(rootReducer)

let app = express()
let server = new http.Server(app)
let wss = new ws.WebSocketServer({ server })

wss.on('connection', (ws) => {
  const active_selector_dict: Record<ID, SelectorType<RootState>> = {}
  ws.on('close', () => {
    Object.entries(active_selector_dict).forEach(([id, selector]) => {
      store.unsubscribe(selector)
      delete active_selector_dict[id]
    })
  })
  ws.on('message', (data) => {
    let message: SocketMessage = JSON.parse(String(data))
    switch (message.type) {
      case SocketMessageType.dispatch: {
        store.dispatch(message.action)
        return
      }
      case SocketMessageType.subscribe: {
        let id = message.id
        let map_state = selector_dict[message.key]
        let selector: SelectorType<RootState> = {
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
        store.subscribe(selector)
        active_selector_dict[id] = selector
        return
      }
      case SocketMessageType.unsubscribe: {
        let selector = active_selector_dict[message.id]
        if (selector) {
          store.unsubscribe(selector)
        }
        return
      }
      default:
        console.debug('received unknown socket message:', message)
    }
  })
})

let port = 8100
server.listen(port, () => {
  print(port)
})
