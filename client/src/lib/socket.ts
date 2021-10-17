import { SocketMessage } from 'common'

function noop() {
  // to disable debug log
}

type EventType = string
type EventListener = (event: any) => void
type EventOptions = any

export type SocketOptions = {
  url: string
  debug?: boolean
  minReconnectInterval?: number
  maxReconnectInterval?: number
  maxReconnectAttempt?: number
  reconnectIntervalFactor?: number
  reconnectIntervalVariant?: number
}
const defaultOptions: Omit<Required<SocketOptions>, 'url'> = {
  debug: false,
  minReconnectInterval: 500,
  maxReconnectInterval: 5 * 1000,
  reconnectIntervalFactor: 2,
  maxReconnectAttempt: Number.MAX_SAFE_INTEGER,
  reconnectIntervalVariant: 0.3,
}

export class Socket {
  static readonly NORMAL_CLOSURE = 1000
  static readonly ABNORMAL_CLOSURE = 1006

  private socket: WebSocket
  private debug: typeof console['debug']

  private options: Required<SocketOptions>
  private reconnectInterval: number
  private reconnectAttempt = 0
  private isClosed = false
  private isFirst = true

  constructor(options: SocketOptions) {
    this.options = {
      ...defaultOptions,
      ...options,
    }
    this.reconnectInterval = this.options.minReconnectInterval
    this.debug = this.options.debug ? console.debug.bind(console) : noop
    this.socket = this.start()
    this.addEventListener('open', () => {
      this.debug('socket open')
      if (this.isFirst) {
        this.isFirst = false
      } else {
        this.debug('socket reconnected')
        this.emitEvent('reconnect')
      }
      this.reconnectInterval = this.options.minReconnectInterval
      this.reconnectAttempt = 0
      if (this.outgoingBuffer.length === 0) return
      this.debug(
        'flush socket message buffer. buffer size:',
        this.outgoingBuffer.length,
      )
      this.outgoingBuffer.forEach((data) => this.socket.send(data))
      this.outgoingBuffer = []
    })
    this.addEventListener('close', (ev) => {
      if (!this.isClosed && ev.code === Socket.ABNORMAL_CLOSURE) {
        this.reconnect()
      }
    })
  }

  private emitEvent(eventType: string) {
    let event = new Event(eventType)
    this.eventListenerList.forEach(([type, listener]) => {
      if (type === eventType) {
        listener(event)
      }
    })
  }

  private reconnect() {
    if (this.reconnectAttempt >= this.options.maxReconnectAttempt) {
      this.isClosed = true
      return
    }
    this.reconnectAttempt++
    let interval = this.reconnectInterval
    let variant =
      interval * Math.random() * this.options.reconnectIntervalVariant
    let sign = Math.random() * 2 - 1
    interval += variant * sign
    interval = Math.min(interval, this.options.maxReconnectAttempt)
    interval = Math.max(interval, this.options.minReconnectInterval)
    setTimeout(() => {
      this.socket = this.start()
    }, interval)
    interval *= this.options.reconnectIntervalFactor
  }

  private start() {
    this.debug('start WebSocket, url:', this.options.url)
    let socket = new WebSocket(this.options.url)
    this.eventListenerList.forEach(([type, listener, options]) => {
      socket.addEventListener(type, listener, options)
    })
    return socket
  }

  private eventListenerList: Array<[EventType, EventListener, EventOptions]> =
    []
  addEventListener: WebSocket['addEventListener'] = (
    type: EventType,
    listener: EventListener,
    options: EventOptions,
  ) => {
    this.socket.addEventListener(type, listener, options)
    this.eventListenerList.push([type, listener, options])
  }
  removeEventListener: WebSocket['removeEventListener'] = (
    type: EventType,
    listener: EventListener,
    options: EventOptions,
  ) => {
    this.socket.removeEventListener(type, listener, options)
    this.eventListenerList = this.eventListenerList.filter(
      (item) => item[0] !== type && item[1] !== listener,
    )
  }

  private outgoingBuffer: string[] = []

  sendMessage(message: SocketMessage) {
    if (this.isClosed) {
      throw new Error('socket already closed, cannot send further message')
    }
    let data = JSON.stringify(message)
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(data)
    } else {
      this.outgoingBuffer.push(data)
      this.debug(
        'socket not ready, save pending message to buffer. buffer size:',
        this.outgoingBuffer.length,
      )
    }
  }

  close: WebSocket['close'] = (code, reason) => {
    this.isClosed = true
    this.socket.close(code, reason)
  }
}
