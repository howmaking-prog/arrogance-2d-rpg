const STAIR_WIDTH = 84
const STAIR_HEIGHT = 64
const STEP_COUNT = 4
const UP_STAIR_X = 118
const UP_STAIR_Y = 118
const DOWN_STAIR_X = 124
const DOWN_STAIR_Y = 108

// 플레이어가 계단을 이용할 수 있는 거리
export const STAIR_REACH = 120

// 위층 계단은 오른쪽 위, 아래층 계단은 2층부터 왼쪽 아래에 둔다.
export const stairSpots = (canvas, floor) => {
  const spots = [
    {
      direction: 'up',
      x: Math.max(180, canvas.width - UP_STAIR_X),
      y: UP_STAIR_Y,
      width: STAIR_WIDTH,
      height: STAIR_HEIGHT,
      label: '위층',
    },
  ]

  if (floor > 1) {
    spots.push({
      direction: 'down',
      x: DOWN_STAIR_X,
      y: Math.max(UP_STAIR_Y + 180, canvas.height - DOWN_STAIR_Y),
      width: STAIR_WIDTH,
      height: STAIR_HEIGHT,
      label: '아래층',
    })
  }

  return spots
}

const containsPoint = (point, stair) => (
  Math.abs(point.x - stair.x) <= stair.width / 2
  && Math.abs(point.y - stair.y) <= stair.height / 2
)

export const stairAtPoint = (spots, point) => (
  spots.find((stair) => containsPoint(point, stair)) || null
)

const drawOneStair = (ctx, stair) => {
  const left = stair.x - stair.width / 2
  const top = stair.y - stair.height / 2
  const stepHeight = stair.height / STEP_COUNT

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.beginPath()
  ctx.ellipse(stair.x, top + stair.height + 2, 34, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  for (let step = 0; step < STEP_COUNT; step += 1) {
    const depth = stair.direction === 'up' ? STEP_COUNT - 1 - step : step
    const inset = depth * 5
    ctx.fillStyle = depth % 2 === 0 ? '#8d7d6a' : '#5e5348'
    ctx.fillRect(left + inset, top + step * stepHeight, stair.width - inset * 2, stepHeight - 3)
    ctx.fillStyle = 'rgba(244, 236, 220, 0.35)'
    ctx.fillRect(left + inset, top + step * stepHeight, stair.width - inset * 2, 3)
  }

  ctx.fillStyle = '#f4efe2'
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(stair.label, stair.x, top + stair.height + 18)
}

export const drawStairs = (ctx, spots) => {
  spots.forEach((stair) => {
    drawOneStair(ctx, stair)
  })
}

// 출구 칸에 위층 계단을, 시작 방에 아래층 계단을 둔다.
export const stairsFromLayout = (layout, floor) => {
  const span = Math.max(28, layout.tileSize - 8)
  const height = Math.round(span * 0.75)
  const spots = [
    {
      direction: 'up',
      x: layout.exitPortal.x,
      y: layout.exitPortal.y,
      width: span,
      height,
      label: '위층',
    },
  ]

  if (floor > 1) {
    spots.push({
      direction: 'down',
      x: layout.downStair.x,
      y: layout.downStair.y,
      width: span,
      height,
      label: '아래층',
    })
  }

  return spots
}
