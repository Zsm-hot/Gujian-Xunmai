// 图片在屏幕上的基础布局（缩小以适应屏幕高度）
export const MURAL_BASE = {
  leftX: 90,    // 往左挪一点
  rightX: 580,  // 往左挪一点（右边空出 1280 - (580+435) = 265px，足够放按钮了）
  y: 110,       // 下移一点，避开左上角
  w: 435,       
  h: 580,       
}
/** 5 处差异（坐标需要根据新的尺寸 435x580 重新按比例计算） */
export type DifferenceConfig = {
  id: string
  hint: string
  localX: number
  localY: number
  radius: number
}

export const egyptDifferences: DifferenceConfig[] = [
  { 
    id: 'corner', 
    hint: '左上角的人物消失了', 
    localX: 28,    // 原来 35 * (435/560)
    localY: 32,    // 原来 40 * (580/746)
    radius: 30 
  },
  { 
    id: 'sun', 
    hint: '太阳的颜色变了', 
    localX: 210,   // 原来 270 * (435/560)
    localY: 110,   // 原来 140 * (580/746)
    radius: 32 
  },
  { 
    id: 'sun2', 
    hint: '右上角的太阳变色了', 
    localX: 370,   // 原来 475 * (435/560)
    localY: 118,   // 原来 150 * (580/746)
    radius: 40 
  },
  { 
    id: 'shield', 
    hint: '士兵的盾牌少了一个', 
    localX: 230,   // 原来 295 * (435/560)
    localY: 335,   // 原来 430 * (580/746)
    radius: 25 
  },
  { 
    id: 'fish', 
    hint: '底部的鱼少了一条', 
    localX: 326,   // 原来 420 * (435/560)
    localY: 521,   // 原来 670 * (580/746)
    radius: 30 
  },
]