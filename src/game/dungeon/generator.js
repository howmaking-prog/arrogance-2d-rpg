import { TILE } from './tiles.js'

const DEFAULT_WIDTH = 30
const DEFAULT_HEIGHT = 30
const DEFAULT_ROOM_COUNT = 6
const MIN_ROOM_SIZE = 4
const MAX_ROOM_SIZE = 8
const MIN_MAP_SIZE = 8
const ROOM_PADDING = 2
const ROOM_PLACEMENT_ATTEMPTS = 40
const MONSTER_MIN = 1
const MONSTER_MAX = 3
const DEFAULT_SEED = 1

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

const keyOf = (x, y) => `${x},${y}`

const assertMapSize = (width, height) => {
  if (!Number.isInteger(width) || !Number.isInteger(height)) {
    throw new Error('던전 크기는 정수여야 합니다.')
  }
  if (width < MIN_MAP_SIZE || height < MIN_MAP_SIZE) {
    throw new Error(`던전은 최소 ${MIN_MAP_SIZE}x${MIN_MAP_SIZE} 칸이어야 합니다.`)
  }
}

// 시드가 같으면 같은 순서로 0 이상 1 미만의 값을 돌려준다.
const createRng = (seed) => {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

const rollInt = (rng, min, max) => min + Math.floor(rng() * (max - min + 1))

export const roomCenter = (room) => ({
  x: room.x + Math.floor((room.width - 1) / 2),
  y: room.y + Math.floor((room.height - 1) / 2),
})

// 방 둘레의 벽과 한 칸 간격을 포함한 겹침 검사 상자다.
export const roomBox = (room) => ({
  left: room.x - ROOM_PADDING,
  top: room.y - ROOM_PADDING,
  right: room.x + room.width + ROOM_PADDING - 1,
  bottom: room.y + room.height + ROOM_PADDING - 1,
})

export const boxesOverlap = (first, second) => (
  first.left <= second.right
  && second.left <= first.right
  && first.top <= second.bottom
  && second.top <= first.bottom
)

const emptyGrid = (width, height) => (
  Array.from({ length: height }, () => Array.from({ length: width }, () => TILE.EMPTY))
)

const inside = (width, height, x, y) => x >= 0 && y >= 0 && x < width && y < height

const carveRoom = (grid, room, roomFloors) => {
  const height = grid.length
  const width = grid[0].length
  for (let y = room.y - 1; y <= room.y + room.height; y += 1) {
    for (let x = room.x - 1; x <= room.x + room.width; x += 1) {
      if (!inside(width, height, x, y)) {
        continue
      }
      const interior = x >= room.x && x < room.x + room.width && y >= room.y && y < room.y + room.height
      if (interior) {
        grid[y][x] = TILE.FLOOR
        roomFloors.add(keyOf(x, y))
        continue
      }
      if (grid[y][x] === TILE.EMPTY) {
        grid[y][x] = TILE.WALL
      }
    }
  }
}

const traceCorridor = (from, to) => {
  const path = []
  const seen = new Set()
  const push = (x, y) => {
    const key = keyOf(x, y)
    if (seen.has(key)) {
      return
    }
    seen.add(key)
    path.push({ x, y })
  }

  let x = from.x
  const y = from.y
  const stepX = Math.sign(to.x - from.x)
  while (x !== to.x) {
    push(x, y)
    x += stepX
  }

  let corridorY = y
  const stepY = Math.sign(to.y - from.y)
  while (corridorY !== to.y) {
    push(x, corridorY)
    corridorY += stepY
  }
  push(to.x, to.y)
  return path
}

const applyCorridors = (grid, rooms, roomFloors) => {
  const height = grid.length
  const width = grid[0].length
  const path = []
  const seen = new Set()

  for (let index = 0; index < rooms.length - 1; index += 1) {
    traceCorridor(roomCenter(rooms[index]), roomCenter(rooms[index + 1])).forEach((cell) => {
      const key = keyOf(cell.x, cell.y)
      if (seen.has(key)) {
        return
      }
      seen.add(key)
      path.push(cell)
    })
  }

  path.forEach((cell) => {
    if (!inside(width, height, cell.x, cell.y) || roomFloors.has(keyOf(cell.x, cell.y))) {
      return
    }
    if (grid[cell.y][cell.x] === TILE.WALL) {
      const opensRoom = NEIGHBORS.some(([dx, dy]) => roomFloors.has(keyOf(cell.x + dx, cell.y + dy)))
      grid[cell.y][cell.x] = opensRoom ? TILE.DOOR : TILE.FLOOR
      return
    }
    if (grid[cell.y][cell.x] === TILE.EMPTY) {
      grid[cell.y][cell.x] = TILE.FLOOR
    }
  })

  path.forEach((cell) => {
    if (grid[cell.y][cell.x] !== TILE.FLOOR || roomFloors.has(keyOf(cell.x, cell.y))) {
      return
    }
    NEIGHBORS.forEach(([dx, dy]) => {
      const nextX = cell.x + dx
      const nextY = cell.y + dy
      if (!inside(width, height, nextX, nextY)) {
        return
      }
      if (grid[nextY][nextX] === TILE.EMPTY) {
        grid[nextY][nextX] = TILE.WALL
      }
    })
  })
}

// 한 칸 복도는 캐릭터보다 좁아서, 복도 바닥을 양옆으로 한 칸씩 넓힌다.
const widenCorridors = (grid, roomFloors) => {
  const height = grid.length
  const width = grid[0].length
  const grown = []
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const kind = grid[y][x]
      if ((kind !== TILE.FLOOR && kind !== TILE.DOOR) || roomFloors.has(keyOf(x, y))) {
        continue
      }
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nextX = x + dx
          const nextY = y + dy
          if (!inside(width, height, nextX, nextY) || roomFloors.has(keyOf(nextX, nextY))) {
            continue
          }
          if (grid[nextY][nextX] === TILE.EMPTY || grid[nextY][nextX] === TILE.WALL) {
            grown.push({ x: nextX, y: nextY })
          }
        }
      }
    }
  }
  grown.forEach((cell) => {
    if (grid[cell.y][cell.x] === TILE.EMPTY || grid[cell.y][cell.x] === TILE.WALL) {
      grid[cell.y][cell.x] = TILE.FLOOR
    }
  })
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (grid[y][x] !== TILE.FLOOR && grid[y][x] !== TILE.DOOR) {
        continue
      }
      NEIGHBORS.forEach(([dx, dy]) => {
        const nextX = x + dx
        const nextY = y + dy
        if (inside(width, height, nextX, nextY) && grid[nextY][nextX] === TILE.EMPTY) {
          grid[nextY][nextX] = TILE.WALL
        }
      })
    }
  }
}

const tilesInRoom = (grid, room) => {
  const tiles = []
  for (let y = room.y; y < room.y + room.height; y += 1) {
    for (let x = room.x; x < room.x + room.width; x += 1) {
      if (grid[y][x] === TILE.FLOOR) {
        tiles.push({ x, y })
      }
    }
  }
  return tiles
}

const distanceSquared = (from, to) => {
  const dx = from.x - to.x
  const dy = from.y - to.y
  return dx * dx + dy * dy
}

const farthestTile = (tiles, from) => tiles.reduce((best, tile) => {
  if (!best || distanceSquared(tile, from) > distanceSquared(best, from)) {
    return tile
  }
  return best
}, null)

const shuffle = (rng, list) => {
  const copy = [...list]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = current
  }
  return copy
}

const placeRooms = (width, height, roomCount, rng) => {
  const maxRoomWidth = Math.min(MAX_ROOM_SIZE, width - 2)
  const maxRoomHeight = Math.min(MAX_ROOM_SIZE, height - 2)
  const minRoomWidth = Math.min(MIN_ROOM_SIZE, maxRoomWidth)
  const minRoomHeight = Math.min(MIN_ROOM_SIZE, maxRoomHeight)
  const rooms = []

  for (let index = 0; index < roomCount; index += 1) {
    let placed = null
    for (let attempt = 0; attempt < ROOM_PLACEMENT_ATTEMPTS; attempt += 1) {
      const roomWidth = rollInt(rng, minRoomWidth, maxRoomWidth)
      const roomHeight = rollInt(rng, minRoomHeight, maxRoomHeight)
      const maxX = width - roomWidth - 1
      const maxY = height - roomHeight - 1
      if (maxX < 1 || maxY < 1) {
        continue
      }
      const room = {
        x: rollInt(rng, 1, maxX),
        y: rollInt(rng, 1, maxY),
        width: roomWidth,
        height: roomHeight,
      }
      const box = roomBox(room)
      if (rooms.some((other) => boxesOverlap(box, roomBox(other)))) {
        continue
      }
      placed = room
      break
    }
    if (placed) {
      rooms.push(placed)
    }
  }

  if (rooms.length > 0) {
    return rooms
  }

  const roomWidth = Math.max(1, Math.min(minRoomWidth, width - 2))
  const roomHeight = Math.max(1, Math.min(minRoomHeight, height - 2))
  return [{
    x: Math.max(1, Math.floor((width - roomWidth) / 2)),
    y: Math.max(1, Math.floor((height - roomHeight) / 2)),
    width: roomWidth,
    height: roomHeight,
  }]
}

const buildDungeon = ({ width, height, roomCount, seed, mode }) => {
  const rng = createRng(seed)
  const grid = emptyGrid(width, height)
  const rooms = placeRooms(width, height, roomCount, rng)
  const roomFloors = new Set()
  rooms.forEach((room) => carveRoom(grid, room, roomFloors))
  applyCorridors(grid, rooms, roomFloors)
  widenCorridors(grid, roomFloors)

  const playerStart = roomCenter(rooms[0])
  let exitRoomIndex = 0
  let farthest = -1
  rooms.forEach((room, index) => {
    const distance = distanceSquared(roomCenter(room), playerStart)
    if (distance > farthest) {
      farthest = distance
      exitRoomIndex = index
    }
  })

  const exitPortal = farthestTile(tilesInRoom(grid, rooms[exitRoomIndex]), playerStart) || playerStart
  const middleRooms = rooms.filter((_, index) => index !== 0 && index !== exitRoomIndex)
  const candidates = middleRooms.flatMap((room) => tilesInRoom(grid, room))
  const spawnCount = candidates.length === 0
    ? 0
    : Math.min(
      candidates.length,
      MONSTER_MIN + Math.floor(rng() * (MONSTER_MAX - MONSTER_MIN + 1)),
    )
  const monsterSpawns = shuffle(rng, candidates).slice(0, spawnCount).map((tile) => ({
    x: tile.x,
    y: tile.y,
    kind: rng() < 0.5 ? 'monster' : 'trap',
  }))

  const occupied = new Set([
    keyOf(playerStart.x, playerStart.y),
    keyOf(exitPortal.x, exitPortal.y),
    ...monsterSpawns.map((spawn) => keyOf(spawn.x, spawn.y)),
  ])
  const chestRooms = middleRooms.length > 0 ? middleRooms : [rooms[exitRoomIndex]]
  const chestCandidates = chestRooms
    .flatMap((room) => tilesInRoom(grid, room))
    .filter((tile) => !occupied.has(keyOf(tile.x, tile.y)))
  const chestSpawn = chestCandidates[Math.floor(rng() * Math.max(chestCandidates.length, 1))] || {
    x: playerStart.x,
    y: playerStart.y,
  }

  return {
    grid,
    width,
    height,
    rooms,
    playerStart,
    exitPortal,
    exitRoomIndex,
    monsterSpawns,
    chestSpawn,
    seed,
    mode,
  }
}

// 방과 복도로 던전을 만들고 시작, 출구, 몬스터 좌표를 함께 돌려준다.
export const generateDungeon = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  roomCount = DEFAULT_ROOM_COUNT,
  seed = DEFAULT_SEED,
  mode = 'NORMAL',
} = {}) => {
  try {
    assertMapSize(width, height)
    if (!Number.isInteger(roomCount) || roomCount < 1) {
      throw new Error('방 개수는 1 이상의 정수여야 합니다.')
    }
    if (!Number.isInteger(seed)) {
      throw new Error('던전 시드는 정수여야 합니다.')
    }
    const themeMode = mode === 'HARD' || mode === 'NIGHTMARE' || mode === 'HELL' || mode === 'NORMAL'
      ? mode
      : 'NORMAL'
    return buildDungeon({
      width,
      height,
      roomCount,
      seed,
      mode: themeMode,
    })
  } catch (error) {
    console.error('던전 생성 실패', error)
    throw error
  }
}

// 같은 옵션으로 던전을 다시 만들 수 있는 생성기다.
export const createDungeonGenerator = (options = {}) => ({
  generate: (overrides = {}) => generateDungeon({ ...options, ...overrides }),
})

export { TILE }
