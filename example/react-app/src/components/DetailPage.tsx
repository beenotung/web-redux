import { AppReducerDict, AppSelectorDict, AppState, ID } from 'common'
import { useState } from 'react'
import useEvent from 'react-use-event'
import { useSelector, useDispatch } from 'web-redux-client/dist/react'
import { PinTodoItemEvent } from '../events/PinTodoItemEvent'

export function DetailPage() {
  const [id, setID] = useState<ID>('')
  useEvent<PinTodoItemEvent>('PinTodoItem', (event) => setID(event.id))

  return id ? (
    <Inner id={id} />
  ) : (
    <p>
      Click [Pin] button to test "unrelated selector skipping" feature from the
      server console log
    </p>
  )
}

function Inner({ id }: { id: ID }) {
  const dispatch = useDispatch<AppState, AppReducerDict>()
  let detail = useSelector<AppState, AppSelectorDict, 'item_detail'>(
    'item_detail',
    { id },
  )
  return (
    <div>
      <h2>Item #{id} Detail</h2>
      {detail.isLoading ? (
        <p>Loading item detail...</p>
      ) : (
        <div>
          Tick:{' '}
          <button onClick={() => dispatch('tickItem', { id })}>
            {detail.value.tick}
          </button>
        </div>
      )}
    </div>
  )
}
