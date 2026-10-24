import { TILE } from './dungeon/tiles.js?v=13'

const TORCH_SPACING = 7
const VIGNETTE_INNER = 0.25
const VIGNETTE_OUTER = 0.78

const mix = (n) => {
  let value = Math.imul(n, 374761393)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return (value ^ (value >>> 16)) >>> 0
}

const shadeColor = (hex, amount) => {
  const value = Number.parseInt(hex.slice(1), 16)
  const clampChannel = (channel) => Math.max(0, Math.min(255, channel + amount))
  const red = clampChannel((value >> 16) & 255)
  const green = clampChannel((value >> 8) & 255)
  const blue = clampChannel(value & 255)
  return `rgb(${red}, ${green}, ${blue})`
}

let floorCache = null

const drawPaver = (ctx, pixelX, pixelY, tileSize, theme, tone) => {
  const grout = Math.max(1, Math.floor(tileSize * 0.08))
  const base = theme.floors[tone % theme.floors.length]
  const stoneX = pixelX + grout
  const stoneY = pixelY + grout
  const stoneSize = tileSize - grout * 2

  ctx.fillStyle = base
  ctx.fillRect(stoneX, stoneY, stoneSize, stoneSize)
  ctx.fillStyle = shadeColor(base, 28)
  ctx.fillRect(stoneX, stoneY, stoneSize, Math.max(1, Math.floor(tileSize * 0.06)))
  ctx.fillRect(stoneX, stoneY, Math.max(1, Math.floor(tileSize * 0.06)), stoneSize)
  ctx.fillStyle = shadeColor(base, -30)
  ctx.fillRect(stoneX, stoneY + stoneSize - Math.max(2, Math.floor(tileSize * 0.08)), stoneSize, Math.max(2, Math.floor(tileSize * 0.08)))
  ctx.fillRect(stoneX + stoneSize - Math.max(2, Math.floor(tileSize * 0.08)), stoneY, Math.max(2, Math.floor(tileSize * 0.08)), stoneSize)

  if (tone % theme.accentEvery === 0) {
    ctx.fillStyle = theme.accent
    ctx.fillRect(stoneX + 4, stoneY + Math.floor(stoneSize * 0.62), Math.max(4, stoneSize - 8), Math.max(2, Math.floor(tileSize * 0.08)))
  }

  for (let speck = 0; speck < 4; speck += 1) {
    const noise = mix(tone + speck * 19)
    ctx.fillStyle = noise % 2 === 0 ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 244, 220, 0.1)'
    ctx.fillRect(
      stoneX + 3 + (noise % Math.max(1, stoneSize - 8)),
      stoneY + 3 + ((noise >>> 8) % Math.max(1, stoneSize - 8)),
      2,
      2,
    )
  }
}

const drawWall = (ctx, pixelX, pixelY, tileSize, theme, tone) => {
  const brickWidth = Math.max(8, Math.floor(tileSize / 2) - 2)
  const brickHeight = Math.max(4, Math.floor(tileSize / 4))
  ctx.fillStyle = '#100e0c'
  ctx.fillRect(pixelX, pixelY, tileSize, tileSize)
  for (let row = 0; row < tileSize; row += brickHeight + 1) {
    const offset = Math.floor(row / brickHeight) % 2 === 0 ? 0 : Math.floor(brickWidth / 2)
    for (let x = -brickWidth; x < tileSize; x += brickWidth + 1) {
      const color = theme.walls[(tone + row + x) % theme.walls.length]
      ctx.fillStyle = color
      ctx.fillRect(pixelX + x + offset, pixelY + row, brickWidth, brickHeight)
      ctx.fillStyle = 'rgba(255, 236, 210, 0.12)'
      ctx.fillRect(pixelX + x + offset, pixelY + row, brickWidth, 1)
    }
  }
}

const drawDoor = (ctx, pixelX, pixelY, tileSize, theme) => {
  ctx.fillStyle = theme.doorFloor
  ctx.fillRect(pixelX, pixelY, tileSize, tileSize)
  ctx.fillStyle = theme.doorFrame
  const post = Math.max(2, Math.floor(tileSize * 0.12))
  ctx.fillRect(pixelX, pixelY, post, tileSize)
  ctx.fillRect(pixelX + tileSize - post, pixelY, post, tileSize)
  ctx.fillRect(pixelX, pixelY, tileSize, post)
}

const drawTorch = (ctx, x, y, theme) => {
  const glow = ctx.createRadialGradient(x, y, 2, x, y, 36)
  glow.addColorStop(0, theme.torchGlow)
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y, 36, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = theme.torchFlame
  ctx.fillRect(x - 2, y - 8, 4, 8)
  ctx.fillStyle = theme.torchCore
  ctx.fillRect(x - 1, y - 11, 2, 4)
}

const paintFloor = (width, height, layout) => {
  const surface = document.createElement('canvas')
  surface.width = width
  surface.height = height
  const layer = surface.getContext('2d')
  if (!layer) {
    throw new Error('바닥 버퍼를 만들 수 없습니다.')
  }

  const { theme, grid, tileSize, offsetX, offsetY, trapTiles } = layout
  layer.fillStyle = theme.voidColor
  layer.fillRect(0, 0, width, height)
  layer.imageSmoothingEnabled = false
  const torches = []

  for (let row = 0; row < grid.length; row += 1) {
    for (let column = 0; column < grid[row].length; column += 1) {
      const tile = grid[row][column]
      const pixelX = offsetX + column * tileSize
      const pixelY = offsetY + row * tileSize
      const tone = mix(column + layout.floor * 17 + row * 31 + layout.seed)
      if (tile === TILE.WALL) {
        drawWall(layer, pixelX, pixelY, tileSize, theme, tone)
        const facesFloor = [
          grid[row - 1]?.[column],
          grid[row + 1]?.[column],
          grid[row]?.[column - 1],
          grid[row]?.[column + 1],
        ].some((neighbor) => neighbor === TILE.FLOOR || neighbor === TILE.DOOR)
        if (facesFloor && (column * 3 + row) % TORCH_SPACING === 0) {
          torches.push({ x: pixelX + tileSize / 2, y: pixelY + tileSize / 2 })
        }
        continue
      }
      if (tile === TILE.FLOOR) {
        drawPaver(layer, pixelX, pixelY, tileSize, theme, tone)
        continue
      }
      if (tile === TILE.DOOR) {
        drawDoor(layer, pixelX, pixelY, tileSize, theme)
      }
    }
  }

  trapTiles.forEach((tile) => {
    const pixelX = offsetX + tile.x * tileSize
    const pixelY = offsetY + tile.y * tileSize
    layer.fillStyle = theme.accent
    const spike = Math.max(3, Math.floor(tileSize * 0.16))
    layer.fillRect(pixelX + tileSize / 2 - spike, pixelY + tileSize / 2, spike * 2, spike)
    layer.fillRect(pixelX + tileSize / 2 - 1, pixelY + tileSize / 2 - spike, 2, spike * 2)
  })

  torches.forEach((torch) => drawTorch(layer, torch.x, torch.y, theme))

  const shade = layer.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * VIGNETTE_INNER,
    width / 2,
    height / 2,
    Math.max(width, height) * VIGNETTE_OUTER,
  )
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.62)')
  layer.fillStyle = shade
  layer.fillRect(0, 0, width, height)
  return surface
}

// 같은 시드와 크기면 던전을 다시 그리지 않는다.
export const drawTowerFloor = (ctx, width, height, layout) => {
  try {
    if (
      !floorCache
      || floorCache.width !== width
      || floorCache.height !== height
      || floorCache.floor !== layout.floor
      || floorCache.seed !== layout.seed
    ) {
      floorCache = {
        width,
        height,
        floor: layout.floor,
        seed: layout.seed,
        canvas: paintFloor(width, height, layout),
      }
    }
    ctx.drawImage(floorCache.canvas, 0, 0)
  } catch (error) {
    console.error('바닥 그리기 실패', error)
  }
}
