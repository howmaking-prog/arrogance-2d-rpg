// LPC 표준 칸 크기. 걷기 9프레임은 위, 왼쪽, 아래, 오른쪽 순으로 8~11행에 있다.
const FRAME_SIZE = 64
const SPRITE_SCALE = 2
const WALK_FRAMES = 9
const WALK_ROWS = { up: 8, left: 9, down: 10, right: 11 }
const STEP_DISTANCE = 14
const SPRITE_URL = 'src/character/player.png?v=5'
const FOOT_OFFSET_X = 32
const FOOT_OFFSET_Y = 58
const MOVE_SPEED = 150
const ARRIVE_DISTANCE = 3
const DIRECTION_LABEL = { up: '위', left: '왼쪽', down: '아래', right: '오른쪽' }

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// 발이 화면 안에 남는 범위. 넓은 창에서는 스프라이트가 잘리지 않는 위치를 유지한다.
export const playerFootBounds = (canvas) => {
  const side = Math.min(FOOT_OFFSET_X * SPRITE_SCALE, Math.max(16, Math.floor(canvas.width * 0.08)))
  const preferredTop = FOOT_OFFSET_Y * SPRITE_SCALE
  const top = canvas.height < preferredTop * 2
    ? Math.max(16, Math.floor(canvas.height * 0.16))
    : preferredTop
  const bottom = (FRAME_SIZE - FOOT_OFFSET_Y) * SPRITE_SCALE
  return {
    minX: side,
    maxX: Math.max(side + 1, canvas.width - side),
    minY: top,
    maxY: Math.max(top + 1, canvas.height - bottom),
  }
}

// 화면 좌표를 캔버스 내부 좌표로 바꾼다.
export const toCanvasPoint = (canvas, event) => {
  const rect = canvas.getBoundingClientRect()
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height),
  }
}

// 이동량이 큰 축을 LPC 4방향 중 하나로 고른다.
const directionFromDelta = (dx, dy) => {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'left' : 'right'
  }
  return dy < 0 ? 'up' : 'down'
}

// 클릭 지점과 LPC 스프라이트의 현재 걷기 프레임을 그린다.
const drawActor = (ctx, sprite, player, target, moving, weaponImage, flash) => {
  if (moving) {
    ctx.strokeStyle = 'rgba(255, 248, 214, 0.85)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(target.x, target.y, 8, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
  ctx.beginPath()
  ctx.ellipse(player.x, player.y, 16, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  const row = WALK_ROWS[player.direction]
  const size = FRAME_SIZE * SPRITE_SCALE
  const destX = player.x - FOOT_OFFSET_X * SPRITE_SCALE
  const destY = player.y - FOOT_OFFSET_Y * SPRITE_SCALE
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    sprite,
    player.frame * FRAME_SIZE,
    row * FRAME_SIZE,
    FRAME_SIZE,
    FRAME_SIZE,
    destX,
    destY,
    size,
    size,
  )

  // 장착한 무기는 같은 걷기 칸에 겹쳐 손에 들리게 한다.
  if (weaponImage) {
    ctx.drawImage(
      weaponImage,
      player.frame * FRAME_SIZE,
      row * FRAME_SIZE,
      FRAME_SIZE,
      FRAME_SIZE,
      destX,
      destY,
      size,
      size,
    )
  }
  if (!flash) {
    return
  }
  ctx.fillStyle = flash === 'crit' ? 'rgba(255, 64, 48, 0.5)' : 'rgba(255, 255, 255, 0.55)'
  ctx.fillRect(destX, destY, size, size)
}

// 캔버스 크기가 정해진 뒤 플레이어를 만든다.
export const createPlayer = (canvas) => {
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    direction: 'down',
    frame: 0,
    stepCarry: 0,
  }
  const target = { x: player.x, y: player.y }
  let moving = false
  let spriteReady = false
  let spriteFailed = false
  let isBlocked = () => false

  let worldBounds = null

  const footBounds = () => playerFootBounds(canvas)
  const moveBounds = () => worldBounds || footBounds()

  const blockedAt = (x, y) => {
    try {
      return Boolean(isBlocked(x, y))
    } catch (error) {
      console.error('이동 충돌 확인 실패', error)
      return false
    }
  }

  const sprite = new Image()
  sprite.addEventListener('load', () => {
    try {
      const minWidth = FRAME_SIZE * WALK_FRAMES
      const minHeight = FRAME_SIZE * (WALK_ROWS.right + 1)
      if (sprite.naturalWidth < minWidth || sprite.naturalHeight < minHeight) {
        throw new Error('LPC 스프라이트 크기가 걷기 동작보다 작습니다.')
      }
      spriteReady = true
      console.log(`[상태] 스프라이트 로드 | ${sprite.naturalWidth}x${sprite.naturalHeight}`)
    } catch (error) {
      spriteFailed = true
      console.error('스프라이트 검증 실패', error)
    }
  })
  sprite.addEventListener('error', () => {
    spriteFailed = true
    console.error('캐릭터 스프라이트 로드 실패', SPRITE_URL)
  })
  sprite.src = SPRITE_URL

  // 위치, 방향, 걷기 프레임, 이동 여부를 콘솔에 남긴다.
  const printStatus = (label) => {
    console.log(
      `[상태] ${label} | 위치 (${Math.round(player.x)}, ${Math.round(player.y)}) | 목적지 (${Math.round(target.x)}, ${Math.round(target.y)}) | 방향: ${DIRECTION_LABEL[player.direction]} | 프레임: ${player.frame} | 이동중: ${moving}`
    )
  }

  const stopWalking = () => {
    moving = false
    player.frame = 0
    player.stepCarry = 0
  }

  const update = (dt) => {
    if (!moving) {
      return
    }

    const dx = target.x - player.x
    const dy = target.y - player.y
    const distance = Math.hypot(dx, dy)

    if (distance <= ARRIVE_DISTANCE) {
      if (!blockedAt(target.x, target.y)) {
        player.x = target.x
        player.y = target.y
      }
      stopWalking()
      printStatus('도착')
      return
    }

    player.direction = directionFromDelta(dx, dy)
    const step = Math.min(MOVE_SPEED * dt, distance)
    const nextX = player.x + (dx / distance) * step
    const nextY = player.y + (dy / distance) * step
    let movedX = player.x
    let movedY = player.y
    if (!blockedAt(nextX, nextY)) {
      movedX = nextX
      movedY = nextY
    } else if (!blockedAt(nextX, player.y)) {
      movedX = nextX
    } else if (!blockedAt(player.x, nextY)) {
      movedY = nextY
    }
    if (movedX === player.x && movedY === player.y) {
      stopWalking()
      printStatus('길 막힘')
      return
    }
    const moved = Math.hypot(movedX - player.x, movedY - player.y)
    player.x = movedX
    player.y = movedY

    // 이동 거리에 맞춰 걷기 프레임을 넘겨, 발걸음과 속도가 어긋나지 않게 한다.
    player.stepCarry += moved
    const advances = Math.floor(player.stepCarry / STEP_DISTANCE)
    if (advances > 0) {
      player.frame = (player.frame + advances) % WALK_FRAMES
      player.stepCarry -= advances * STEP_DISTANCE
    }
  }

  const beginMove = (point) => {
    const bounds = moveBounds()
    target.x = clamp(point.x, bounds.minX, bounds.maxX)
    target.y = clamp(point.y, bounds.minY, bounds.maxY)

    const distance = Math.hypot(target.x - player.x, target.y - player.y)
    if (distance <= ARRIVE_DISTANCE) {
      stopWalking()
      printStatus('이미 그 위치')
      return
    }

    player.direction = directionFromDelta(target.x - player.x, target.y - player.y)
    moving = true
    printStatus('이동 시작')
  }

  const keepInside = () => {
    const bounds = moveBounds()
    player.x = clamp(player.x, bounds.minX, bounds.maxX)
    player.y = clamp(player.y, bounds.minY, bounds.maxY)
    target.x = clamp(target.x, bounds.minX, bounds.maxX)
    target.y = clamp(target.y, bounds.minY, bounds.maxY)
  }

  return {
    update,
    beginMove,
    keepInside,
    printStatus,
    isReady: () => spriteReady,
    hasFailed: () => spriteFailed,
    getPosition: () => ({ x: player.x, y: player.y }),
    setBlocked: (fn) => {
      isBlocked = typeof fn === 'function' ? fn : () => false
    },
    setWorldBounds: (bounds) => {
      worldBounds = bounds
    },
    placeAt: (point) => {
      const bounds = moveBounds()
      player.x = clamp(point.x, bounds.minX, bounds.maxX)
      player.y = clamp(point.y, bounds.minY, bounds.maxY)
      target.x = player.x
      target.y = player.y
      stopWalking()
    },
    draw: (ctx, weaponImage, flash) => drawActor(ctx, sprite, player, target, moving, weaponImage, flash),
  }
}
