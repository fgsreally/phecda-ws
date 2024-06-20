import type { BaseContext, DefaultOptions } from 'phecda-server'
import type WS from 'ws'
import type { WebSocket } from 'ws'
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
  send<Event extends keyof ClientEvents>(event: Event, data: ClientEvents[Event]): Promise<void>
  broadcast<Event extends keyof ClientEvents>(event: Event, data: ClientEvents[Event], includeCurrentConnect?: boolean): Promise<void>
  app: WS.Server
  websocket: WS
  args: any[]
}

export interface WsOptions extends DefaultOptions {
  //  false that it won't send data to browser
  isEventSentToClient?: <Key extends keyof ClientEvents>(ws: WebSocket, event: Key, data: ClientEvents[Key]) => Promise<boolean> | boolean
}
