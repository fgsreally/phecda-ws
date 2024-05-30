/* eslint-disable no-console */
import { createClient } from 'phecda-client-ws'
import { TestWs } from '../server/test.ws'
const ws = new WebSocket('ws://localhost:3001')
const client = createClient(ws, {
  test: TestWs,
}, {
  test(data) {
    console.log(data)
  },
})

ws.onopen = () => {
  console.log('open!')
  client.test.add({ name: 'ws' })
}
