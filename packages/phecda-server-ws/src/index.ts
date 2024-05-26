import type { ServerOptions } from 'ws'
import Websocker from 'ws'
import { Init, SHARE_KEY, getExposeKey, getOwnState, getState, getTag, setState, setStateKey } from 'phecda-server'
type WrapServer<Server extends Websocker.Server, Events extends Record<string, any>> = Server & {
  send<Key extends keyof Events>(event: Key, data: Events[Key]): void
}

export class WS<Events extends Record<string, any>> {
  server: Websocker.Server
  constructor(options?: ServerOptions) {
    // @ts-expect-error just type magic
    this.server = new Websocker.Server(options)
  }

  send() {

  }

  @Init
  init() {
    this.server.on('connection', (socket) => {
      const keys = getExposeKey(this).filter(item => typeof item === 'string') as string[]
      const eventRecord: Record<string, string> = {}
      for (const key of keys) {
        const { ws } = getState(this, key)
        if (ws)
          eventRecord[ws] = key
      }

      socket.on('message', (raw) => {
        const data = JSON.parse(raw.toString())
        this[eventRecord[data.type]]!(data.data)
      })
    })
  }
}

export function On(event?: string) {
  return (target: any, key: string) => {
    let state: any
    if (!key) {
      if (!event)
        event = getTag(target)
      key = SHARE_KEY

      target = target.prototype
      const state = getOwnState(target, key) || {}
      state.ws = event
    }
    else {
      if (!event)
        event = key

      const prefix = getOwnState(target, SHARE_KEY)?.ws
      const state = getOwnState(target, key) || {}
      state.ws = prefix ? `${prefix}-${event}` : event

      if (!state.define)
        state.define = {}

      state.define.ws = state.ws
    }

    setState(target, key, state)
    setStateKey(target, key)
  }
}
