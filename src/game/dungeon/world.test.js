import { generateDungeon } from './generator.js'
import { cameraFor, pickUpStairTile, roomCountForWorld, WORLD_COLUMNS, WORLD_ROWS, worldPixelSize } from './world.js'
import { TILE } from './tiles.js'

describe('넓은 던전 월드', () => {
  test('층 맵은 한 화면보다 넓고 칸 수가 고정이다', () => {
    const world = worldPixelSize()
    expect(WORLD_COLUMNS).toBeGreaterThan(40)
    expect(WORLD_ROWS).toBeGreaterThan(30)
    expect(world.width).toBeGreaterThan(1920)
    expect(world.height).toBeGreaterThan(1080)
    expect(roomCountForWorld()).toBeGreaterThan(8)
  })

  test('카메라는 플레이어를 가운데에 두고 맵 밖으로 나가지 않는다', () => {
    expect(cameraFor({ x: 1000, y: 800 }, 800, 600, 3000, 2000)).toEqual({ x: 600, y: 500 })
    expect(cameraFor({ x: 100, y: 80 }, 800, 600, 3000, 2000)).toEqual({ x: 0, y: 0 })
    expect(cameraFor({ x: 2900, y: 1900 }, 800, 600, 3000, 2000)).toEqual({ x: 2200, y: 1400 })
  })

  test('위층 계단은 시작 칸이 아니고 같은 시드면 같은 칸이다', () => {
    const dungeon = generateDungeon({
      width: 40,
      height: 30,
      roomCount: 8,
      seed: 42,
    })
    const first = pickUpStairTile({
      rooms: dungeon.rooms,
      grid: dungeon.grid,
      seed: 42,
      blocked: [dungeon.playerStart],
    })
    const second = pickUpStairTile({
      rooms: dungeon.rooms,
      grid: dungeon.grid,
      seed: 42,
      blocked: [dungeon.playerStart],
    })
    expect(second).toEqual(first)
    expect(dungeon.grid[first.y][first.x]).toBe(TILE.FLOOR)
    const startRoom = dungeon.rooms[0]
    const inStart = first.x >= startRoom.x
      && first.x < startRoom.x + startRoom.width
      && first.y >= startRoom.y
      && first.y < startRoom.y + startRoom.height
    expect(inStart).toBe(false)
  })
})
