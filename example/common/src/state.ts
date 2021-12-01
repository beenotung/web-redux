import { Dict, Collection, ObjectDict } from 'live-data-sync'

export type RootState = {
  collection: Collection<CollectionData>
  dict: Dict<DictData>
  item_count: number
}

export type CollectionData = {
  items: ObjectDict<Item>
}

export type DictData = {}

export type ID = string | number

export type Item = {
  id: ID
  text: string
  tick: number
}
