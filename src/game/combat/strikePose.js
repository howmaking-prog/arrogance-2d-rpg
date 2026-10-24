export const SLASH_FRAMES = 6
export const SLASH_TIME = 0.34
export const LUNGE_DISTANCE = 28
export const SLASH_ROWS = { up: 12, left: 13, down: 14, right: 15 }

const progressOf = (age, life) => {
  const span = life > 0 ? life : SLASH_TIME
  return Math.max(0, Math.min(1, age / span))
}

// 베기 진행에 맞춰 0부터 5까지 칸을 고른다.
export const slashFrame = (age, life = SLASH_TIME) => (
  Math.min(SLASH_FRAMES - 1, Math.floor(progressOf(age, life) * SLASH_FRAMES))
)

// 때리는 방향으로 잠깐 몸을 들이밀었다가 돌아온다.
export const lungeOffset = (direction, age, life = SLASH_TIME) => {
  const distance = Math.sin(progressOf(age, life) * Math.PI) * LUNGE_DISTANCE
  if (direction === 'left') {
    return { x: -distance, y: 0 }
  }
  if (direction === 'right') {
    return { x: distance, y: 0 }
  }
  if (direction === 'up') {
    return { x: 0, y: -distance }
  }
  return { x: 0, y: distance }
}

// 칼이 지나가는 호를 발 앞에 그린다.
export const drawSlashArc = (ctx, x, y, direction, age, life, crit) => {
  const progress = progressOf(age, life)
  if (progress <= 0.05 || progress >= 0.92) {
    return
  }
  const offset = lungeOffset(direction, age, life)
  const originX = x + offset.x
  const originY = y + offset.y - 36
  const sweep = direction === 'left' || direction === 'right' ? Math.PI * 0.85 : Math.PI * 0.7
  const start = direction === 'left'
    ? Math.PI * 0.15
    : direction === 'right'
      ? Math.PI * 1.05
      : direction === 'up'
        ? Math.PI * 1.15
        : Math.PI * 0.15
  ctx.save()
  ctx.strokeStyle = crit ? 'rgba(255, 92, 64, 0.95)' : 'rgba(255, 244, 214, 0.9)'
  ctx.lineWidth = crit ? 5 : 3
  ctx.beginPath()
  ctx.arc(originX, originY, 34, start, start + sweep * progress)
  ctx.stroke()
  ctx.restore()
}
