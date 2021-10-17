# web-redux-template

Store state and run reducer on the server, push sub-state to client in realtime.

## Features

- Centralized state management on the server
  - single source of truth
  - enforce integrity of update logics
  - enforce access control
- Auto push realtime updates to multiple clients
- Align with [event sourcing architecture and CQRS pattern](https://cqrs-documents.surge.sh)
- Reliable message channel
  - Websocket auto reconnect when network resume
  - Subscription message is buffered and auto resent when network resume

## File Structure

```
+-- common
   \-- state.ts
   \-- selector.ts
   \-- action.ts
+-- server
   \-- reducer.ts
   \-- server.ts (websocket server)
+-- client
   \-- components (use selector and dispatch action)
```

## Data Flow

1. server run reducer to load initial state

2. client subscribe to sub-state generated by selector

3. server pass initial sub-state to client

4. client dispatch action to server

5. server run reducer to build new state from current state and current action

6. server check attached selectors and push updates to client (in any browser)

## Todo

- Allow passing arguments to selector

---

- Support async selector

Current approach require the server to store the state in sync storage (e.g. memory, lmdb, fs, better-sqlite3)

---

- Setup authentication with JWT

## Credit

web-redux is inspired from [redux](https://redux.js.org) and [livestate](https://www.livestate.io)

## License

This project is licensed with [BSD-2-Clause](./LICENSE)

This is free, libre, and open-source software. It comes down to four essential freedoms [[ref]](https://seirdy.one/2021/01/27/whatsapp-and-the-domestication-of-users.html#fnref:2):

- The freedom to run the program as you wish, for any purpose
- The freedom to study how the program works, and change it so it does your computing as you wish
- The freedom to redistribute copies so you can help others
- The freedom to distribute copies of your modified versions to others
