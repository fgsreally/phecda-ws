import { defineConfig } from 'vitest/config'
import { swcUnplugin } from 'unplugin-swc-esm'

export default defineConfig({
  plugins: [swcUnplugin.vite()],

})
