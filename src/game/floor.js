// 2층부터 쓰는 석판 칸. 1층은 칸 경계 없는 던전 지형이다.
const TILE_SIZE = 64
const STONE_COLORS = ['#3c342c', '#4a3f34', '#322c27', '#55483c', '#3a312b']
const DUNGEON_STONES = ['#4e4338', '#5a4c3e', '#3a322b', '#6a5b4b', '#2f2924']
const FLOOR_COLUMN_SHIFT = 17
const FLOOR_ROW_SHIFT = 31
const WALL_DEPTH = 46

const mix = (n) => {
  let value = Math.imul(n, 374761393)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return (value ^ (value >>> 16)) >>> 0
}

const tileHash = (column, row) => mix(column * 374761393 + row * 668265263)

let floorCache = null

const drawStoneTiles = (ctx, width, height, floor) => {
  ctx.fillStyle = '#16130f'
  ctx.fillRect(0, 0, width, height)

  for (let y = 0; y < height; y += TILE_SIZE) {
    for (let x = 0; x < width; x += TILE_SIZE) {
      const column = Math.floor(x / TILE_SIZE)
      const row = Math.floor(y / TILE_SIZE)
      const tone = tileHash(column + floor * FLOOR_COLUMN_SHIFT, row + floor * FLOOR_ROW_SHIFT)
      const gap = 3
      ctx.fillStyle = STONE_COLORS[tone % STONE_COLORS.length]
      ctx.fillRect(x + gap, y + gap, TILE_SIZE - gap * 2, TILE_SIZE - gap * 2)

      ctx.fillStyle = 'rgba(112, 88, 62, 0.28)'
      ctx.fillRect(x + gap, y + gap, TILE_SIZE - gap * 2, 3)

      if (tone % 5 === 0) {
        ctx.strokeStyle = 'rgba(14, 11, 9, 0.75)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x + 14, y + 20)
        ctx.lineTo(x + 30, y + 42)
        ctx.lineTo(x + 48, y + 34)
        ctx.stroke()
      }

      if (tone % 7 === 0) {
        ctx.fillStyle = 'rgba(18, 14, 11, 0.4)'
        ctx.beginPath()
        ctx.ellipse(x + 42, y + 30, 9, 5, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

// 1층은 격자 타일 대신 흙과 불규칙한 바위, 가장자리 벽으로 던전 방을 만든다.
const drawDungeonTerrain = (ctx, width, height) => {
  ctx.fillStyle = '#2a231c'
  ctx.fillRect(0, 0, width, height)

  const dirtCount = Math.max(8, Math.round((width * height) / 180000))
  for (let index = 0; index < dirtCount; index += 1) {
    const tone = mix(index + 41)
    const x = (tone % 1000) / 1000 * width
    const y = ((tone >>> 8) % 1000) / 1000 * height
    const radius = 70 + (tone % 90)
    ctx.fillStyle = tone % 3 === 0 ? 'rgba(58, 46, 32, 0.55)' : 'rgba(36, 30, 24, 0.45)'
    ctx.beginPath()
    ctx.ellipse(x, y, radius, radius * 0.62, (tone % 18) / 10, 0, Math.PI * 2)
    ctx.fill()
  }

  const columns = Math.ceil(width / 96)
  const rows = Math.ceil(height / 84)
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const tone = mix(column * 19 + row * 53 + 7)
      const x = column * 96 + (tone % 36)
      const y = row * 84 + ((tone >>> 5) % 28)
      const radius = 34 + (tone % 28)
      const sides = 5 + (tone % 3)
      ctx.fillStyle = DUNGEON_STONES[tone % DUNGEON_STONES.length]
      ctx.beginPath()
      for (let side = 0; side < sides; side += 1) {
        const spin = mix(tone + side * 17)
        const angle = (Math.PI * 2 * side) / sides + (spin % 10) / 40
        const reach = radius * (0.72 + (spin % 30) / 100)
        const pointX = x + Math.cos(angle) * reach
        const pointY = y + Math.sin(angle) * reach * 0.72
        if (side === 0) {
          ctx.moveTo(pointX, pointY)
        } else {
          ctx.lineTo(pointX, pointY)
        }
      }
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(18, 14, 11, 0.35)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  for (let index = 0; index < 10; index += 1) {
    const tone = mix(index + 900)
    let x = (tone % 1000) / 1000 * width
    let y = ((tone >>> 7) % 1000) / 1000 * height
    ctx.strokeStyle = 'rgba(12, 10, 8, 0.55)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let step = 0; step < 4; step += 1) {
      const bend = mix(tone + step * 13)
      x += ((bend % 80) - 40)
      y += (((bend >>> 6) % 50) - 10)
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  const drawWallBlock = (x, y, blockWidth, blockHeight) => {
    ctx.fillStyle = '#17130f'
    ctx.fillRect(x, y, blockWidth, blockHeight)
    ctx.fillStyle = '#3a322b'
    ctx.fillRect(x + 3, y + 3, blockWidth - 6, 4)
  }

  for (let x = 0; x < width; x += 58) {
    const tone = mix(x + 3)
    const block = 40 + (tone % 28)
    drawWallBlock(x, 0, block, WALL_DEPTH - (tone % 14))
    drawWallBlock(x, height - WALL_DEPTH + (tone % 10), block, WALL_DEPTH)
  }
  for (let y = 0; y < height; y += 52) {
    const tone = mix(y + 11)
    const block = 36 + (tone % 24)
    drawWallBlock(0, y, WALL_DEPTH - (tone % 12), block)
    drawWallBlock(width - WALL_DEPTH + (tone % 10), y, WALL_DEPTH, block)
  }

  const shade = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.2,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72,
  )
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shade.addColorStop(1, 'rgba(6, 5, 4, 0.62)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, width, height)
}

const paintFloor = (width, height, floor) => {
  const surface = document.createElement('canvas')
  surface.width = width
  surface.height = height
  const layer = surface.getContext('2d')
  if (!layer) {
    throw new Error('바닥 버퍼를 만들 수 없습니다.')
  }
  if (floor === 1) {
    drawDungeonTerrain(layer, width, height)
  } else {
    drawStoneTiles(layer, width, height, floor)
  }
  return surface
}

// 같은 크기와 층은 다시 그리지 않고, 1층만 던전 지형으로 깐다.
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
