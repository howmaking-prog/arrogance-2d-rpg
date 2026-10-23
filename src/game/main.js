import { drawTowerFloor } from './floor.js?v=5'
import { createFieldItems } from './items.js?v=5'
import { createGoblin } from './monster.js?v=5'
import { createPlayer, toCanvasPoint } from './player.js?v=5'

const CLICK_DELAY = 220
const FIELD_MARGIN_X = 96
const FIELD_MARGIN_TOP = 140
const FIELD_MARGIN_BOTTOM = 96
const SPAWN_GAP = 180

// 플레이어와 다른 배치 지점에서 떨어진 필드 좌표를 고른다.
const randomFieldPoint = (canvas, blocked) => {
  const minX = FIELD_MARGIN_X
  const maxX = Math.max(minX + 1, canvas.width - FIELD_MARGIN_X)
  const minY = FIELD_MARGIN_TOP
  const maxY = Math.max(minY + 1, canvas.height - FIELD_MARGIN_BOTTOM)

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const point = {
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
    }
    const separated = blocked.every((other) => Math.hypot(point.x - other.x, point.y - other.y) >= SPAWN_GAP)
    if (separated) {
      return point
    }
  }

  return {
    x: minX,
    y: minY,
  }
}

const startGame = () => {
  try {
    const canvas = document.getElementById('game')
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('캔버스를 찾을 수 없습니다.')
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('2D 컨텍스트를 만들 수 없습니다.')
    }

    // 캔버스 해상도를 브라우저 영역에 맞춰 맵을 늘린다.
    const fitCanvas = () => {
      const width = Math.max(480, Math.floor(canvas.clientWidth))
      const height = Math.max(320, Math.floor(canvas.clientHeight))
      if (canvas.width === width && canvas.height === height) {
        return false
      }
      canvas.width = width
      canvas.height = height
      return true
    }

    fitCanvas()

    const actor = createPlayer(canvas)
    const playerStart = actor.getPosition()
    const chestSpot = randomFieldPoint(canvas, [playerStart])
    const goblinSpot = randomFieldPoint(canvas, [playerStart, chestSpot])
    const items = createFieldItems(canvas, chestSpot)
    const goblin = createGoblin(canvas, goblinSpot)
    let clickTimer = null
    let lastTime = 0
    let pointer = null

    const canOpenChest = (point) => items.hitChest(point) && items.isChestInReach(actor.getPosition())

    const refreshCursor = () => {
      canvas.style.cursor = pointer && canOpenChest(pointer) ? 'pointer' : 'crosshair'
    }

    const draw = () => {
      drawTowerFloor(ctx, canvas.width, canvas.height)
      items.draw(ctx)
      goblin.draw(ctx)
      if (!actor.isReady()) {
        ctx.fillStyle = '#e8f0e4'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(actor.hasFailed() ? '캐릭터 이미지를 불러오지 못했습니다.' : '캐릭터 이미지를 불러오는 중...', 24, 36)
        return
      }
      actor.draw(ctx, items.getEquippedWeapon())
    }

    canvas.addEventListener('mousemove', (event) => {
      try {
        pointer = toCanvasPoint(canvas, event)
        refreshCursor()
      } catch (error) {
        console.error('커서 처리 실패', error)
      }
    })

    canvas.addEventListener('mouseleave', () => {
      pointer = null
      canvas.style.cursor = 'crosshair'
    })

    canvas.addEventListener('click', (event) => {
      try {
        if (event.button !== 0) {
          return
        }

        const point = toCanvasPoint(canvas, event)
        clearTimeout(clickTimer)
        if (canOpenChest(point)) {
          return
        }

        clickTimer = setTimeout(() => {
          try {
            actor.beginMove(point)
          } catch (error) {
            console.error('이동 처리 실패', error)
          }
        }, CLICK_DELAY)
      } catch (error) {
        console.error('클릭 처리 실패', error)
      }
    })

    canvas.addEventListener('dblclick', (event) => {
      try {
        clearTimeout(clickTimer)
        const point = toCanvasPoint(canvas, event)
        if (items.hitDroppedSword(point)) {
          items.storeSword()
          return
        }
        if (canOpenChest(point)) {
          items.openChest()
          return
        }
        actor.beginMove(point)
      } catch (error) {
        console.error('더블클릭 처리 실패', error)
      }
    })

    const loop = (now) => {
      try {
        const dt = lastTime === 0 ? 0 : Math.min((now - lastTime) / 1000, 0.05)
        lastTime = now
        actor.update(dt)
        refreshCursor()
        draw()
      } catch (error) {
        console.error('프레임 처리 실패', error)
      }
      requestAnimationFrame(loop)
    }

    window.addEventListener('resize', () => {
      try {
        if (!fitCanvas()) {
          return
        }
        actor.keepInside()
        items.keepInside()
        goblin.keepInside()
      } catch (error) {
        console.error('화면 크기 조정 실패', error)
      }
    })

    actor.printStatus('게임 시작')
    requestAnimationFrame(loop)
  } catch (error) {
    console.error('게임 시작 실패', error)
  }
}

startGame()
