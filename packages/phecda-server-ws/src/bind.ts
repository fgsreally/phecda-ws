import type WS from 'ws'
import { Context, HMR, detectAopDep } from 'phecda-server'
import type { ControllerMeta, Factory } from 'phecda-server'
import Debug from 'debug'
import WebSocket from 'ws'
import type { ClientEvents, WsContext, WsOptions } from './types'
const debug = Debug('phecda-server/ws')

export function bind(wss: WS.Server, data: Awaited<ReturnType<typeof Factory>>, opts: WsOptions = {}) {
  const { globalGuards, globalInterceptors, globalFilter, globalPipe, isEventSentToClient = () => true } = opts
  const { moduleMap, meta } = data

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
            if (await isEventSentToClient?.(ws, event, data))
              ws.send(JSON.stringify({ event, data }))
          },
          async broadcast<Event extends keyof ClientEvents>(event: Event, data: ClientEvents[Event], includeCurrentConnect = false) {
            const message = JSON.stringify({ event, data })

            await Promise.all([...wss.clients].map(async (socket) => {
              if (await isEventSentToClient?.(socket, event, data)) {
                if ((includeCurrentConnect || ws !== socket) && socket.readyState === WebSocket.OPEN)
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
}
