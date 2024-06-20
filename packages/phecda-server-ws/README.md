# phecda-server-ws

support using `ws` in `phecda-server`
 
## install 
```shell
npm i phecda-server-ws
```

## quick start

create a controller to expose
```ts
import { Arg, Ctx } from 'phecda-server'
import { On, Ws, type WsContext } from 'phecda-server-ws'

@Ws()
export class TestWs {
  @Ctx
    context: WsContext

  @On
  add(@Arg data: { name: string }) {
    this.context.broadcast('test', data)
  }
}
```


bind ws and start server
```ts
import { WSGenerator, bind } from 'phecda-server-ws'
import { Factory } from 'phecda-server'
import { WebSocketServer } from 'ws'
import { TestWs } from './test.ws'

const data = await Factory([TestWs], {
  generators: [new WSGenerator()],
})
const server = new WebSocketServer({ port: 3001 })

bind(server, data)
```

if you use `ps` runtime , update the config file(`ps.json`)

```json
{
  "resolve": [

    {
      "source": "ws",
      "importer": "client",
      "path": ".ps/ws.js"
    }
  ],

  "moduleFile": ["ws"]
}
```