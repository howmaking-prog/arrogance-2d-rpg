const TILE_SIZE = 64
const GROUT = 3
const WALL_DEPTH = 58
const FLOOR_COLUMN_SHIFT = 17
const FLOOR_ROW_SHIFT = 31

const WARM_STONES = ['#3c3934', '#4a463f', '#322f2b', '#565248', '#2a2724']
const COLD_STONES = ['#34383c', '#3e444a', '#2a2e32', '#4a5158', '#24282c']

const mix = (n) => {
  let value = Math.imul(n, 374761393)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return (value ^ (value >>> 16)) >>> 0
}

const tileHash = (column, row) => mix(column * 374761393 + row * 668265263)

let floorCache = null

const shadeColor = (hex, amount) => {
  const value = Number.parseInt(hex.slice(1), 16)
  const clampChannel = (channel) => Math.max(0, Math.min(255, channel + amount))
  const red = clampChannel((value >> 16) & 255)
  const green = clampChannel((value >> 8) & 255)
  const blue = clampChannel(value & 255)
  return `rgb(${red}, ${green}, ${blue})`
}

// 참고한 어두운 던전처럼, 모서리가 깎인 직사각 석판을 깐다.
const drawStonePavers = (ctx, width, height, floor) => {
  const palette = floor === 1 ? WARM_STONES : COLD_STONES
  ctx.fillStyle = '#12100e'
  ctx.fillRect(0, 0, width, height)

  for (let y = 0; y < height; y += TILE_SIZE) {
    for (let x = 0; x < width; x += TILE_SIZE) {
      const column = Math.floor(x / TILE_SIZE)
      const row = Math.floor(y / TILE_SIZE)
      const tone = tileHash(column + floor * FLOOR_COLUMN_SHIFT, row + floor * FLOOR_ROW_SHIFT)
      const base = palette[tone % palette.length]
      const stoneX = x + GROUT
      const stoneY = y + GROUT
      const stoneWidth = TILE_SIZE - GROUT * 2
      const stoneHeight = TILE_SIZE - GROUT * 2

      ctx.fillStyle = base
      ctx.fillRect(stoneX, stoneY, stoneWidth, stoneHeight)
      ctx.fillStyle = shadeColor(base, 28)
      ctx.fillRect(stoneX, stoneY, stoneWidth, 3)
      ctx.fillRect(stoneX, stoneY, 3, stoneHeight)
      ctx.fillStyle = shadeColor(base, -28)
      ctx.fillRect(stoneX, stoneY + stoneHeight - 4, stoneWidth, 4)
      ctx.fillRect(stoneX + stoneWidth - 4, stoneY, 4, stoneHeight)

      for (let speck = 0; speck < 8; speck += 1) {
        const noise = mix(tone + speck * 19)
        const speckX = stoneX + 6 + (noise % (stoneWidth - 12))
        const speckY = stoneY + 6 + ((noise >>> 8) % (stoneHeight - 12))
        ctx.fillStyle = noise % 2 === 0 ? 'rgba(0, 0, 0, 0.28)' : 'rgba(255, 244, 220, 0.08)'
        ctx.fillRect(speckX, speckY, 2, 2)
      }

      if (tone % 6 === 0) {
        ctx.strokeStyle = 'rgba(8, 7, 6, 0.8)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(stoneX + 12, stoneY + 16)
        ctx.lineTo(stoneX + 28, stoneY + 34)
        ctx.lineTo(stoneX + 46, stoneY + 28)
        ctx.stroke()
      }

      if (tone % 9 === 0) {
        ctx.fillStyle = floor === 1 ? 'rgba(92, 28, 22, 0.28)' : 'rgba(20, 24, 28, 0.35)'
        ctx.beginPath()
        ctx.ellipse(stoneX + 40, stoneY + 36, 10, 6, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

const drawBrick = (ctx, x, y, brickWidth, brickHeight, tone) => {
  const colors = ['#3a342e', '#4a4038', '#2c2824', '#564c42']
  ctx.fillStyle = colors[tone % colors.length]
  ctx.fillRect(x, y, brickWidth, brickHeight)
  ctx.fillStyle = 'rgba(255, 236, 210, 0.14)'
  ctx.fillRect(x, y, brickWidth, 2)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.fillRect(x, y + brickHeight - 2, brickWidth, 2)
}

// 가장자리는 벽돌 벽으로 막아 던전 방처럼 보이게 한다.
const drawDungeonWalls = (ctx, width, height) => {
  ctx.fillStyle = '#161310'
  ctx.fillRect(0, 0, width, WALL_DEPTH)
  ctx.fillRect(0, height - WALL_DEPTH, width, WALL_DEPTH)
  ctx.fillRect(0, 0, WALL_DEPTH, height)
  ctx.fillRect(width - WALL_DEPTH, 0, WALL_DEPTH, height)

  const brickWidth = 34
  const brickHeight = 16
  for (let row = 0; row < Math.ceil(WALL_DEPTH / brickHeight); row += 1) {
    const offset = row % 2 === 0 ? 0 : brickWidth / 2
    for (let x = -brickWidth; x < width; x += brickWidth + 3) {
      drawBrick(ctx, x + offset, row * (brickHeight + 2), brickWidth, brickHeight, mix(x + row))
      drawBrick(ctx, x + offset, height - WALL_DEPTH + row * (brickHeight + 2), brickWidth, brickHeight, mix(x + row + 5))
    }
  }
  for (let y = 0; y < height; y += brickHeight + 2) {
    drawBrick(ctx, 4, y, WALL_DEPTH - 10, brickHeight, mix(y))
    drawBrick(ctx, width - WALL_DEPTH + 4, y, WALL_DEPTH - 10, brickHeight, mix(y + 9))
  }
}

const drawTorches = (ctx, width) => {
  for (let x = 180; x < width - 80; x += 320) {
    const glow = ctx.createRadialGradient(x, WALL_DEPTH - 8, 4, x, WALL_DEPTH + 10, 90)
    glow.addColorStop(0, 'rgba(255, 166, 64, 0.38)')
    glow.addColorStop(1, 'rgba(255, 120, 30, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, WALL_DEPTH, 90, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#5a4634'
    ctx.fillRect(x - 3, WALL_DEPTH - 18, 6, 16)
    ctx.fillStyle = '#f0c14a'
    ctx.fillRect(x - 4, WALL_DEPTH - 28, 8, 10)
    ctx.fillStyle = '#fff1c2'
    ctx.fillRect(x - 2, WALL_DEPTH - 32, 4, 6)
  }
}

const paintFloor = (width, height, floor) => {
  const surface = document.createElement('canvas')
  surface.width = width
  surface.height = height
  const layer = surface.getContext('2d')
  if (!layer) {
    throw new Error('바닥 버퍼를 만들 수 없습니다.')
  }
  drawStonePavers(layer, width, height, floor)
  drawDungeonWalls(layer, width, height)
  drawTorches(layer, width)

  const shade = layer.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.2,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.75,
  )
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.55)')
  layer.fillStyle = shade
  layer.fillRect(0, 0, width, height)
  return surface
}

// 같은 크기와 층은 다시 그리지 않는다.
export const drawTowerFloor = (ctx, width, height, floor) => {
  try {
    if (
      !floorCache
      || floorCache.width !== width
      || floorCache.height !== height
      || floorCache.floor !== floor
    ) {
      floorCache = {
        width,
        height,
        floor,
        canvas: paintFloor(width, height, floor),
      }
    }
    ctx.drawImage(floorCache.canvas, 0, 0)
  } catch (error) {
    console.error('바닥 그리기 실패', error)
  }
}
