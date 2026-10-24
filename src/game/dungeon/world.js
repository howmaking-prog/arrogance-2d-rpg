import { TILE } from './tiles.js'

// 화면보다 훨씬 넓은 층. 칸 크기는 고정하고, 보이는 범위만 카메라로 따라간다.
export const WORLD_COLUMNS = 80
export const WORLD_ROWS = 60
export const WORLD_TILE_SIZE = 48
export const MIN_WORLD_ROOMS = 18
export const MAX_WORLD_ROOMS = 32
export const WORLD_ROOM_AREA = 180

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const createRng = (seed) => {
  let state = seed >>> 0 || 1
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

export const worldPixelSize = () => ({
  width: WORLD_COLUMNS * WORLD_TILE_SIZE,
  height: WORLD_ROWS * WORLD_TILE_SIZE,
})

export const roomCountForWorld = () => clamp(
  Math.floor((WORLD_COLUMNS * WORLD_ROWS) / WORLD_ROOM_AREA),
  MIN_WORLD_ROOMS,
  MAX_WORLD_ROOMS,
)

// 플레이어가 화면 가운데에 오도록 하되, 맵 밖으로 비치지 않게 한다.
export const cameraFor = (focus, viewWidth, viewHeight, worldWidth, worldHeight) => ({
  x: clamp(focus.x - viewWidth / 2, 0, Math.max(0, worldWidth - viewWidth)),
  y: clamp(focus.y - viewHeight / 2, 0, Math.max(0, worldHeight - viewHeight)),
})

const floorTilesInRoom = (grid, room, blocked) => {
  const tiles = []
  for (let y = room.y; y < room.y + room.height; y += 1) {
    for (let x = room.x; x < room.x + room.width; x += 1) {
      const blockedTile = blocked.some((tile) => tile.x === x && tile.y === y)
      if (!blockedTile && grid[y]?.[x] === TILE.FLOOR) {
        tiles.push({ x, y })
      }
    }
  }
  return tiles
}

// 위층 계단은 시작 방이 아닌 방의 바닥 중 시드로 고른 칸이다.
export const pickUpStairTile = ({ rooms, grid, seed, blocked }) => {
  const rng = createRng(seed ^ 0x9e3779b9)
  const tiles = rooms.slice(1).flatMap((room) => floorTilesInRoom(grid, room, blocked))
  if (tiles.length === 0) {
    return blocked[0] || { x: 1, y: 1 }
  }
  return tiles[Math.floor(rng() * tiles.length)]
}
