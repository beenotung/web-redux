import React, { FormEvent } from 'react'
import {
  StoreProvider,
  useDispatch,
  useSelector,
  SuspendState,
} from './lib/hooks'
import { ActionType } from 'common'
import { connect, connectSuspend } from './lib/connect'
import './App.css'

export function Index() {
  return (
    <StoreProvider url="ws://localhost:8100" debug>
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
          rel="noreferrer"
        >
          Learn More
        </a>

        <UserPage />
      </header>
    </div>
  )
}

function UserPage() {
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
      <ConnectedUserCount />
      <UserList />
    </>
  )
}

function UserList() {
  const userListSelector = useSelector('user_list')
  return (
    <>
      {userListSelector.isLoading === true ? (
        <p>Loading User List...</p>
      ) : (
        <>
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

class UserCount extends React.Component<{
  count: SuspendState<'user_count'>
}> {
  render() {
    return (
      <p>
        Count: {this.props.count.isLoading ? 'loading' : this.props.count.value}
      </p>
    )
  }
}
const mapStateToProps = () => ({ count: 'user_count' as const })
const ConnectedUserCount = connect(mapStateToProps)(UserCount)

export const ConnectedUserList = connectSuspend({
  selector: 'user_list',
  renderLoading: () => <p>Loading user list ...</p>,
  render: UserList,
})

export default Index
