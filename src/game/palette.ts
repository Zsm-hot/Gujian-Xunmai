/**
 * 故宫配色板
 * 朱红 / 金黄 / 汉白玉 / 青松
 * 保留水墨调以维持整体气质，但色相偏向宫城。
 */
export const palette = {
  // 背景与天光
  paper: 0xe7dfd2,
  mist: 0xe3dccd,        // 更暖的雾色
  sky: 0xd8d2c2,         // 暖调天光
  skyDeep: 0xbfb6a2,     // 暖灰远景

  // 地面（广场石砖）
  moss: 0xb7a98f,        // 旧石色（原苔绿）
  sage: 0xc8bda6,        // 石砖浅色
  lawn: 0xd6ccb6,        // 广场主色（原草地）
  lawnDeep: 0xbfb39b,    // 广场阴影（原深草）

  // 木材与红墙
  clay: 0x8a3424,        // 朱红（原陶土色，改成宫墙红）
  timber: 0x8a3424,      // 朱红柱
  timberDark: 0x7a2c20,  // 深朱红
  roof: 0x9c3a28,        // 琉璃红瓦（原灰瓦）
  roofLight: 0xb84a34,   // 亮红瓦面
  roofShadow: 0x7a3020,   // ← 新增：屋檐阴影 / 檐口色

  // 石作（台基、栏杆）
  stone: 0xe8e0cc,       // 汉白玉浅
  stoneDeep: 0xcfc6ae,   // 汉白玉深（台基侧面）
  path: 0xd8cfb8,        // 御道石
  pathEdge: 0xb0a68c,    // 御道边线

  // 水（金水河 / 或改成小水面）
  water: 0x7a98a0,
  waterDeep: 0x5d7a82,
  waterLite: 0xa9c0c4,

  // 植被（松柏，深绿）
  foliage: 0x4a6a4a,     // 松绿
  foliageDark: 0x2f4a30, // 深松绿
  foliageLite: 0x6b8a5f, // 松柏亮面

  // 阴影与墨
  shadow: 0x6a5a4c,
  ink: 0x3a2f28,

  // 金与高光
  gold: 0xd4a338,        // 真金（原土黄）
  rose: 0xcfa088,        // 暖粉（保留）
  cream: 0xf5eedd,       // 汉白玉高光
  panel: 0xefe6d8,       // UI 面板（保留）

  // 新增：琉璃金黄（用于金顶、宝顶）
  roofGold: 0xe0a824,    // 金黄琉璃
  roofGoldLight: 0xf0c248, // 金黄亮面

  // 新增：宫墙红（比 timber 更纯的红墙）
  wallRed: 0x9c3524,
  wallRedDark: 0x76261a,
} as const

export const UI_FONT = '"Noto Serif SC", "Songti SC", "STSong", SimSun, serif'