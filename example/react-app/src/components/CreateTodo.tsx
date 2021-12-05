import type { AppReducerDict, AppState } from 'common'
import type { Callback } from 'web-redux-client'
import { useDispatch } from 'web-redux-client/dist/react'
import React, { useState, FormEvent } from 'react'

export function CreateTodo(props: { onCreate: Callback<void> }) {
  const dispatch = useDispatch<AppState, AppReducerDict>()
  const [error, setError] = useState('')
  function submit(event: FormEvent) {
    event.preventDefault()
    const form = event.target as HTMLFormElement
    dispatch('addItem', {
      text: form.text.value,
    })
      .then((errorMessage) => {
        setError(errorMessage)
        if (!errorMessage) {
          form.reset()
          props.onCreate()
        }
      })
      .catch((error) => {
        setError(error.toString())
      })
  }
  return (
    <>
      <form onSubmit={submit} className="Todo-create">
        <input name="text" placeholder="Todo Item"></input>
        <input type="submit" value="Add Item"></input>
        <div className="error-message" hidden={!error}>
          {error}
        </div>
      </form>
    </>
  )
}
