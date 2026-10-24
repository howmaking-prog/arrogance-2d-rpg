import { themeForMode } from './themes.js'
import { TILE } from './tiles.js'

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

const hash = (x, y, seed) => {
  let value = Math.imul(x * 17 + y * 31 + seed + 1, 374761393)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return (value ^ (value >>> 16)) >>> 0
}

const walkable = (kind) => kind === TILE.FLOOR || kind === TILE.DOOR

export const cellKind = (grid, x, y) => grid[y]?.[x]

// 바닥과 맞닿은 벽만 그린다. 먼 빈 공간은 어둠으로 남긴다.
export const isFacingWall = (grid, x, y) => {
  if (cellKind(grid, x, y) !== TILE.WALL) {
    return false
  }
  return NEIGHBORS.some(([dx, dy]) => walkable(cellKind(grid, x + dx, y + dy)))
}

const paletteColor = (colors, x, y, seed) => colors[hash(x, y, seed) % colors.length]

const shift = (hex, amount) => {
  const value = Number.parseInt(hex.slice(1), 16)
  const channel = (bits) => Math.max(0, Math.min(255, ((value >> bits) & 255) + amount))
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
}

const paintFloor = (ctx, x, y, size, theme, seed, grid, column, row) => {
  const color = paletteColor(theme.floors, column, row, seed)
  ctx.fillStyle = color
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = shift(color, hash(column, row, seed) % 5 === 0 ? 18 : 8)
  ctx.fillRect(x + 3, y + 3, size - 6, size - 6)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1)
  if (hash(column + 3, row + 7, seed) % 9 === 0) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)'
    ctx.beginPath()
    ctx.moveTo(x + 8, y + size * 0.35)
    ctx.lineTo(x + size - 10, y + size * 0.62)
    ctx.stroke()
  }
  NEIGHBORS.forEach(([dx, dy]) => {
    if (walkable(cellKind(grid, column + dx, row + dy)) || cellKind(grid, column + dx, row + dy) === undefined) {
      return
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
    if (dx === 0) {
      ctx.fillRect(x, dy < 0 ? y : y + size - 7, size, 7)
    } else {
      ctx.fillRect(dx < 0 ? x : x + size - 7, y, 7, size)
    }
  })
}

const paintWall = (ctx, x, y, size, theme, seed, grid, column, row) => {
  const color = paletteColor(theme.walls, column, row, seed)
  ctx.fillStyle = shift(color, -18)
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = color
  ctx.fillRect(x + 2, y + 2, size - 4, Math.floor(size * 0.62))
  ctx.fillStyle = shift(color, 16)
  ctx.fillRect(x + 4, y + 4, size - 12, 3)
  if (walkable(cellKind(grid, column, row + 1))) {
    ctx.fillStyle = shift(color, -36)
    ctx.fillRect(x, y + size - 10, size, 10)
    ctx.fillStyle = 'rgba(255, 236, 200, 0.12)'
    ctx.fillRect(x, y + size - 10, size, 2)
  }
}

const paintDoor = (ctx, x, y, size, theme) => {
  ctx.fillStyle = theme.doorFloor
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = theme.doorFrame
  ctx.fillRect(x, y, 6, size)
  ctx.fillRect(x + size - 6, y, 6, size)
  ctx.fillRect(x, y, size, 5)
}

const paintTorch = (ctx, x, y, size, theme) => {
  const cx = x + size / 2
  const cy = y + size - 16
  ctx.fillStyle = theme.torchGlow
  ctx.beginPath()
  ctx.ellipse(cx, cy + 10, 16, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = theme.doorFrame
  ctx.fillRect(cx - 2, cy, 4, 12)
  ctx.fillStyle = theme.torchFlame
  ctx.beginPath()
  ctx.moveTo(cx, cy - 10)
  ctx.lineTo(cx + 5, cy + 2)
  ctx.lineTo(cx - 5, cy + 2)
  ctx.fill()
  ctx.fillStyle = theme.torchCore
  ctx.fillRect(cx - 1, cy - 4, 2, 4)
}

// 탑뷰 석재 던전. 마름모 타일 대신 바닥과 벽이 이어지게 그린다.
export const paintDungeon = (ctx, layout) => {
  const theme = layout.theme || themeForMode(layout.mode)
  const { grid, tileSize, offsetX, offsetY, seed } = layout
  ctx.fillStyle = theme.voidColor
  ctx.fillRect(0, 0, layout.worldWidth, layout.worldHeight)
  const torches = []
  for (let row = 0; row < grid.length; row += 1) {
    for (let column = 0; column < grid[row].length; column += 1) {
      const kind = grid[row][column]
      const x = offsetX + column * tileSize
      const y = offsetY + row * tileSize
      if (kind === TILE.FLOOR) {
        paintFloor(ctx, x, y, tileSize, theme, seed, grid, column, row)
      } else if (kind === TILE.DOOR) {
        paintDoor(ctx, x, y, tileSize, theme)
      } else if (kind === TILE.WALL) {
        paintWall(ctx, x, y, tileSize, theme, seed, grid, column, row)
        const south = cellKind(grid, column, row + 1)
        if (isFacingWall(grid, column, row) && walkable(south) && hash(column, row, seed) % theme.accentEvery === 0) {
          torches.push({ x, y })
        }
      }
    }
  }
  torches.forEach((torch) => {
    paintTorch(ctx, torch.x, torch.y, tileSize, theme)
  })
}
