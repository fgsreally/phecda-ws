import { Arg, Ctx } from 'phecda-server'
import { On, Ws, type WsContext } from '../../src'
import { TestService } from './test.service'

@Ws()
export class TestWs {
  @Ctx
    context: WsContext

  constructor(protected service: TestService) {

  }

  @On
  add(@Arg data: { name: string }) {
    this.service.run()
    return data
  }
}
