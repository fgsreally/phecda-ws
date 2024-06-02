import type { Options } from 'tsup'

export const tsup: Options = {
  entry: ['src/index.ts', 'src/ioredis/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  shims: false,
}
