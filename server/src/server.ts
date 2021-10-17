import express from 'express'
import { print } from 'listening-on'
import { rootReducer } from './reducer'
import ws from 'typestub-ws'
import http from 'http'
import { attachSocketServer, createStoreServer } from 'web-redux-server'
import { selector_dict, RootAction, RootState } from 'common'

let app = express()
let server = new http.Server(app)
let wss = new ws.WebSocketServer({ server })

let store = createStoreServer<RootState, RootAction>(rootReducer)
attachSocketServer(store, selector_dict, wss)

let port = 8100
server.listen(port, () => {
  print(port)
})
