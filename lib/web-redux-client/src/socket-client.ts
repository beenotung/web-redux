type Callback<T> = (data: T) => void

export interface SocketOptions {
  wsUrl: string
  minReconnectInterval?: number // default 500
  maxReconnectInterval?: number // default 5000
  maxReconnectAttempt?: number // default unlimited
  reconnectIntervalBackOffFactor?: number // default 2
  reconnectIntervalVariant?: number // default 0.3
}

export interface SocketEventHandlers<SocketMessage> {
  onSocketMessage: Callback<SocketMessage>
  onSocketOpen: Callback<void>
  onSocketClose: Callback<void>
}

export interface SocketClientOptions<SocketMessage> {
  socketOptions: SocketOptions
  eventHandlers: SocketEventHandlers<SocketMessage>
}

const defaultOptions: Omit<
  Required<SocketOptions>,
  'wsUrl' | 'onMessage' | 'onOpen' | 'onClose'
> = {
  minReconnectInterval: 500,
  maxReconnectInterval: 5000,
  maxReconnectAttempt: Number.POSITIVE_INFINITY,
  reconnectIntervalBackOffFactor: 2,
  reconnectIntervalVariant: 0.3,
}

export class SocketClient<SocketMessage> {
  static readonly NORMAL_CLOSURE = 1000
  private socketOptions: Required<SocketOptions>
  private socket: WebSocket
  private isClosed = false
  private eventHandlers: SocketEventHandlers<SocketMessage>

  private reconnectAttempt = 0
  private reconnectInterval: number

  constructor(options: SocketClientOptions<SocketMessage>) {
    this.socketOptions = { ...defaultOptions, ...options.socketOptions }
    this.eventHandlers = options.eventHandlers
    this.socket = this.connect()
    this.reconnectInterval = this.socketOptions.minReconnectInterval
  }

  private connect() {
    const socket = new WebSocket(this.socketOptions.wsUrl, 'web-redux')
    socket.addEventListener('open', () => {
      this.reconnectAttempt = 0
      this.reconnectInterval = this.socketOptions.minReconnectInterval
      this.eventHandlers.onSocketOpen()
    })
    socket.addEventListener('message', (event) => {
      const message: SocketMessage = JSON.parse(String(event.data))
      this.eventHandlers.onSocketMessage(message)
    })
    socket.addEventListener('close', (event) => {
      this.eventHandlers.onSocketClose()
      if (!this.isClosed) {
        this.reconnect()
      }
    })
    return socket
  }

  private reconnect() {
    if (this.reconnectAttempt >= this.socketOptions.maxReconnectAttempt) {
      this.isClosed = true
      return
    }
    this.reconnectAttempt++
    let interval = this.reconnectInterval
    let variant =
      interval * Math.random() * this.socketOptions.reconnectIntervalVariant
    let sign = Math.random() * 2 - 1
    interval += variant * sign
    interval = Math.min(interval, this.socketOptions.maxReconnectInterval)
    interval = Math.max(interval, this.socketOptions.minReconnectInterval)
    setTimeout(() => (this.socket = this.connect()), interval)
    this.reconnectInterval *= this.socketOptions.reconnectIntervalBackOffFactor
  }

  close(code?: number, reason?: string) {
    this.isClosed = true
    this.socket.close(code, reason)
    this.eventHandlers.onSocketClose()
  }

  send(data: string) {
    this.socket.send(data)
  }
}
