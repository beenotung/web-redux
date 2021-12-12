# web-redux

A **full-stack variant** of **redux library** that runs reducers and selectors on the server. It receives actions from clients over ajax and pushes realtime sub-state to clients over websocket.

## Features

- Centralized state management on the server
  - single source of truth
  - enforce integrity of update logics
  - enforce access control
  - no need to duplicate works on the backend and frontend
- Auto push realtime updates to multiple clients
- Support action result
  - reducer returns a new state and an result value
  - support success/error message
  - no need to get action result using another selector
- Callback based selector and reducer
  - support async operations
    - support async storage (e.g. mysql, postgres, redis, rethinkdb, mongodb, leveldb)
    - support sync storage (e.g. memory, lmdb, fs, better-sqlite3)
  - support [cached](https://github.com/beenotung/cache-compute)/[memorized](https://github.com/beenotung/tslib/blob/35206e9a300f03124153c13743f7b67eaa23bcee/src/memorize.ts) selector
    - only push sub-state to client when it is actually changed
- Compatible with [event sourcing architecture and CQRS pattern](https://cqrs-documents.surge.sh)
- Reliable message channel
  - Websocket auto reconnect when network resume
  - Subscription message is buffered and auto resent when network resume
- Type-safe development
  - with static type checking from Typescript

## File Structure

### Library Packages

- [web-redux-core](./lib/web-redux-core)
  [![npm Package Version](https://img.shields.io/npm/v/web-redux-core.svg?maxAge=3600)](https://www.npmjs.com/package/web-redux-core)
- [web-redux-client](./lib/web-redux-client)
  [![npm Package Version](https://img.shields.io/npm/v/web-redux-client.svg?maxAge=3600)](https://www.npmjs.com/package/web-redux-client)
- [web-redux-server](./lib/web-redux-server)
  [![npm Package Version](https://img.shields.io/npm/v/web-redux-server.svg?maxAge=3600)](https://www.npmjs.com/package/web-redux-server)

### Example Modules

- [example-common](./example/common)
- [example-server](./example/server)
- [example-react-app](./example/react-app)

```
+-- common
   \-- state.ts
   \-- selector.ts
   \-- reducer.ts
   \-- index.ts (optional, export other 3 files for easier importing)
+-- server
   \-- server.ts (express server and ws server)
+-- client
   \-- components (use selector and dispatch action)
```

## Data Flow

1. server loads initial state

2. client subscribes to selector

3. server passes initial sub-state from selector to client

4. client dispatches action to server

5. server runs reducer to build new state from current state and received action

6. server checks attached selectors and push new sub-state to clients (in any browser)

## Todo

- [x] Allow passing arguments to selector
- [x] Support async selector

---

- [ ] Setup authentication with JWT

  To demo in example or provide built-in support

## Credit

web-redux is inspired from [redux](https://redux.js.org) and [livestate](https://www.livestate.io)

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
