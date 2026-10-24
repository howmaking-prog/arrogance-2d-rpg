import { createStatProgression } from './stats/progression.js?v=10'
import { createStatSheet } from './stats/statSheet.js?v=10'
import { drawTowerFloor } from './floor.js?v=11'
import { createHud } from './hud.js?v=10'
import { createFieldItems } from './items.js?v=10'
import { createGoblin } from './monster.js?v=10'
import { createPlayer, toCanvasPoint } from './player.js?v=10'
import { drawStairs, stairAtPoint, stairSpots } from './stairs.js?v=10'

const CLICK_DELAY = 220
const FIELD_MARGIN_X = 96
const FIELD_MARGIN_TOP = 180
const FIELD_MARGIN_BOTTOM = 160
const START_X = 156
const START_BOTTOM = 150
const SPAWN_GAP = 180
const ARRIVAL_OFFSET = 140

// 플레이어, 계단과 떨어진 필드 좌표를 고른다.
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
    const underTitle = point.x < 280 && point.y < 80
    if (separated && !underTitle) {
      return point
    }
  }

  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
  }
}

// 올라온 층은 아래 계단 옆, 내려온 층은 위 계단 옆에 세운다.
const arrivalPoint = (canvas, floor, via) => {
  const spots = stairSpots(canvas, floor)
  const up = spots.find((stair) => stair.direction === 'up')
  const down = spots.find((stair) => stair.direction === 'down')

  if (via === 'up' && down) {
    return { x: down.x + ARRIVAL_OFFSET, y: down.y }
  }
  if (via === 'down' && up) {
    return { x: up.x - ARRIVAL_OFFSET, y: up.y + 80 }
  }
  return { x: canvas.width / 2, y: canvas.height / 2 }
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

    const floorTitle = document.getElementById('floor-title')

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

    let floor = 1
    const floors = new Map()
    const actor = createPlayer(canvas)
    actor.placeAt({ x: START_X, y: canvas.height - START_BOTTOM })
    createHud()
    const opening = stairSpots(canvas, floor)
    const chestSpot = randomFieldPoint(canvas, [actor.getPosition(), ...opening])
    const goblinSpot = randomFieldPoint(canvas, [actor.getPosition(), chestSpot, ...opening])
    const items = createFieldItems(canvas, chestSpot)
    const goblin = createGoblin(canvas, goblinSpot)
    const progression = createStatProgression()
    const statSheet = createStatSheet(progression, () => ({
      weaponAtk: items.getEquippedAttack(),
      armorDef: items.getEquippedDefense(),
    }))
    items.onEquipChange(() => statSheet.refresh())
    let clickTimer = null
    let lastTime = 0
    let pointer = null
    let holdStairs = false

    const showFloor = () => {
      const label = `오만의 탑 ${floor}층`
      if (floorTitle instanceof HTMLElement) {
        floorTitle.textContent = label
      }
      canvas.setAttribute('aria-label', label)
      console.log(`[상태] ${label}`)
    }

    const canOpenChest = (point) => items.hitChest(point) && items.isChestInReach(actor.getPosition())
    const canTakeSword = (point) => items.hitDroppedSword(point) && items.isSwordInReach(actor.getPosition())

    const refreshCursor = () => {
      const interactive = Boolean(pointer && (canOpenChest(pointer) || canTakeSword(pointer)))
      canvas.style.cursor = interactive ? 'pointer' : 'crosshair'
    }

    // 발밑이 계단 칸에 들어오면 더블클릭 없이 위층이나 아래층으로 옮긴다.
    const stepOntoStairs = () => {
      const stood = stairAtPoint(stairSpots(canvas, floor), actor.getPosition())
      if (holdStairs) {
        if (!stood) {
          holdStairs = false
        }
        return
      }
      if (!stood) {
        return
      }
      holdStairs = true
      changeFloor(stood.direction)
    }

    // 방문한 층은 그대로 두고, 처음 가는 층만 새로 배치한다.
    const changeFloor = (direction) => {
      const nextFloor = direction === 'up' ? floor + 1 : floor - 1
      if (nextFloor < 1) {
        return
      }

      floors.set(floor, {
        items: items.captureFloor(),
        goblin: goblin.capture(),
      })
      floor = nextFloor

      const here = arrivalPoint(canvas, floor, direction)
      const saved = floors.get(floor)
      if (saved) {
        items.applyFloor(saved.items)
        goblin.place(saved.goblin)
      } else {
        const spots = stairSpots(canvas, floor)
        const nextChest = randomFieldPoint(canvas, [here, ...spots])
        const nextGoblin = randomFieldPoint(canvas, [here, nextChest, ...spots])
        items.applyFloor({
          x: nextChest.x,
          y: nextChest.y,
          open: false,
          droppedSword: null,
        })
        goblin.place(nextGoblin)
      }

      items.keepInside()
      goblin.keepInside()
      actor.placeAt(here)
      if (direction === 'up') {
        try {
          const gained = progression.reachFloor(floor)
          if (gained.granted > 0) {
            console.log(`[상태] 스탯 포인트 +${gained.granted} | 남은 ${gained.unspent}`)
          }
        } catch (error) {
          console.error('층 스탯 보상 실패', error)
        }
      }
      statSheet.refresh()
      showFloor()
    }

    const draw = () => {
      drawTowerFloor(ctx, canvas.width, canvas.height, floor)
      drawStairs(ctx, stairSpots(canvas, floor))
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
        if (canOpenChest(point) || canTakeSword(point)) {
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
        if (canTakeSword(point)) {
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
        stepOntoStairs()
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

    showFloor()
    actor.printStatus('게임 시작')
    requestAnimationFrame(loop)
  } catch (error) {
    console.error('게임 시작 실패', error)
  }
}

startGame()
