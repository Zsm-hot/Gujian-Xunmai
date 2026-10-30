import './style.css'
import { createGame } from './game/createGame'

async function bootstrap() {
  if ('fonts' in document) {
    try {
      await document.fonts.load('bold 80px "Noto Serif SC"')
      await document.fonts.load('bold 80px "Songti SC"')
      await document.fonts.load('bold 20px "Noto Serif SC"')
      await document.fonts.ready
    } catch (err) {
      console.warn('字体加载失败，继续：', err)
    }
  }
  createGame('app')
}

bootstrap()