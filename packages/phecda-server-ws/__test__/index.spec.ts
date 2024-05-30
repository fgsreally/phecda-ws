import { expect, test } from 'vitest'
import { Factory } from 'phecda-server'
import { WebSocketServer } from 'ws'
import { WSGenerator, bind } from '../src'
import { TestWs } from './fixture/test.ws'

test('WSGenerator', async () => {
  const data = await Factory([TestWs])
  const code = new WSGenerator('').generateCode(data.meta.map(item => item.data))

  expect(code).toMatchSnapshot()
})

test('meta', async () => {
  const data = await Factory([TestWs])
  expect(data.meta).toMatchSnapshot()
})
test('meta when bind', async () => {
  const data = await Factory([TestWs])
  bind(new WebSocketServer({ noServer: true }), data, { globalGuards: ['a'], globalInterceptors: ['a'] })
  expect(data.meta).toMatchSnapshot()
})
