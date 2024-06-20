import { Arg, Ctx } from 'phecda-server'
import { On, Ws, type WsContext } from 'phecda-server-ws'

@Ws()
export class TestWs {
  @Ctx
    context: WsContext

  @On
  add(@Arg data: { name: string }) {
    // eslint-disable-next-line no-console
    console.log('data:', data)
    this.context.broadcast('test', data, true)
  }
}
