import React, { FormEvent, useMemo } from 'react'
import {
  StoreProvider,
  useDispatch,
  useSelector,
  SuspendState,
  connect,
  connectSuspend,
} from 'web-redux-client/dist/react'
import { ActionType, RootAction, RootSelectorDict } from 'common'
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
        <div className="App-banner">
          <img src="/logo192.png" className="App-logo" />
          <a
            className="App-link"
            href="https://github.com/beenotung/web-redux"
            target="_blank"
            rel="noreferrer"
          >
            Learn More
          </a>
        </div>

        <TodoList />
        <UserPage />
      </header>
    </div>
  )
}

function TodoList() {
  return (
    <>
      <h2>Todo List</h2>
      <div className="Todo-list">
        <div className="Todo-item">
          <button>Delete</button>
          <button>Tick</button>
          <span className="Todo-count">x 1</span>
          <span className="Todo-text">text</span>
        </div>
      </div>
    </>
  )
}

function UserPage() {
  const dispatch = useDispatch<RootAction>()

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
      {/* <ConnectedUserCount /> */}
      <UserList />
    </>
  )
}

function UserList() {
  console.log(useSelector)
  console.log(useSelector.toString())
  const userListSelector = useSelector<RootSelectorDict, 'user_list'>(
    'user_list',
    useMemo(() => ({ count: 3, offset: 0 }), []),
    // { count: 3, offset: 0 }
  )
  // const userListSelector  = {
  //   isLoading:true,
  //   value:[] as any[]
  // }
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

// class UserCount extends React.Component<{
//   count: SuspendState<RootSelectorDict, 'user_count'>
// }> {
//   render() {
//     return (
//       <p>
//         {/* Count: {this.props.count.isLoading ? 'loading' : this.props.count.value} */}
//         c:{JSON.stringify(this.props.count)}
//       </p>
//     )
//   }
// }

// const ConnectedUserCount = connect({
//   count: {
//     selector: 'user_count',
//     options: {},
//   },
// })(UserCount)

// export const ConnectedUserList = connectSuspend<
//   RootSelectorDict,
//   'user_list',
//   RootAction
// >({
//   selector: 'user_list',
//   options: { offset: 0, count: 5 },
//   renderLoading: () => <p>Loading user list ...</p>,
//   render: UserList,
// })

export default Index
