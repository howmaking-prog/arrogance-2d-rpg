import { generateDungeon } from './generator.js?v=13'
import { modeForFloor, themeForMode } from './themes.js?v=13'
import { TILE } from './tiles.js?v=13'

const TARGET_COLUMNS = 30
const TARGET_ROWS = 20
const MIN_TILE_SIZE = 8
const MAX_TILE_SIZE = 64
const MIN_GRID = 8
const HOTBAR_CLEARANCE = 88
const ROOM_AREA_DIVISOR = 48
const MIN_ROOM_COUNT = 3
const MAX_ROOM_COUNT = 8

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// 화면 안에 30칸 안팎의 던전이 들어오도록 칸 크기를 고른다.
const fitGrid = (areaWidth, areaHeight) => {
  let tileSize = Math.floor(Math.min(areaWidth / TARGET_COLUMNS, areaHeight / TARGET_ROWS))
  tileSize = clamp(tileSize, MIN_TILE_SIZE, MAX_TILE_SIZE)
  let cols = Math.floor(areaWidth / tileSize)
  let rows = Math.floor(areaHeight / tileSize)

  while ((cols < MIN_GRID || rows < MIN_GRID) && tileSize > MIN_TILE_SIZE) {
    tileSize -= 1
    cols = Math.floor(areaWidth / tileSize)
    rows = Math.floor(areaHeight / tileSize)
  }

  return {
    tileSize,
    cols: Math.max(1, cols),
    rows: Math.max(1, rows),
  }
}

const walkableTile = (grid, x, y) => {
  const row = grid[y]
  if (!row || x < 0 || x >= row.length) {
    return false
  }
  return row[x] === TILE.FLOOR || row[x] === TILE.DOOR
}

// 생성한 칸 좌표를 캔버스 좌표로 바꾸고, 발밑이 지나갈 수 있는 칸을 알려 준다.
export const createDungeonLayout = ({ width, height, floor, seed, bounds }) => {
  try {
    const left = bounds.minX
    const right = Math.max(bounds.minX + MIN_TILE_SIZE, bounds.maxX)
    const top = bounds.minY
    const bottom = Math.max(top + MIN_TILE_SIZE, Math.min(bounds.maxY, height - HOTBAR_CLEARANCE))
    const areaWidth = Math.max(MIN_TILE_SIZE, right - left)
    const areaHeight = Math.max(MIN_TILE_SIZE, bottom - top)
    const fitted = fitGrid(areaWidth, areaHeight)
    const gridWidth = fitted.cols * fitted.tileSize
    const gridHeight = fitted.rows * fitted.tileSize
    const offsetX = left + Math.floor((areaWidth - gridWidth) / 2)
    const offsetY = top + Math.floor((areaHeight - gridHeight) / 2)
    const mode = modeForFloor(floor)
    const roomCount = clamp(
      Math.floor((fitted.cols * fitted.rows) / ROOM_AREA_DIVISOR),
      MIN_ROOM_COUNT,
      MAX_ROOM_COUNT,
    )
    const dungeon = generateDungeon({
      width: fitted.cols,
      height: fitted.rows,
      roomCount,
      seed,
      mode,
    })

    const toPixel = (tile) => ({
      x: offsetX + tile.x * fitted.tileSize + fitted.tileSize / 2,
      y: offsetY + tile.y * fitted.tileSize + fitted.tileSize / 2,
    })

    const tileOf = (point) => ({
      x: Math.floor((point.x - offsetX) / fitted.tileSize),
      y: Math.floor((point.y - offsetY) / fitted.tileSize),
    })

    const isWalkable = (x, y) => {
      const tile = tileOf({ x, y })
      return walkableTile(dungeon.grid, tile.x, tile.y)
    }

    const nearestWalkable = (point) => {
      if (isWalkable(point.x, point.y)) {
        return { x: point.x, y: point.y }
      }
      const origin = tileOf(point)
      const limit = Math.max(fitted.cols, fitted.rows)
      for (let radius = 1; radius <= limit; radius += 1) {
        for (let y = origin.y - radius; y <= origin.y + radius; y += 1) {
          for (let x = origin.x - radius; x <= origin.x + radius; x += 1) {
            const edge = Math.max(Math.abs(x - origin.x), Math.abs(y - origin.y)) === radius
            if (!edge || !walkableTile(dungeon.grid, x, y)) {
              continue
            }
            return toPixel({ x, y })
          }
        }
      }
      return toPixel(dungeon.playerStart)
    }

    const exitNeighbors = NEIGHBORS
      .map(([dx, dy]) => ({ x: dungeon.exitPortal.x + dx, y: dungeon.exitPortal.y + dy }))
      .filter((tile) => walkableTile(dungeon.grid, tile.x, tile.y))
    const downTile = dungeon.rooms[0]
      ? {
        x: dungeon.rooms[0].x,
        y: dungeon.rooms[0].y + dungeon.rooms[0].height - 1,
      }
      : dungeon.playerStart
    const separatedDown = downTile.x === dungeon.playerStart.x && downTile.y === dungeon.playerStart.y
      ? {
        x: dungeon.rooms[0].x + dungeon.rooms[0].width - 1,
        y: dungeon.rooms[0].y,
      }
      : downTile

    const monsterPixels = dungeon.monsterSpawns
      .filter((spawn) => spawn.kind === 'monster')
      .map((spawn) => toPixel(spawn))
    const trapTiles = dungeon.monsterSpawns
      .filter((spawn) => spawn.kind === 'trap')
      .map((spawn) => ({ x: spawn.x, y: spawn.y }))

    return {
      seed,
      floor,
      mode,
      theme: themeForMode(mode),
      tileSize: fitted.tileSize,
      offsetX,
      offsetY,
      cols: fitted.cols,
      rows: fitted.rows,
      grid: dungeon.grid,
      trapTiles,
      playerStart: toPixel(dungeon.playerStart),
      exitPortal: toPixel(dungeon.exitPortal),
      exitApproach: toPixel(exitNeighbors[0] || dungeon.exitPortal),
      downStair: toPixel(separatedDown),
      chest: toPixel(dungeon.chestSpawn),
      monsters: monsterPixels,
      isWalkable,
      nearestWalkable,
    }
  } catch (error) {
    console.error('던전 배치 실패', error)
    throw error
  }
}
