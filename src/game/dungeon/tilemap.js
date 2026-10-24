import { TILE } from './tiles.js'

const SOURCE_TILE_SIZE = 32
const SHEET_COLUMNS = 11
const TILESET_SHEET = 'src/tileset/spritesheet.png'

// 난이도마다 시트에서 다른 칸을 고른다. 파일은 하나고, 경로는 모드별로 바꿀 수 있다.
const TILESET_PATHS = {
  NORMAL: TILESET_SHEET,
  HARD: TILESET_SHEET,
  NIGHTMARE: TILESET_SHEET,
  HELL: TILESET_SHEET,
}

const cell = (col, row) => ({ col, row })

// 투명한 모서리 아래를 채울 색. 빈 모서리가 방 한가운데 구멍으로 보이지 않게 한다.
const TILE_ATLAS = {
  NORMAL: {
    floor: [cell(1, 0), cell(2, 0), cell(4, 0), cell(5, 0), cell(0, 1), cell(3, 1)],
    wall: [cell(0, 0), cell(8, 0), cell(6, 0)],
    door: [cell(2, 1)],
    floorBed: '#3a2a1c',
    wallBed: '#24180f',
  },
  HARD: {
    floor: [cell(6, 0), cell(7, 0), cell(6, 1), cell(7, 1), cell(4, 1)],
    wall: [cell(9, 0), cell(10, 0), cell(10, 1)],
    door: [cell(5, 1)],
    floorBed: '#2c241c',
    wallBed: '#1a140e',
  },
  NIGHTMARE: {
    floor: [cell(0, 8), cell(1, 8), cell(2, 8), cell(4, 8), cell(8, 8)],
    wall: [cell(6, 8), cell(7, 8)],
    door: [cell(5, 8)],
    floorBed: '#141824',
    wallBed: '#0c1018',
  },
  HELL: {
    floor: [cell(6, 1), cell(7, 1), cell(8, 1)],
    wall: [cell(9, 1), cell(10, 1), cell(9, 0)],
    door: [cell(8, 0)],
    floorBed: '#3a1c10',
    wallBed: '#1a0c08',
  },
}

const TRAP_CELL = cell(7, 1)

const mix = (n) => {
  let value = Math.imul(n, 374761393)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return (value ^ (value >>> 16)) >>> 0
}

export const tilesetPathForMode = (mode) => TILESET_PATHS[mode] || TILESET_PATHS.NORMAL

export const sourceRect = (col, row) => ({
  x: col * SOURCE_TILE_SIZE,
  y: row * SOURCE_TILE_SIZE,
  width: SOURCE_TILE_SIZE,
  height: SOURCE_TILE_SIZE,
})

// 분리된 타일 파일 이름. 시트 칸과 같은 순번이다.
export const separatedTileName = (col, row) => {
  const index = row * SHEET_COLUMNS + col
  return `tile_${String(index).padStart(3, '0')}.png`
}

export const tileScreenPosition = (gridX, gridY, tileSize = SOURCE_TILE_SIZE, originX = 0, originY = 0) => ({
  x: originX + gridX * tileSize,
  y: originY + gridY * tileSize,
})

export const atlasFor = (kind, mode, gridX, gridY, seed) => {
  const theme = TILE_ATLAS[mode] || TILE_ATLAS.NORMAL
  const variants = kind === TILE.WALL
    ? theme.wall
    : kind === TILE.DOOR
      ? theme.door
      : kind === TILE.FLOOR
        ? theme.floor
        : null
  if (!variants) {
    return null
  }
  return variants[mix(gridX * 17 + gridY * 31 + seed + kind) % variants.length]
}

export const bedColorFor = (kind, mode) => {
  const theme = TILE_ATLAS[mode] || TILE_ATLAS.NORMAL
  if (kind === TILE.WALL) {
    return theme.wallBed
  }
  if (kind === TILE.FLOOR || kind === TILE.DOOR) {
    return theme.floorBed
  }
  return null
}

const loadTileset = (src) => new Promise((resolve, reject) => {
  const image = new Image()
  image.addEventListener('load', () => {
    resolve(image)
  })
  image.addEventListener('error', () => {
    reject(new Error(`타일셋을 불러오지 못했습니다. ${src}`))
  })
  image.src = src
})

// 시트에서 32칸을 잘라 던전 그리드 위치에 그린다.
export const createTilemapRenderer = () => {
  let image = null
  let readyPath = ''
  let pendingPath = ''
  let activeMode = 'NORMAL'

  const useMode = (mode) => {
    activeMode = TILE_ATLAS[mode] ? mode : 'NORMAL'
    const path = tilesetPathForMode(activeMode)
    if (readyPath === path && image) {
      return Promise.resolve(image)
    }
    if (pendingPath === path) {
      return Promise.resolve(null)
    }
    pendingPath = path
    return loadTileset(path).then((loaded) => {
      image = loaded
      readyPath = path
      pendingPath = ''
      return loaded
    }).catch((error) => {
      pendingPath = ''
      console.error('타일셋 로드 실패', error)
      throw error
    })
  }

  const draw = (ctx, layout) => {
    if (!image) {
      return false
    }
    const { grid, tileSize, offsetX, offsetY, seed, trapTiles } = layout
    ctx.imageSmoothingEnabled = false
    for (let row = 0; row < grid.length; row += 1) {
      for (let column = 0; column < grid[row].length; column += 1) {
        const kind = grid[row][column]
        const spot = atlasFor(kind, activeMode, column, row, seed)
        if (!spot) {
          continue
        }
        const dest = tileScreenPosition(column, row, tileSize, offsetX, offsetY)
        const bed = bedColorFor(kind, activeMode)
        if (bed) {
          ctx.fillStyle = bed
          ctx.fillRect(dest.x, dest.y, tileSize, tileSize)
        }
        const crop = sourceRect(spot.col, spot.row)
        ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, dest.x, dest.y, tileSize, tileSize)
      }
    }
    ;(trapTiles || []).forEach((tile) => {
      const dest = tileScreenPosition(tile.x, tile.y, tileSize, offsetX, offsetY)
      const crop = sourceRect(TRAP_CELL.col, TRAP_CELL.row)
      ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, dest.x, dest.y, tileSize, tileSize)
    })
    return true
  }

  return {
    useMode,
    draw,
    isReady: () => Boolean(image),
  }
}

export { SOURCE_TILE_SIZE }
