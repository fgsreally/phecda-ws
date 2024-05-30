import { WSGenerator, bind } from 'phecda-server-ws'
import { Factory } from 'phecda-server'
import { WebSocketServer } from 'ws'
import { TestWs } from './test.ws'

const data = await Factory([TestWs], {
  generators: [new WSGenerator('.ps/ws.ts')],
})
const server = new WebSocketServer({ port: 3001 })

bind(server, data)
