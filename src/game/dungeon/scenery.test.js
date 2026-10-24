import { isFacingWall } from './scenery.js'
import { TILE } from './tiles.js'

describe('던전 벽 표현', () => {
  test('바닥과 맞닿은 벽만 벽으로 그린다', () => {
    const grid = [
      [TILE.EMPTY, TILE.WALL, TILE.EMPTY],
      [TILE.WALL, TILE.FLOOR, TILE.WALL],
      [TILE.EMPTY, TILE.WALL, TILE.EMPTY],
    ]
    expect(isFacingWall(grid, 1, 0)).toBe(true)
    expect(isFacingWall(grid, 0, 0)).toBe(false)
    expect(isFacingWall(grid, 1, 1)).toBe(false)
  })
})
