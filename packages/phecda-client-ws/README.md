# phecda-client-ws

client to request `phecda-server-ws`

## install

```shell
npm i phecda-client-ws
```


## quick start

in `vite.config.ts` 
```ts
import { defineConfig } from 'vite'
import plugin from 'phecda-client/vite'

export default defineConfig({

  plugins: [plugin()],

})
```

create client and request to server

```ts
import { createClient } from 'phecda-client-ws'
import { TestWs } from '../server/test.ws'// it will redirect to .ps/ws.js
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
```