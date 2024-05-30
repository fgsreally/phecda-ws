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
