import { atlasFor, bedColorFor, separatedTileName, sourceRect, tileScreenPosition, tilesetPathForMode } from './tilemap.js'
import { TILE } from './tiles.js'

describe('타일맵 좌표', () => {
  test('화면 위치는 칸 번호에 32를 곱한 좌표다', () => {
    expect(tileScreenPosition(0, 0)).toEqual({ x: 0, y: 0 })
    expect(tileScreenPosition(2, 3)).toEqual({ x: 64, y: 96 })
    expect(tileScreenPosition(2, 3, 32, 10, 20)).toEqual({ x: 74, y: 116 })
  })

  test('시트에서 32칸을 자르는 위치는 열과 행으로 정한다', () => {
    expect(sourceRect(0, 0)).toEqual({ x: 0, y: 0, width: 32, height: 32 })
    expect(sourceRect(1, 0)).toEqual({ x: 32, y: 0, width: 32, height: 32 })
    expect(sourceRect(2, 1)).toEqual({ x: 64, y: 32, width: 32, height: 32 })
    expect(separatedTileName(1, 0)).toBe('tile_001.png')
    expect(separatedTileName(2, 1)).toBe('tile_013.png')
  })

  test('빈 칸은 그리지 않고 바닥, 벽, 문은 모드마다 다른 칸을 고른다', () => {
    expect(atlasFor(TILE.EMPTY, 'NORMAL', 0, 0, 1)).toBeNull()
    expect(bedColorFor(TILE.EMPTY, 'NORMAL')).toBeNull()
    const floor = atlasFor(TILE.FLOOR, 'NORMAL', 1, 2, 4)
    const wall = atlasFor(TILE.WALL, 'HARD', 3, 1, 9)
    const door = atlasFor(TILE.DOOR, 'NIGHTMARE', 0, 0, 1)
    expect(floor.col).toBeGreaterThanOrEqual(0)
    expect(wall.row).toBeGreaterThanOrEqual(0)
    expect(door).toEqual(atlasFor(TILE.DOOR, 'NIGHTMARE', 0, 0, 1))
    expect(bedColorFor(TILE.FLOOR, 'HELL')).toBe('#3a1c10')
  })

  test('난이도마다 타일셋 경로를 고르고 알 수 없는 모드는 일반 시트를 쓴다', () => {
    expect(tilesetPathForMode('NORMAL')).toBe('src/tileset/spritesheet.png')
    expect(tilesetPathForMode('HARD')).toBe('src/tileset/spritesheet.png')
    expect(tilesetPathForMode('NIGHTMARE')).toBe('src/tileset/spritesheet.png')
    expect(tilesetPathForMode('HELL')).toBe('src/tileset/spritesheet.png')
    expect(tilesetPathForMode('NOPE')).toBe(tilesetPathForMode('NORMAL'))
  })
})
