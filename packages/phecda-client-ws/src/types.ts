import type { Construct, PickFunc } from 'phecda-server'

type AnyFunction = (...args: any) => any
type ParseInstance<Instance extends Record<string, AnyFunction>> = {
  [Key in keyof Instance]: ToClientFn<Instance[Key]>
}

export type ToClientMap<ControllerMap extends Record<string, Construct>> = {
  [Key in keyof ControllerMap]: ToClientInstance<InstanceType<ControllerMap[Key]>>
}

 type ToClientInstance<Instance extends Record<string, any>> = ParseInstance<PickFunc<Instance>>

 type ToClientFn<Func extends AnyFunction> = (...p: Parameters<Func>) => void
