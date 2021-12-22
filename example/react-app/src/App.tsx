import React, { useState } from 'react'
import { useSocketStatus } from 'web-redux-client/dist/react'
import './App.css'
import { DetailPage } from './components/DetailPage'
import { TodoList } from './components/TodoList'

function App() {
  const socketStatus = useSocketStatus()
  const currentHref = window.location.href
  return (
    <div className="App">
      <header className="App-header">
        <h1>Web Reducer Demo</h1>
        <p>
          Open{' '}
          <a className="App-link" href={currentHref} target="_blank">
            current page
          </a>{' '}
          in multiple tabs to see realtime update.
        </p>
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
        {socketStatus === 'open' ? (
          <>
            <TodoList />
            <DetailPage />
          </>
        ) : (
          <p>Connecting Web Socket...</p>
        )}
      </header>
    </div>
  )
}

export default App
