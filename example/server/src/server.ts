import express from 'express'
import cors from 'cors'
import { print } from 'listening-on'
import ws from 'typestub-ws'
import http from 'http'
import { attachWebServer, StoreServer } from 'web-redux-server'
import { selector_dict, reducer_dict, initialState } from 'common'

let app = express()
app.use(cors())
app.use(express.json())
let server = new http.Server(app)
let wss = new ws.WebSocketServer({ server })

let store = new StoreServer(initialState, selector_dict, reducer_dict)

attachWebServer({
  store,
  app,
  wss,
  debug: true,
})

let port = 8100
server.listen(port, () => {
  print(port)
})
