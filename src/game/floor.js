// 낡은 석판 한 칸의 크기
const TILE_SIZE = 64
const STONE_COLORS = ['#3c342c', '#4a3f34', '#322c27', '#55483c', '#3a312b']

const FLOOR_COLUMN_SHIFT = 17
const FLOOR_ROW_SHIFT = 31

// 타일 좌표와 층수로 그 층만의 흠집 패턴이 나오게 한다.
const tileHash = (column, row) => {
  let value = column * 374761393 + row * 668265263
  value = (value ^ (value >> 13)) * 1274126177
  return (value ^ (value >> 16)) >>> 0
}

// 브라우저 크기만큼 그 층의 낡은 석판 바닥을 깐다.
export const drawTowerFloor = (ctx, width, height, floor) => {
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

  const shade = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.15,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72,
  )
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shade.addColorStop(1, 'rgba(8, 6, 5, 0.5)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, width, height)
}
