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

// 타일 크기에 비례한 선·면 두께. 작은 칸에서도 디테일이 뭉개지지 않게 한다.
const px = (size, ratio, min = 1) => Math.max(min, Math.round(size * ratio))

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
  const inset = px(size, 0.12)
  const edge = px(size, 0.28)
  const color = paletteColor(theme.floors, column, row, seed)
  ctx.fillStyle = color
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = shift(color, hash(column, row, seed) % 5 === 0 ? 18 : 8)
  ctx.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1)
  if (hash(column + 3, row + 7, seed) % 9 === 0) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)'
    ctx.beginPath()
    ctx.moveTo(x + px(size, 0.25), y + size * 0.35)
    ctx.lineTo(x + size - px(size, 0.3), y + size * 0.62)
    ctx.stroke()
  }
  // 칸 안을 더 잘게 나눠 배경이 거친 큰 픽셀처럼 보이지 않게 한다.
  const grain = px(size, 0.2)
  for (let gy = 0; gy < size; gy += grain) {
    for (let gx = 0; gx < size; gx += grain) {
      if (hash(column * 17 + gx, row * 13 + gy, seed) % 11 !== 0) {
        continue
      }
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)'
      ctx.fillRect(x + gx, y + gy, Math.min(grain, size - gx), Math.min(grain, size - gy))
    }
  }
  NEIGHBORS.forEach(([dx, dy]) => {
    if (walkable(cellKind(grid, column + dx, row + dy)) || cellKind(grid, column + dx, row + dy) === undefined) {
      return
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
    if (dx === 0) {
      ctx.fillRect(x, dy < 0 ? y : y + size - edge, size, edge)
    } else {
      ctx.fillRect(dx < 0 ? x : x + size - edge, y, edge, size)
    }
  })
}

const paintWall = (ctx, x, y, size, theme, seed, grid, column, row) => {
  const inset = px(size, 0.1)
  const ledge = px(size, 0.12)
  const base = px(size, 0.38)
  const color = paletteColor(theme.walls, column, row, seed)
  ctx.fillStyle = shift(color, -18)
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = color
  ctx.fillRect(x + inset, y + inset, size - inset * 2, Math.floor(size * 0.62))
  ctx.fillStyle = shift(color, 16)
  ctx.fillRect(x + inset * 2, y + inset * 2, size - inset * 4 - ledge, ledge)
  if (walkable(cellKind(grid, column, row + 1))) {
    ctx.fillStyle = shift(color, -36)
    ctx.fillRect(x, y + size - base, size, base)
    ctx.fillStyle = 'rgba(255, 236, 200, 0.12)'
    ctx.fillRect(x, y + size - base, size, Math.max(1, Math.floor(base * 0.2)))
  }
}

const paintDoor = (ctx, x, y, size, theme) => {
  const frame = px(size, 0.22)
  const lintel = px(size, 0.18)
  ctx.fillStyle = theme.doorFloor
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = theme.doorFrame
  ctx.fillRect(x, y, frame, size)
  ctx.fillRect(x + size - frame, y, frame, size)
  ctx.fillRect(x, y, size, lintel)
}

const paintTorch = (ctx, x, y, size, theme) => {
  const cx = x + size / 2
  const cy = y + size - px(size, 0.55)
  const glowW = px(size, 0.55)
  const glowH = px(size, 0.28)
  const stickH = px(size, 0.45)
  ctx.fillStyle = theme.torchGlow
  ctx.beginPath()
  ctx.ellipse(cx, cy + px(size, 0.35), glowW, glowH, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = theme.doorFrame
  ctx.fillRect(cx - px(size, 0.08), cy, px(size, 0.16), stickH)
  ctx.fillStyle = theme.torchFlame
  ctx.beginPath()
  ctx.moveTo(cx, cy - px(size, 0.35))
  ctx.lineTo(cx + px(size, 0.18), cy + px(size, 0.08))
  ctx.lineTo(cx - px(size, 0.18), cy + px(size, 0.08))
  ctx.fill()
  ctx.fillStyle = theme.torchCore
  ctx.fillRect(cx - px(size, 0.05), cy - px(size, 0.15), px(size, 0.1), px(size, 0.15))
}

// 탑뷰 석재 던전. 마름모 타일 대신 바닥과 벽이 이어지게 그린다.
export const paintDungeon = (ctx, layout) => {
  const { grid, tileSize, offsetX, offsetY, seed } = layout
  const theme = themeForMode(layout.mode)
  ctx.fillStyle = theme.void
  ctx.fillRect(0, 0, layout.worldWidth, layout.worldHeight)
  for (let row = 0; row < grid.length; row += 1) {
    for (let column = 0; column < grid[row].length; column += 1) {
      const kind = grid[row][column]
      const x = offsetX + column * tileSize
      const y = offsetY + row * tileSize
      if (kind === TILE.FLOOR) {
        paintFloor(ctx, x, y, tileSize, theme, seed, grid, column, row)
      } else if (kind === TILE.DOOR) {
        paintDoor(ctx, x, y, tileSize, theme)
      } else if (isFacingWall(grid, column, row)) {
        paintWall(ctx, x, y, tileSize, theme, seed, grid, column, row)
      }
    }
  }
  ;(layout.torches || []).forEach((torch) => {
    paintTorch(ctx, torch.x, torch.y, tileSize, theme)
  })
}
