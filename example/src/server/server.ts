import { WSGenerator, bind } from 'phecda-server-ws'
import { Factory } from 'phecda-server'
import { WebSocketServer } from 'ws'
import { TestWs } from './test.ws'

const data = await Factory([TestWs], {
  generators: [new WSGenerator()],
})
const server = new WebSocketServer({ port: 3001 })

bind(server, data)

// eslint-disable-next-line no-console
console.log('start listen...')
