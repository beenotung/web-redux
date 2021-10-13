import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { createStoreClient, StoreClient } from './lib/store'
import { connect, StoreContext } from './lib/hooks'
import { ActionType, ID, RootAction } from 'common'

export function Index() {
  let store = useMemo(() => {
    let socket = new WebSocket('ws://localhost:8100')
    return createStoreClient(socket)
  }, [])
  useEffect(() => {
    return () => {
      store.close()
    }
  }, [store])
  return (
    <StoreContext.Provider value={store}>
      <App />
    </StoreContext.Provider>
  )
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Web Reducer Demo</h1>
        <a
          className="App-link"
          href="https://github.com/beenotung/web-redux-template"
          target="_blank"
        >
          Learn More
        </a>

        <ConnectedUserList />
      </header>
    </div>
  )
}

function UserList(props: {
  state: { id: ID; username: string }[]
  dispatch: (action: RootAction) => void
}) {
  let user_list = props.state
  function submit(ev: FormEvent) {
    ev.preventDefault()
    let form = ev.target as HTMLFormElement
    props.dispatch({
      type: ActionType.sign_up,
      username: form.username.value,
      password: form.password.value,
    })
    form.reset()
  }
  return (
    <>
      <h2>User List</h2>

      <h3>Sign Up Form</h3>
      <form onSubmit={submit}>
        <div>
          <label htmlFor="username">username: </label>
          <input type="text" id="username" name="username" />
        </div>
        <div>
          <label htmlFor="password">password: </label>
          <input type="password" id="password" name="password" />
        </div>
        <input type="submit" value="submit" />
      </form>

      <h3>Existing List</h3>
      <p>Count: {user_list.length}</p>
      {user_list.map((user) => (
        <div key={user.id}>
          #{user.id} {user.username}
        </div>
      ))}
    </>
  )
}

export const ConnectedUserList = connect({
  selector: 'user_list',
  renderLoading: () => <p>Loading user list ...</p>,
  render: UserList,
})

export default Index
