import { setMeta } from 'phecda-server'

export function Ws() {
  return (target: any) => {
    setMeta(target, undefined, undefined, {
      controller: 'ws',
    })
  }
}

export function On(target: any, property: PropertyKey) {
  setMeta(target, property, undefined, {
    ws: {
      on: true,
    },
  })
}
