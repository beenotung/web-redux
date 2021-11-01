export type RootState = {
  item_list: List<Item>
}

export type List<T> = {
  dict: Record<ID, T>
  next_id: number
  size: number
}

export type ID = string | number

export type Item = {
  id: ID
  text: string
  tick: number
}
