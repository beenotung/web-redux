export type RootState = {
  user_list: List<User>
  post_list: List<Post>
  comment_list: List<Comment>
}

export type List<T> = {
  array: T[]
  dict: Record<ID, T>
}

export type ID = string | number

export type User = {
  id: ID
  username: string
  password: string
}

export type Post = {
  id: ID
  user_id: ID
  content: string
}

export type Comment = {
  id: ID
  user_id: ID
  post_id: ID
}
