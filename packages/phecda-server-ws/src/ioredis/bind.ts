import type WS from 'ws'
import { Context, HMR, detectAopDep } from 'phecda-server'
import type { ControllerMeta, Factory } from 'phecda-server'
import Debug from 'debug'
import WebSocket from 'ws'
import { nanoid } from 'nanoid'
import type { Redis } from 'ioredis'
import type { ClientEvents, WsContext, WsOptions } from '../types'
const debug = Debug('phecda-server/ws')

declare module 'ws' {
  interface Server {
    uid: string
  }
}

export interface RedisWsOptions extends WsOptions {
  channel?: string
}

// return redis instance that subscribe
export function bind(wss: WS.Server, pub: Redis, sub: Redis, data: Awaited<ReturnType<typeof Factory>>, opts: RedisWsOptions = {}) {
  const { globalGuards, globalInterceptors, globalFilter, globalPipe, channel = 'phecda-server-ws', isEventSentToClient = () => true } = opts
  const { moduleMap, meta } = data
  wss.uid = nanoid()

  sub.on('message', (c, message) => {
    if (channel === c) {
      const [uuid, content] = message.split('>', 2)
      if (wss.uid !== uuid) {
        const { event, data } = JSON.parse(content)
        wss.clients.forEach(async (socket) => {
          if (await isEventSentToClient(socket, event, data)) {
            if (socket.readyState === WebSocket.OPEN)
              socket.send(content)
          }
        })
      }
    }
  })

  const metaMap = new Map<string, Record<string, ControllerMeta>>()
  function handleMeta() {
    metaMap.clear()
    for (const item of meta) {
      const { tag, func, controller, ws } = item.data
      if (controller !== 'ws' || !ws.on)
        continue

      debug(`register method "${func}" in module "${tag}"`)

      if (metaMap.has(tag))
        metaMap.get(tag)![func] = item as ControllerMeta

      else
        metaMap.set(tag, { [func]: item as ControllerMeta })
    }
  }

  wss.on('connection', (ws) => {
    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString())
        const { _ps, tag, func, args } = data
        if (_ps !== 1)
          return
        const meta = metaMap.get(tag)![func]
        const contextData = {
          type: 'ws' as const,
          meta,
          moduleMap,
          tag,
          func,
          app: wss,
          websocket: ws,
          args,
          async send<Event extends keyof ClientEvents>(event: Event, data: ClientEvents[Event]) {
            if (await isEventSentToClient(ws, event, data))
              ws.send(JSON.stringify({ event, data }))
          },
          async broadcast<Event extends keyof ClientEvents>(event: Event, data: ClientEvents[Event]) {
            const message = JSON.stringify({ event, data })

            pub.publish(channel, `${wss.uid}>${message}`)

            await Promise.all([...wss.clients].map(async (socket) => {
              if (await isEventSentToClient(socket, event, data)) {
                if (ws !== socket && socket.readyState === WebSocket.OPEN)
                  socket.send(message)
              }
            }))
          },
        }
        const context = new Context<WsContext>(contextData)

        await context.run({ globalGuards, globalInterceptors, globalFilter, globalPipe }, returnData => returnData, (err) => {
          wss.emit('error', err)
        })
      }
      catch (e) {
      }
    })
  })

  detectAopDep(meta, {
    guards: globalGuards,
    interceptors: globalInterceptors,
  }, 'ws')
  handleMeta()

  HMR(async () => {
    detectAopDep(meta, {
      guards: globalGuards,
      interceptors: globalInterceptors,
    }, 'ws')
    handleMeta()
  })

  return sub
}
