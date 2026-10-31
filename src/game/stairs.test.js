import { STAIR_TILE_SPAN, stairsFromLayout } from './stairs.js'

describe('층 입구 크기', () => {
  test('위층 입구는 여러 칸 넓이다', () => {
    const stairs = stairsFromLayout({
      tileSize: 48,
      exitPortal: { x: 100, y: 120 },
      downStair: { x: 40, y: 80 },
    }, 1)
    expect(STAIR_TILE_SPAN).toBe(8)
    expect(stairs[0].width).toBe(48 * STAIR_TILE_SPAN)
    expect(stairs[0].height).toBeGreaterThan(stairs[0].width * 0.7)
  })
})
