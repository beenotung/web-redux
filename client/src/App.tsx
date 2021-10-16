import React, { FormEvent } from 'react'
import { connect, StoreProvider, useDispatch, useSelector } from './lib/hooks'
import { ActionType, ID, RootAction } from 'common'
import './App.css'
import { SelectorKey } from 'common'

export function Index() {
  return (
    <StoreProvider url="ws://localhost:8100">
      <App />
    </StoreProvider>
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

        <UserList />
      </header>
    </div>
  )
}

function UserList() {
  const userListSelector = useSelector<SelectorKey>('user_list')
  const dispatch = useDispatch()

  function submit(ev: FormEvent) {
    ev.preventDefault()
    let form = ev.target as HTMLFormElement
    dispatch({
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
      {userListSelector.isLoading ? (
        <p>Loading User List...</p>
      ) : (
        <>
          <p>Count: {userListSelector.value.length}</p>
          {userListSelector.value.map((user) => (
            <div key={user.id}>
              #{user.id} {user.username}
            </div>
          ))}
        </>
      )}
    </>
  )
}

export const ConnectedUserList = connect({
  selector: 'user_list',
  renderLoading: () => <p>Loading user list ...</p>,
  render: UserList,
})

export default Index
