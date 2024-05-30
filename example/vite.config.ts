import { URL, fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import plugin from 'phecda-client/vite'
// import swc from 'unplugin-swc'

export default defineConfig({

  plugins: [plugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

})
