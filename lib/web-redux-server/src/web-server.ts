import type express from 'express'
import type ws from 'typestub-ws'
import type {
  SelectorDict,
  ReducerDict,
  ID,
  SocketMessage,
  SubscribeMessage,
  StateUpdateMessage,
  ExtractSelectorOptions,
  UnsubscribeMessage,
  ExtractActionOptions,
  ExtractSelectorCallback,
  CallbackData,
} from 'web-redux-core'
import type { StoreServer } from './store-server'
import { SocketMessageType } from 'web-redux-core'

export interface AttachWebServerOptions<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppReducerDict extends ReducerDict<State, any, any, any>,
> {
  store: StoreServer<State, AppSelectorDict, AppReducerDict>
  app: express.Router
  wss: ws.WebSocketServer
  debug?: boolean
}

export function attachWebServer<
  State,
  AppSelectorDict extends SelectorDict<State, any, any, any>,
  AppReducerDict extends ReducerDict<State, any, any, any>,
>(options: AttachWebServerOptions<State, AppSelectorDict, AppReducerDict>) {
  const { app, wss, store, debug } = options
  app.post('/dispatch/:type', (req, res) => {
    const actionName: keyof AppReducerDict = req.params.type
    const actionOptions: ExtractActionOptions<
      AppReducerDict,
      keyof AppReducerDict
    > = req.body
    console.debug('post dispatch', { params: req.params, body: req.body })
    store.dispatch(actionName, actionOptions, (result) => res.json(result))
  })
  wss.on('connection', (ws) => {
    let subscriptionDict: Record<ID, () => void> = {}
    ws.on('close', () => {
      subscriptionDict = {}
    })
    ws.on('message', (data) => {
      const message: SocketMessage = JSON.parse(String(data))
      switch (message[0]) {
        case SocketMessageType.subscribe: {
          type SelectorName = keyof AppSelectorDict
          type SelectorOptions = ExtractSelectorOptions<
            AppSelectorDict,
            SelectorName
          >
          type SubState = CallbackData<
            ExtractSelectorCallback<AppSelectorDict, SelectorName>
          >
          const msg: SubscribeMessage<SelectorName, SelectorOptions> = message
          const id = msg[1]
          const unsubscribe = store.subscribe(msg[2], msg[3], (subState) => {
            const message: StateUpdateMessage<SubState> = [
              SocketMessageType.update,
              id,
              subState,
            ]
            ws.send(JSON.stringify(message))
          })
          subscriptionDict[id] = unsubscribe
          break
        }
        case SocketMessageType.update: {
          if (debug) {
            console.debug(
              "Shouldn't receive update message from client. This should only be sent from server to client.",
            )
          }
          break
        }
        case SocketMessageType.unsubscribe: {
          const msg: UnsubscribeMessage = message
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
          if (debug) {
            console.debug('received unknown socket message:', msg)
          }
        }
      }
    })
  })
}
