import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    plugins: [
      svelte({
        compilerOptions: {
          // keep old `new Component({ target })` API working (Svelte 4 behavior)
          compatibility: { componentApi: 4 }
        }
      })
    ]
  }
})
