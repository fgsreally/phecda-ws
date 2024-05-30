import type { BaseContext } from 'phecda-server'
import type WS from 'ws'
declare module 'phecda-server'{
  interface ControllerMetaData {
    ws?: { on?: boolean }
  }
}

export interface ClientEvents {
  [key: string]: any
}

export interface WsContext extends BaseContext {
  type: 'ws'
  send<Event extends keyof ClientEvents>(event: Event, data: ClientEvents[Event]): void
  broadcast<Event extends keyof ClientEvents>(event: Event, data: ClientEvents[Event]): void

  app: WS.Server
  websocket: WS
  args: any[]
}
