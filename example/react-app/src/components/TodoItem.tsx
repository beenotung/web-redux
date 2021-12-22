import type { AppReducerDict, AppState, Item } from 'common'
import { useDispatch } from 'web-redux-client/dist/react'
import React, { useState, useCallback, FormEvent } from 'react'
import { useEvent } from 'react-use-event'
import { PinTodoItemEvent } from '../events/PinTodoItemEvent'

function autoFocus(element: HTMLInputElement | null) {
  element?.focus()
}

export function TodoItem(props: { item: Item }) {
  const { item } = props
  const { id } = item
  const dispatch = useDispatch<AppState, AppReducerDict>()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [error, setError] = useState('')
  const cancelEdit = useCallback(() => {
    setIsEditing(false)
  }, [])
  const edit = useCallback(() => {
    setIsEditing(true)
    setEditText(item.text)
  }, [item.text])
  const handleError = useCallback((promise: Promise<string>) => {
    promise.then(setError).catch((error) => setError(error.toString()))
  }, [])
  const onEditText = useCallback((event: FormEvent<HTMLInputElement>) => {
    const text = event.currentTarget.value
    setEditText(text)
    handleError(dispatch('renameItem', { id, text }))
  }, [])
  const dispatchPinEvent = useEvent<PinTodoItemEvent>('PinTodoItem')
  const pinEvent = () => dispatchPinEvent({ id })
  return (
    <div key={id} className="Todo-item">
      <button onClick={() => handleError(dispatch('deleteItem', { id }))}>
        Delete
      </button>
      <button onClick={pinEvent}>Pin</button>
      <button onClick={() => handleError(dispatch('tickItem', { id }))}>
        Tick
      </button>
      <span className="Todo-count">x {item.tick}</span>
      {isEditing ? (
        <input
          className="Todo-text"
          value={editText}
          onChange={onEditText}
          onBlur={cancelEdit}
          ref={autoFocus}
        ></input>
      ) : (
        <span className="Todo-text" onClick={edit}>
          {item.text}
        </span>
      )}
      <div hidden={!error} className="error-message">
        {error}
      </div>
    </div>
  )
}
