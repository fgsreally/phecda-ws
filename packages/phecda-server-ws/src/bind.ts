import type WS from 'ws'
import { Context, HMR, detectAopDep } from 'phecda-server'
import type { ControllerMeta, Factory } from 'phecda-server'
import Debug from 'debug'
import type { ClientEvents, WsContext } from './types'
const debug = Debug('phecda-server/ws')

export function bind(wss: WS.Server, data: Awaited<ReturnType<typeof Factory>>, ServerOptions: {
  globalGuards?: string[]
  globalInterceptors?: string[]
} = {}) {
  const { globalGuards = [], globalInterceptors = [] } = ServerOptions
  const { moduleMap, meta } = data

  const metaMap = new Map<string, Record<string, ControllerMeta>>()
  function handleMeta() {
    metaMap.clear()
    for (const item of meta) {
      const { tag, func, controller, ws } = item.data
      if (controller !== 'ws' || !ws.on)
        continue

      debug(`register method "${func}" in module "${tag}"`)
      item.data.guards = [...globalGuards, ...item.data.guards]
      item.data.interceptors = [...globalInterceptors, ...item.data.interceptors]
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
            wss.clients.forEach(ws => ws.send(JSON.stringify({ event, data })))
          },
        }
        const context = new Context<WsContext>(contextData)

        await context.run(returnData => returnData, (err) => {
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
