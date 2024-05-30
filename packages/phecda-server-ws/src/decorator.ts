import { setPropertyState } from 'phecda-server'

export function Ws() {
  return (target: any) => {
    setPropertyState(target, undefined, (state) => {
      state.controller = 'ws'
    })
  }
}

export function On(target: any, k: PropertyKey) {
  setPropertyState(target, k, (state) => {
    state.ws = { on: true }
  })
}
