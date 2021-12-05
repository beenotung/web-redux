type Callback<T> = (data: T) => void

export interface SocketOptions {
  wsUrl: string
  timeoutInterval?: number // default 10000
  minReconnectInterval?: number // default 500
  maxReconnectInterval?: number // default 5000
  maxReconnectAttempt?: number // default unlimited
  reconnectIntervalBackOffFactor?: number // default 2
  reconnectIntervalVariant?: number // default 0.3
  debug?: boolean
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
  timeoutInterval: 10000,
  minReconnectInterval: 500,
  maxReconnectInterval: 5000,
  maxReconnectAttempt: Number.POSITIVE_INFINITY,
  reconnectIntervalBackOffFactor: 2,
  reconnectIntervalVariant: 0.3,
  debug: false,
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
    if (this.socketOptions.debug) {
      console.debug('connecting websocket', this.socketOptions.wsUrl)
    }
    const socket = new WebSocket(this.socketOptions.wsUrl, 'web-redux')
    let hasTimeout = false
    socket.addEventListener('open', () => {
      clearTimeout(timeoutTimer)
      if (hasTimeout) {
        socket.close()
        return
      }
      this.reconnectAttempt = 0
      this.reconnectInterval = this.socketOptions.minReconnectInterval
      this.eventHandlers.onSocketOpen()
    })
    socket.addEventListener('message', (event) => {
      const message: SocketMessage = JSON.parse(String(event.data))
      this.eventHandlers.onSocketMessage(message)
    })
    socket.addEventListener('close', (event) => {
      if (hasTimeout) return
      this.eventHandlers.onSocketClose()
      if (!this.isClosed) {
        this.reconnect()
      }
    })
    const timeoutTimer = setTimeout(() => {
      if (this.socketOptions.debug) {
        console.debug('websocket connection timeout')
      }
      hasTimeout = true
      this.reconnect()
    }, this.socketOptions.timeoutInterval)
    return socket
  }

  private reconnect() {
    if (this.reconnectAttempt >= this.socketOptions.maxReconnectAttempt) {
      if (this.socketOptions.debug) {
        console.debug(
          'give up websocket reconnection after',
          this.reconnectAttempt,
          'attempts',
        )
      }
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
    if (this.socketOptions.debug) {
      console.debug('reconnect websocket after', interval, 'ms')
    }
    if (!interval) {
      console.debug('invalid reconnect interval')
      debugger
    }
    setTimeout(() => (this.socket = this.connect()), interval)
    this.reconnectInterval *= this.socketOptions.reconnectIntervalBackOffFactor
  }

  close(code?: number, reason?: string) {
    this.isClosed = true
    this.socket.close(code, reason)
    this.eventHandlers.onSocketClose()
  }

  send(data: string) {
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(data)
    }
  }
}
