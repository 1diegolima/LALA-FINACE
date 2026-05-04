import { defineConfig } from 'vite'

export default defineConfig({
  // Se for fazer deploy no Github Pages ou similares no futuro, o base url pode ser útil
  base: './',
  server: {
    port: 3000,
    open: true
  }
})
