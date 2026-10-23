const FRAME_SIZE = 64
const SPRITE_SCALE = 2
const IDLE_ROW = 10
const GOBLIN_URL = 'src/monster/goblin.png'
const FOOT_OFFSET_X = 32
const FOOT_OFFSET_Y = 58

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

// 고블린은 LPC 걷기 칸의 정면 대기 프레임으로 필드에 세운다.
export const createGoblin = (canvas, position) => {
  const goblin = {
    x: position.x,
    y: position.y,
  }
  let ready = false

  const image = new Image()
  image.addEventListener('load', () => {
    try {
      if (image.naturalWidth < FRAME_SIZE * 9 || image.naturalHeight < FRAME_SIZE * (IDLE_ROW + 1)) {
        throw new Error('고블린 스프라이트 크기가 대기 동작보다 작습니다.')
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

  return {
    place: (position) => {
      goblin.x = position.x
      goblin.y = position.y
      console.log(`[상태] 고블린 출현 | 위치 (${Math.round(goblin.x)}, ${Math.round(goblin.y)})`)
    },
    capture: () => ({ x: goblin.x, y: goblin.y }),
    keepInside: () => {
      goblin.x = clamp(goblin.x, 48, Math.max(48, canvas.width - 48))
      goblin.y = clamp(goblin.y, 72, Math.max(72, canvas.height - 48))
    },
    draw: (ctx) => {
      if (!ready) {
        return
      }
      const size = FRAME_SIZE * SPRITE_SCALE
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
      ctx.beginPath()
      ctx.ellipse(goblin.x, goblin.y, 16, 6, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(
        image,
        0,
        IDLE_ROW * FRAME_SIZE,
        FRAME_SIZE,
        FRAME_SIZE,
        goblin.x - FOOT_OFFSET_X * SPRITE_SCALE,
        goblin.y - FOOT_OFFSET_Y * SPRITE_SCALE,
        size,
        size,
      )
    },
  }
}
