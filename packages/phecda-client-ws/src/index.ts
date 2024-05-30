import type { ClientEvents } from 'phecda-server-ws'
import type { Construct } from 'phecda-server'
import type { ToClientMap } from './types'
export function createClient<Controllers extends Record<string, Construct>>(ws: WebSocket, controllers: Controllers, callbacks: {
  [Event in keyof ClientEvents]: (data: ClientEvents[Event]) => void
}): ToClientMap<Controllers> {
  ws.onmessage = (e) => {
    const { event, data } = JSON.parse(e.data)
    callbacks[event](data)
  }
  const map: ToClientMap<Controllers> = {} as any
  for (const key in controllers) {
    map[key] = new Proxy(new controllers[key](), {
      get(target, p) {
        const generator = target[p]
        if (typeof generator !== 'function')
          throw new Error(`'${p as string}' on controller must be a function !`)

        return (...args: any[]) => {
          const params = generator(...args)
          params._ps = 1
          ws.send(JSON.stringify(params))
        }
      },
    })
  }
  return map
}
