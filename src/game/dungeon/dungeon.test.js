import { boxesOverlap, createDungeonGenerator, generateDungeon, roomBox, roomCenter } from './generator.js'
import { modeForFloor, themeForMode } from './themes.js'
import { TILE } from './tiles.js'

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

const insideRoom = (room, tile) => (
  tile.x >= room.x
  && tile.x < room.x + room.width
  && tile.y >= room.y
  && tile.y < room.y + room.height
)

const reachableTiles = (dungeon) => {
  const seen = new Set()
  const stack = [dungeon.playerStart]
  while (stack.length > 0) {
    const current = stack.pop()
    const key = `${current.x},${current.y}`
    if (seen.has(key)) {
      continue
    }
    const tile = dungeon.grid[current.y]?.[current.x]
    if (tile !== TILE.FLOOR && tile !== TILE.DOOR) {
      continue
    }
    seen.add(key)
    NEIGHBORS.forEach(([dx, dy]) => {
      stack.push({ x: current.x + dx, y: current.y + dy })
    })
  }
  return seen
}

describe('방과 복도 던전', () => {
  test('기본 그리드는 30x30이고 칸 값은 빈칸, 벽, 바닥, 문만 쓴다', () => {
    const dungeon = generateDungeon({ seed: 11 })
    expect(dungeon.width).toBe(30)
    expect(dungeon.height).toBe(30)
    expect(dungeon.grid).toHaveLength(30)
    dungeon.grid.forEach((row) => {
      expect(row).toHaveLength(30)
      row.forEach((tile) => {
        expect([TILE.EMPTY, TILE.WALL, TILE.FLOOR, TILE.DOOR]).toContain(tile)
      })
    })
  })

  test('방은 4칸 이상 8칸 이하이고 서로 겹치지 않는다', () => {
    const dungeon = generateDungeon({ seed: 21, roomCount: 6 })
    expect(dungeon.rooms.length).toBeGreaterThan(1)
    dungeon.rooms.forEach((room) => {
      expect(room.width).toBeGreaterThanOrEqual(4)
      expect(room.width).toBeLessThanOrEqual(8)
      expect(room.height).toBeGreaterThanOrEqual(4)
      expect(room.height).toBeLessThanOrEqual(8)
    })
    for (let index = 0; index < dungeon.rooms.length; index += 1) {
      for (let other = index + 1; other < dungeon.rooms.length; other += 1) {
        expect(boxesOverlap(roomBox(dungeon.rooms[index]), roomBox(dungeon.rooms[other]))).toBe(false)
      }
    }
  })

  test('시작 방은 첫 방이고 출구는 가장 먼 방이며 복도로 이어진다', () => {
    const dungeon = generateDungeon({ seed: 4, roomCount: 5 })
    const startRoom = dungeon.rooms[0]
    const exitRoom = dungeon.rooms[dungeon.exitRoomIndex]
    expect(insideRoom(startRoom, dungeon.playerStart)).toBe(true)
    expect(dungeon.grid[dungeon.playerStart.y][dungeon.playerStart.x]).toBe(TILE.FLOOR)
    expect(insideRoom(exitRoom, dungeon.exitPortal)).toBe(true)
    expect(dungeon.grid[dungeon.exitPortal.y][dungeon.exitPortal.x]).toBe(TILE.FLOOR)

    const start = roomCenter(startRoom)
    const exitDistance = (room) => {
      const center = roomCenter(room)
      return (center.x - start.x) ** 2 + (center.y - start.y) ** 2
    }
    dungeon.rooms.forEach((room) => {
      expect(exitDistance(room)).toBeLessThanOrEqual(exitDistance(exitRoom))
    })

    const reached = reachableTiles(dungeon)
    expect(reached.has(`${dungeon.exitPortal.x},${dungeon.exitPortal.y}`)).toBe(true)
    dungeon.rooms.forEach((room) => {
      const center = roomCenter(room)
      expect(reached.has(`${center.x},${center.y}`)).toBe(true)
    })
    if (dungeon.rooms.length > 1) {
      const doors = dungeon.grid.flat().filter((tile) => tile === TILE.DOOR)
      expect(doors.length).toBeGreaterThan(0)
    }
  })

  test('시작방과 출구방을 뺀 방에 몬스터나 함정을 1마리 이상 3마리 이하로 둔다', () => {
    const dungeon = generateDungeon({ seed: 8, width: 30, height: 30, roomCount: 6 })
    expect(dungeon.monsterSpawns.length).toBeLessThanOrEqual(3)
    if (dungeon.rooms.length >= 3) {
      expect(dungeon.monsterSpawns.length).toBeGreaterThanOrEqual(1)
    }
    const startRoom = dungeon.rooms[0]
    const exitRoom = dungeon.rooms[dungeon.exitRoomIndex]
    dungeon.monsterSpawns.forEach((spawn) => {
      expect(['monster', 'trap']).toContain(spawn.kind)
      expect(dungeon.grid[spawn.y][spawn.x]).toBe(TILE.FLOOR)
      expect(insideRoom(startRoom, spawn)).toBe(false)
      expect(insideRoom(exitRoom, spawn)).toBe(false)
    })
  })

  test('같은 시드는 같은 맵을 만들고 생성기 함수로도 다시 만들 수 있다', () => {
    const first = generateDungeon({ seed: 7, roomCount: 5, mode: 'HARD' })
    const second = generateDungeon({ seed: 7, roomCount: 5, mode: 'HARD' })
    expect(second.grid).toEqual(first.grid)
    expect(second.playerStart).toEqual(first.playerStart)
    expect(second.exitPortal).toEqual(first.exitPortal)
    expect(second.monsterSpawns).toEqual(first.monsterSpawns)

    const generator = createDungeonGenerator({ seed: 7, roomCount: 5, mode: 'HARD' })
    expect(generator.generate().grid).toEqual(first.grid)
  })

  test('크기가 너무 작거나 방 개수가 없으면 생성하지 않는다', () => {
    expect(() => generateDungeon({ width: 4, height: 4 })).toThrow()
    expect(() => generateDungeon({ width: 30, height: 30, roomCount: 0 })).toThrow()
  })
})

describe('난이도 테마', () => {
  test('층마다 일반, 철벽, 악몽, 지옥 순서로 바뀐다', () => {
    expect(modeForFloor(1)).toBe('NORMAL')
    expect(modeForFloor(2)).toBe('NORMAL')
    expect(modeForFloor(3)).toBe('HARD')
    expect(modeForFloor(4)).toBe('HARD')
    expect(modeForFloor(5)).toBe('NIGHTMARE')
    expect(modeForFloor(6)).toBe('NIGHTMARE')
    expect(modeForFloor(7)).toBe('HELL')
    expect(modeForFloor(12)).toBe('HELL')
  })

  test('알 수 없는 난이도는 일반 석재 색으로 되돌린다', () => {
    expect(themeForMode('HELL').id).toBe('HELL')
    expect(themeForMode('NORMAL').floors.length).toBeGreaterThan(0)
    expect(themeForMode('NOPE').id).toBe('NORMAL')
  })
})
