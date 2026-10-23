import { drawTowerFloor } from './floor.js'
import { createFieldItems } from './items.js'
import { createPlayer, toCanvasPoint } from './player.js'

const CLICK_DELAY = 220

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
    const items = createFieldItems(canvas)
    let clickTimer = null
    let lastTime = 0

    const draw = () => {
      drawTowerFloor(ctx, canvas.width, canvas.height)
      items.draw(ctx)
      if (!actor.isReady()) {
        ctx.fillStyle = '#e8f0e4'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(actor.hasFailed() ? '캐릭터 이미지를 불러오지 못했습니다.' : '캐릭터 이미지를 불러오는 중...', 24, 36)
        return
      }
      actor.draw(ctx)
    }

    canvas.addEventListener('click', (event) => {
      try {
        if (event.button !== 0) {
          return
        }

        const point = toCanvasPoint(canvas, event)
        if (items.hitChest(point)) {
          clearTimeout(clickTimer)
          items.openChest()
          return
        }

        clearTimeout(clickTimer)
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
        if (items.hitChest(point)) {
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
