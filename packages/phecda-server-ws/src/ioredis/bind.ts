import type WS from 'ws'
import { Context, HMR, detectAopDep } from 'phecda-server'
import type { ControllerMeta, DefaultOptions, Factory } from 'phecda-server'
import Debug from 'debug'
import WebSocket from 'ws'
import { nanoid } from 'nanoid'
import type { Redis } from 'ioredis'
import type { ClientEvents, WsContext } from '../types'
const debug = Debug('phecda-server/ws')

declare module 'ws' {
  interface Server {
    uid: string
  }
}

export interface RedisWsOptions extends DefaultOptions {
  channel?: string
}

// return redis instance that subscribe
export function bind(wss: WS.Server, pub: Redis, sub: Redis, data: Awaited<ReturnType<typeof Factory>>, opts: RedisWsOptions = {}) {
  const { globalGuards, globalInterceptors, globalFilter, globalPipe, channel = 'phecda-server-ws' } = opts
  const { moduleMap, meta } = data
  wss.uid = nanoid()

  sub.on('message', (c, message) => {
    if (channel === c) {
      const [uuid, content] = message.split('>', 2)
      if (wss.uid !== uuid) {
        wss.clients.forEach((socket) => {
          if (socket.readyState === WebSocket.OPEN)
            socket.send(content)
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
          send<Event extends keyof ClientEvents>(event: Event, data: ClientEvents[Event]) {
            ws.send(JSON.stringify({ event, data }))
          },
          broadcast<Event extends keyof ClientEvents>(event: Event, data: ClientEvents[Event]) {
            const message = JSON.stringify({ event, data })
            wss.clients.forEach((socket) => {
              if (ws !== socket && socket.readyState === WebSocket.OPEN)
                socket.send(message)
            })
            pub.publish(channel, `${wss.uid}>${message}`)
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
