import Phaser from 'phaser'

// ===== 应县木塔配色（红木 + 灰瓦） =====
const WOOD = {
  // 天空 / 背景
  sky: 0xefe6d0,           // 淡米黄（背景主色）
  skyDeep: 0xe0d8c0,       // 远景淡
  mist: 0xd8d0b8,          // 雾色

  // 木塔主体
  wallRed: 0xa84838,       // 墙身红棕
  wallRedDark: 0x8a3828,   // 墙深红
  wallRedLite: 0xc85848,   // 墙亮红

  // 柱 / 斗拱
  timber: 0x8a3828,        // 柱 / 斗拱深红
  timberDark: 0x5a2018,    // 极深红（阴影）
  timberLite: 0xb85838,    // 亮红

  // 屋顶瓦（灰瓦）
  roof: 0x5a5a58,          // 瓦主色（灰）
  roofDark: 0x3a3a38,      // 瓦深
  roofLite: 0x7a7a78,      // 瓦亮

  // 台基 / 石
  stone: 0xd8d0c0,         // 台基米白
  stoneDark: 0xa8a090,     // 石阴影
  stoneLite: 0xefe6d0,     // 石亮
  path: 0xc8bca0,          // 地面

  // 松柏 / 灌木
  pine: 0x4a6a4a,
  pineDark: 0x2a4a2a,
  pineLite: 0x6a8a5a,

  // 阴影
  shadow: 0x6a5a4a,

  // 装饰色（远景几何）
  deco1: 0xc8bc9c,         // 米黄
  deco2: 0xb8a888,         // 深米
  deco3: 0xa84838,         // 淡红
}

/**
 * 背景：淡米黄 + 远山淡影 + 装饰几何
 */
export function drawWoodSky(
  g: Phaser.GameObjects.Graphics,
  W: number,
  H: number,
) {
  // 主底
  g.fillGradientStyle(WOOD.sky, WOOD.sky, WOOD.skyDeep, WOOD.mist, 1)
  g.fillRect(0, 0, W, H)

  // 远处"装饰几何块"
  g.fillStyle(WOOD.deco1, 0.5)
  g.fillRect(60, 80, 120, 90)
  g.fillRect(1040, 200, 140, 180)

  g.fillStyle(WOOD.deco2, 0.4)
  g.fillTriangle(120, 320, 200, 240, 260, 320)
  g.fillTriangle(1080, 420, 1140, 360, 1200, 420)

  g.fillStyle(WOOD.deco3, 0.35)
  g.fillCircle(240, 180, 14)

  // 地平线
  g.fillStyle(WOOD.path, 0.4)
  g.fillRect(0, 420, W, 20)
}

/**
 * 绘制"应县木塔"（5 层，红木灰瓦）
 */
export function drawWoodPagoda(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  baseY: number,
) {
  const levels = 5
  const baseW = 180
  const levelH = 62
  const shrink = 0.86
  const roofW = 24

  // ① 台基
  g.fillStyle(WOOD.stone, 1)
  g.fillRect(cx - baseW / 2 - 50, baseY, baseW + 100, 36)
  g.lineStyle(2, WOOD.stoneDark, 0.6)
  g.strokeRect(cx - baseW / 2 - 50, baseY, baseW + 100, 36)

  // 台基栏杆
  g.fillStyle(WOOD.stoneLite, 1)
  for (let i = 0; i < 22; i += 1) {
    const rx = cx - baseW / 2 - 45 + i * ((baseW + 90) / 21)
    g.fillRect(rx, baseY - 10, 3, 10)
  }
  g.fillRect(cx - baseW / 2 - 50, baseY - 8, baseW + 100, 3)

  // ② 逐层往上
  for (let i = 0; i < levels; i += 1) {
    const y = baseY - (i + 1) * levelH
    const w = baseW * Math.pow(shrink, i)

    // 墙身
    g.fillStyle(WOOD.wallRed, 1)
    g.fillRect(cx - w / 2, y, w, levelH - 8)
    g.lineStyle(1.5, WOOD.timberDark, 0.7)
    g.strokeRect(cx - w / 2, y, w, levelH - 8)

    // 左右阴影
    g.fillStyle(WOOD.wallRedDark, 0.5)
    g.fillRect(cx - w / 2, y, 6, levelH - 8)
    g.fillRect(cx + w / 2 - 6, y, 6, levelH - 8)

    // 窗户
    g.fillStyle(WOOD.timberDark, 0.85)
    const winW = w / 5
    g.fillRect(cx - winW - 8, y + 12, winW, levelH - 30)
    g.fillRect(cx + 8, y + 12, winW, levelH - 30)
    g.lineStyle(1.5, WOOD.timber, 0.9)
    g.strokeRect(cx - winW - 8, y + 12, winW, levelH - 30)
    g.strokeRect(cx + 8, y + 12, winW, levelH - 30)

    // 斗拱
    g.fillStyle(WOOD.timberLite, 1)
    const archCount = 7
    for (let j = 0; j < archCount; j += 1) {
      const ax = cx - w / 2 + ((w / archCount) * j) + (w / (archCount * 2)) - 5
      g.fillRect(ax, y + levelH - 18, 10, 8)
      g.fillStyle(WOOD.timberDark, 0.5)
      g.fillRect(ax, y + levelH - 12, 10, 2)
      g.fillStyle(WOOD.timberLite, 1)
    }

    // 檐（灰瓦）
    const eaveW = w + roofW * 2
    g.fillStyle(WOOD.roof, 1)
    g.fillRect(cx - eaveW / 2, y - 10, eaveW, 10)
    g.lineStyle(1.5, WOOD.roofDark, 0.8)
    g.strokeRect(cx - eaveW / 2, y - 10, eaveW, 10)

    // 檐底阴影
    g.fillStyle(WOOD.roofDark, 0.6)
    g.fillRect(cx - eaveW / 2, y - 3, eaveW, 3)

    // 檐口高光
    g.fillStyle(WOOD.roofLite, 0.6)
    g.fillRect(cx - eaveW / 2, y - 10, eaveW, 2)

    // 檐角翘起
    g.fillStyle(WOOD.roofLite, 1)
    g.beginPath()
    g.moveTo(cx - eaveW / 2, y - 10)
    g.lineTo(cx - eaveW / 2 - 10, y - 18)
    g.lineTo(cx - eaveW / 2, y)
    g.closePath()
    g.fillPath()

    g.beginPath()
    g.moveTo(cx + eaveW / 2, y - 10)
    g.lineTo(cx + eaveW / 2 + 10, y - 18)
    g.lineTo(cx + eaveW / 2, y)
    g.closePath()
    g.fillPath()
  }

  // ③ 塔顶
  const topY = baseY - (levels + 1) * levelH + 8
  const topW = baseW * Math.pow(shrink, levels) + 20

  g.fillStyle(WOOD.roof, 1)
  g.fillRect(cx - topW / 2 - 30, topY, topW + 60, 12)
  g.lineStyle(2, WOOD.roofDark, 0.8)
  g.strokeRect(cx - topW / 2 - 30, topY, topW + 60, 12)

  g.fillStyle(WOOD.roofLite, 1)
  g.beginPath()
  g.moveTo(cx - topW / 2 - 30, topY)
  g.lineTo(cx - topW / 2 - 42, topY - 10)
  g.lineTo(cx - topW / 2 - 30, topY + 12)
  g.closePath()
  g.fillPath()
  g.beginPath()
  g.moveTo(cx + topW / 2 + 30, topY)
  g.lineTo(cx + topW / 2 + 42, topY - 10)
  g.lineTo(cx + topW / 2 + 30, topY + 12)
  g.closePath()
  g.fillPath()

  // 顶部"小殿"
  g.fillStyle(WOOD.wallRed, 1)
  g.fillRect(cx - 30, topY - 20, 60, 20)
  g.fillStyle(WOOD.roofDark, 1)
  g.beginPath()
  g.moveTo(cx - 40, topY - 20)
  g.lineTo(cx + 40, topY - 20)
  g.lineTo(cx, topY - 45)
  g.closePath()
  g.fillPath()

  // 塔尖
  g.fillStyle(0xd4a338, 1)
  g.fillRect(cx - 2, topY - 65, 4, 20)
  g.fillCircle(cx, topY - 68, 6)
  g.fillCircle(cx, topY - 78, 4)
}

/**
 * 绘制"松柏"
 */
export function drawPine(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
) {
  g.fillStyle(WOOD.shadow, 0.3)
  g.fillEllipse(x + 6, y + 6, 40 * scale, 14 * scale)

  g.fillStyle(WOOD.timberDark, 1)
  g.fillRect(x - 4 * scale, y - 30 * scale, 8 * scale, 34 * scale)

  g.fillStyle(WOOD.pineDark, 1)
  g.fillTriangle(
    x, y - 80 * scale,
    x - 26 * scale, y - 20 * scale,
    x + 26 * scale, y - 20 * scale,
  )
  g.fillStyle(WOOD.pine, 1)
  g.fillTriangle(
    x, y - 100 * scale,
    x - 20 * scale, y - 45 * scale,
    x + 20 * scale, y - 45 * scale,
  )
  g.fillStyle(WOOD.pineLite, 0.9)
  g.fillTriangle(
    x, y - 115 * scale,
    x - 12 * scale, y - 70 * scale,
    x + 12 * scale, y - 70 * scale,
  )
}

/**
 * 绘制"灌木"
 */
export function drawBush(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  scale = 1,
) {
  g.fillStyle(WOOD.pineDark, 1)
  g.fillEllipse(x, y + 2 * scale, 60 * scale, 30 * scale)
  g.fillStyle(WOOD.pine, 1)
  g.fillEllipse(x - 10 * scale, y - 2 * scale, 40 * scale, 24 * scale)
  g.fillEllipse(x + 10 * scale, y - 2 * scale, 40 * scale, 24 * scale)
  g.fillStyle(WOOD.pineLite, 0.8)
  g.fillEllipse(x, y - 8 * scale, 40 * scale, 18 * scale)
}

/**
 * 绘制"石阶"
 */
export function drawStoneSteps(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  topY: number,
  steps = 3,
) {
  for (let i = 0; i < steps; i += 1) {
    const w = 100 - i * 12
    const y = topY + i * 12
    g.fillStyle(WOOD.stoneLite, 1)
    g.fillRect(cx - w / 2, y, w, 10)
    g.lineStyle(1, WOOD.stoneDark, 0.6)
    g.strokeRect(cx - w / 2, y, w, 10)
  }
}

export { WOOD }