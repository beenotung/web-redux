import type { AppSelectorDict, AppState } from 'common'
import React, { useState, useCallback } from 'react'
import { useSelector } from 'web-redux-client/dist/react'
import { CreateTodo } from './CreateTodo'
import { TodoItem } from './TodoItem'

export function TodoList() {
  const itemPerPage = 5
  const [currentPage, setCurrentPage] = useState(0)
  const itemCountState = useSelector<AppState, AppSelectorDict, 'item_count'>(
    'item_count',
    {},
  )
  const itemListState = useSelector<AppState, AppSelectorDict, 'item_list'>(
    'item_list',
    {
      count: itemPerPage,
      offset: itemPerPage * currentPage,
    },
  )
  const onCreate = useCallback(() => {
    if (itemCountState.isLoading) return
    const count = itemCountState.value + 1
    const pages = Math.ceil(count / itemPerPage)
    setCurrentPage(pages - 1)
  }, [itemCountState])
  return (
    <>
      <h2>Todo List</h2>
      <CreateTodo onCreate={onCreate} />
      <div className="Todo-list">
        {itemCountState.isLoading ? (
          <p>Loading total count</p>
        ) : (
          <>
            <p>Total number of items: {itemCountState.value}</p>
            {(function pagination() {
              const totalPage = Math.ceil(itemCountState.value / itemPerPage)
              return (
                <div className="Pagination">
                  <button
                    disabled={currentPage <= 0}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous Page
                  </button>
                  {currentPage + 1} / {totalPage}
                  <button
                    disabled={currentPage + 1 >= totalPage}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next Page
                  </button>
                </div>
              )
            })()}
          </>
        )}
        {itemListState.isLoading
          ? 'Loading items'
          : itemListState.value.map((item) => (
              <TodoItem key={item.id} item={item} />
            ))}
      </div>
    </>
  )
}
