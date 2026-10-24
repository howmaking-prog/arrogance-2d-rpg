import { generateDungeon } from './generator.js?v=16'
import { cameraFor, pickUpStairTile, roomCountForWorld, WORLD_COLUMNS, WORLD_ROWS, WORLD_TILE_SIZE, worldPixelSize } from './world.js?v=16'
import { modeForFloor, themeForMode } from './themes.js?v=16'
import { TILE } from './tiles.js?v=16'

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

const walkableTile = (grid, x, y) => {
  const row = grid[y]
  if (!row || x < 0 || x >= row.length) {
    return false
  }
  return row[x] === TILE.FLOOR || row[x] === TILE.DOOR
}

// 화면과 따로 넓은 던전을 만들고, 칸 좌표를 월드 좌표로 바꾼다.
export const createDungeonLayout = ({ floor, seed }) => {
  try {
    const world = worldPixelSize()
    const mode = modeForFloor(floor)
    const dungeon = generateDungeon({
      width: WORLD_COLUMNS,
      height: WORLD_ROWS,
      roomCount: roomCountForWorld(),
      seed,
      mode,
    })
    const offsetX = 0
    const offsetY = 0
    const tileSize = WORLD_TILE_SIZE

    const toPixel = (tile) => ({
      x: offsetX + tile.x * tileSize + tileSize / 2,
      y: offsetY + tile.y * tileSize + tileSize / 2,
    })

    const tileOf = (point) => ({
      x: Math.floor((point.x - offsetX) / tileSize),
      y: Math.floor((point.y - offsetY) / tileSize),
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
      const limit = Math.max(WORLD_COLUMNS, WORLD_ROWS)
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

    const upStairTile = pickUpStairTile({
      rooms: dungeon.rooms,
      grid: dungeon.grid,
      seed,
      blocked: [dungeon.playerStart, dungeon.chestSpawn],
    })
    const exitNeighbors = NEIGHBORS
      .map(([dx, dy]) => ({ x: upStairTile.x + dx, y: upStairTile.y + dy }))
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
    const encounter = monsterPixels[0] || (trapTiles[0] ? toPixel(trapTiles[0]) : toPixel(dungeon.chestSpawn))

    return {
      seed,
      floor,
      mode,
      theme: themeForMode(mode),
      tileSize,
      offsetX,
      offsetY,
      cols: WORLD_COLUMNS,
      rows: WORLD_ROWS,
      worldWidth: world.width,
      worldHeight: world.height,
      grid: dungeon.grid,
      trapTiles,
      playerStart: toPixel(dungeon.playerStart),
      exitPortal: toPixel(upStairTile),
      exitApproach: toPixel(exitNeighbors[0] || upStairTile),
      downStair: toPixel(separatedDown),
      chest: toPixel(dungeon.chestSpawn),
      monsters: monsterPixels,
      encounter,
      isWalkable,
      nearestWalkable,
      camera: (focus, viewWidth, viewHeight) => cameraFor(focus, viewWidth, viewHeight, world.width, world.height),
    }
  } catch (error) {
    console.error('던전 배치 실패', error)
    throw error
  }
}
