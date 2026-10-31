import { drawSlashArc, lungeOffset, slashFrame, SLASH_ROWS } from './combat/strikePose.js'

const FRAME_SIZE = 64
// 배경 타일이 작아진 만큼 몬스터도 한 칸에 맞게 줄인다.
const SPRITE_SCALE = 1
const IDLE_ROW = 10
const WALK_ROWS = { up: 8, left: 9, down: 10, right: 11 }
const WALK_FRAMES = 9
const GOBLIN_URL = 'src/monster/goblin.png'
const FOOT_OFFSET_X = 32
const FOOT_OFFSET_Y = 58
const STEP_DISTANCE = 12
const ARRIVE_DISTANCE = 4
export const MONSTER_RESPAWN_SECONDS = 25
export const MONSTER_PATROL_RADIUS = 110
export const MONSTER_PATROL_SPEED = 42
export const MONSTER_PATROL_PAUSE = 1.2

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const directionFromDelta = (dx, dy) => {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx < 0 ? 'left' : 'right'
  }
  return dy < 0 ? 'up' : 'down'
}

// 고블린은 스폰 지점 근처를 순찰하고, 쓰러지면 일정 시간 뒤 다시 살아난다.
export const createGoblin = (canvas, position) => {
  const home = {
    x: position.homeX ?? position.x,
    y: position.homeY ?? position.y,
  }
  const goblin = {
    x: position.x,
    y: position.y,
    direction: 'down',
    frame: 0,
    stepCarry: 0,
  }
  const target = { x: position.x, y: position.y }
  let alive = typeof position.alive === 'boolean' ? position.alive : true
  let ready = false
  let respawnLeft = Number.isFinite(position.respawnLeft) ? Math.max(0, position.respawnLeft) : 0
  let pauseLeft = 0
  let moving = false

  const image = new Image()
  image.addEventListener('load', () => {
    try {
      if (image.naturalWidth < FRAME_SIZE * 9 || image.naturalHeight < FRAME_SIZE * (WALK_ROWS.right + 1)) {
        throw new Error('고블린 스프라이트 크기가 걷기 동작보다 작습니다.')
      }
      ready = true
      console.log(`[상태] 고블린 출현 | 위치 (${Math.round(goblin.x)}, ${Math.round(goblin.y)})`)
    } catch (error) {
      console.error('고블린 스프라이트 검증 실패', error)
    }
  })
  image.addEventListener('error', () => {
    console.error('고블린 이미지 로드 실패', GOBLIN_URL)
  })
  image.src = GOBLIN_URL

  const pickPatrolTarget = (isWalkable) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const angle = Math.random() * Math.PI * 2
      const distance = 24 + Math.random() * (MONSTER_PATROL_RADIUS - 24)
      const point = {
        x: home.x + Math.cos(angle) * distance,
        y: home.y + Math.sin(angle) * distance,
      }
      if (typeof isWalkable !== 'function' || isWalkable(point.x, point.y)) {
        return point
      }
    }
    return { x: home.x, y: home.y }
  }

  return {
    place: (position) => {
      home.x = position.homeX ?? position.x
      home.y = position.homeY ?? position.y
      goblin.x = position.x
      goblin.y = position.y
      target.x = goblin.x
      target.y = goblin.y
      moving = false
      pauseLeft = 0
      if (typeof position.alive === 'boolean') {
        alive = position.alive
      }
      respawnLeft = Number.isFinite(position.respawnLeft) ? Math.max(0, position.respawnLeft) : 0
      console.log(`[상태] 고블린 출현 | 위치 (${Math.round(goblin.x)}, ${Math.round(goblin.y)})`)
    },
    capture: () => ({
      x: goblin.x,
      y: goblin.y,
      homeX: home.x,
      homeY: home.y,
      alive,
      respawnLeft,
    }),
    isAlive: () => alive,
    defeat: () => {
      alive = false
      moving = false
      respawnLeft = MONSTER_RESPAWN_SECONDS
    },
    getPosition: () => ({ x: goblin.x, y: goblin.y }),
    getHome: () => ({ x: home.x, y: home.y }),
    update: (dt, isWalkable, canMove) => {
      try {
        if (!Number.isFinite(dt) || dt < 0) {
          return
        }
        if (!alive) {
          respawnLeft = Math.max(0, respawnLeft - dt)
          if (respawnLeft <= 0) {
            goblin.x = home.x
            goblin.y = home.y
            target.x = home.x
            target.y = home.y
            alive = true
            moving = false
            pauseLeft = MONSTER_PATROL_PAUSE
            console.log(`[상태] 고블린 리젠 | (${Math.round(home.x)}, ${Math.round(home.y)})`)
          }
          return
        }
        if (!canMove) {
          moving = false
          return
        }
        if (pauseLeft > 0) {
          pauseLeft -= dt
          moving = false
          goblin.frame = 0
          return
        }
        if (!moving) {
          const next = pickPatrolTarget(isWalkable)
          target.x = next.x
          target.y = next.y
          moving = true
        }
        const dx = target.x - goblin.x
        const dy = target.y - goblin.y
        const distance = Math.hypot(dx, dy)
        if (distance <= ARRIVE_DISTANCE) {
          goblin.x = target.x
          goblin.y = target.y
          moving = false
          pauseLeft = MONSTER_PATROL_PAUSE * (0.6 + Math.random() * 0.8)
          goblin.frame = 0
          return
        }
        goblin.direction = directionFromDelta(dx, dy)
        const step = Math.min(MONSTER_PATROL_SPEED * dt, distance)
        const nextX = goblin.x + (dx / distance) * step
        const nextY = goblin.y + (dy / distance) * step
        if (typeof isWalkable === 'function' && isWalkable(nextX, nextY)) {
          goblin.stepCarry += step
          goblin.x = nextX
          goblin.y = nextY
        } else if (typeof isWalkable === 'function' && isWalkable(nextX, goblin.y)) {
          goblin.stepCarry += Math.abs(nextX - goblin.x)
          goblin.x = nextX
        } else if (typeof isWalkable === 'function' && isWalkable(goblin.x, nextY)) {
          goblin.stepCarry += Math.abs(nextY - goblin.y)
          goblin.y = nextY
        } else {
          moving = false
          pauseLeft = 0.4
          return
        }
        const advances = Math.floor(goblin.stepCarry / STEP_DISTANCE)
        if (advances > 0) {
          goblin.frame = (goblin.frame + advances) % WALK_FRAMES
          goblin.stepCarry -= advances * STEP_DISTANCE
        }
        // 스폰 지점에서 너무 멀어지면 집으로 되돌린다.
        if (Math.hypot(goblin.x - home.x, goblin.y - home.y) > MONSTER_PATROL_RADIUS + 24) {
          target.x = home.x
          target.y = home.y
          moving = true
        }
      } catch (error) {
        console.error('고블린 이동 실패', error)
      }
    },
    keepInside: () => {
      goblin.x = clamp(goblin.x, 48, Math.max(48, canvas.width - 48))
      goblin.y = clamp(goblin.y, 72, Math.max(72, canvas.height - 48))
    },
    draw: (ctx, flash, attack, facing = null) => {
      if (!ready || !alive) {
        return
      }
      const look = facing || goblin.direction
      const pose = attack
        ? {
          frame: slashFrame(attack.age, attack.life),
          row: SLASH_ROWS[look] || SLASH_ROWS.down,
          offset: lungeOffset(look, attack.age, attack.life),
        }
        : null
      const size = FRAME_SIZE * SPRITE_SCALE
      const shift = pose ? pose.offset : { x: 0, y: 0 }
      const destX = goblin.x - FOOT_OFFSET_X * SPRITE_SCALE + shift.x
      const destY = goblin.y - FOOT_OFFSET_Y * SPRITE_SCALE + shift.y
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
      ctx.beginPath()
      ctx.ellipse(goblin.x + shift.x, goblin.y + shift.y, 16, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(
        image,
        (pose ? pose.frame : goblin.frame) * FRAME_SIZE,
        (pose ? pose.row : WALK_ROWS[look] || IDLE_ROW) * FRAME_SIZE,
        FRAME_SIZE,
        FRAME_SIZE,
        destX,
        destY,
        size,
        size,
      )
      if (pose) {
        drawSlashArc(ctx, goblin.x, goblin.y, look, attack.age, attack.life, attack.crit)
      }
    },
  }
}
