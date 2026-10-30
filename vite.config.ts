import { defineConfig } from 'vite'

export default defineConfig({
   base: './', // 👈 加上这一行！表示使用相对路径
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['phaser'],
  },
})