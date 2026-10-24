import { createDungeonLayout } from './dungeon/layout.js?v=13'
import { drawTowerFloor } from './floor.js?v=13'
import { createHud } from './hud.js?v=12'
import { createFieldItems } from './items.js?v=12'
import { createMonsters } from './monster.js?v=13'
import { createPlayer, playerFootBounds, toCanvasPoint } from './player.js?v=13'
import { drawStairs, stairAtPoint, stairsFromLayout } from './stairs.js?v=13'
import { createStatProgression } from './stats/progression.js?v=10'
import { createStatSheet } from './stats/statSheet.js?v=10'

const CLICK_DELAY = 220

const randomSeed = () => 1 + Math.floor(Math.random() * 1000000)

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
    let dungeonSeed = randomSeed()
    const floors = new Map()
    const actor = createPlayer(canvas)
    let layout = createDungeonLayout({
      width: canvas.width,
      height: canvas.height,
      floor,
      seed: dungeonSeed,
      bounds: playerFootBounds(canvas),
    })
    actor.setBlocked((x, y) => !layout.isWalkable(x, y))
    actor.placeAt(layout.playerStart)
    createHud()
    const items = createFieldItems(canvas, layout.chest)
    const monsters = createMonsters(canvas, layout.monsters)
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

    const currentStairs = () => stairsFromLayout(layout, floor)

    const showFloor = () => {
      const label = `오만의 탑 ${floor}층`
      if (floorTitle instanceof HTMLElement) {
        floorTitle.textContent = label
      }
      canvas.setAttribute('aria-label', label)
      console.log(`[상태] ${label} | ${layout.theme.label}`)
    }

    // 같은 시드로 방과 복도를 다시 만들고, 발밑이 벽이면 막는다.
    const rebuildLayout = (seed) => {
      dungeonSeed = seed
      layout = createDungeonLayout({
        width: canvas.width,
        height: canvas.height,
        floor,
        seed: dungeonSeed,
        bounds: playerFootBounds(canvas),
      })
      actor.setBlocked((x, y) => !layout.isWalkable(x, y))
    }

    const canOpenChest = (point) => items.hitChest(point) && items.isChestInReach(actor.getPosition())
    const canTakeSword = (point) => items.hitDroppedSword(point) && items.isSwordInReach(actor.getPosition())

    const refreshCursor = () => {
      const interactive = Boolean(pointer && (canOpenChest(pointer) || canTakeSword(pointer)))
      canvas.style.cursor = interactive ? 'pointer' : 'crosshair'
    }

    // 발밑이 계단 칸에 들어오면 더블클릭 없이 위층이나 아래층으로 옮긴다.
    const stepOntoStairs = () => {
      const stood = stairAtPoint(currentStairs(), actor.getPosition())
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

    // 방문한 층은 같은 시드로 되돌리고, 처음 가는 층만 새로 만든다.
    const changeFloor = (direction) => {
      const nextFloor = direction === 'up' ? floor + 1 : floor - 1
      if (nextFloor < 1) {
        return
      }

      floors.set(floor, {
        items: items.captureFloor(),
        monsters: monsters.capture(),
        goblin: monsters.capture()[0] || null,
        seed: dungeonSeed,
      })
      floor = nextFloor

      const saved = floors.get(floor)
      if (saved) {
        rebuildLayout(saved.seed)
        items.applyFloor(saved.items)
        monsters.placeAll(saved.monsters)
      } else {
        rebuildLayout(randomSeed())
        items.applyFloor({
          x: layout.chest.x,
          y: layout.chest.y,
          open: false,
          droppedSword: null,
        })
        monsters.placeAll(layout.monsters)
      }

      const here = direction === 'up' ? layout.playerStart : layout.exitApproach
      actor.placeAt(layout.nearestWalkable(here))
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
      drawTowerFloor(ctx, canvas.width, canvas.height, layout)
      drawStairs(ctx, currentStairs())
      items.draw(ctx)
      monsters.draw(ctx)
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
        const savedItems = items.captureFloor()
        rebuildLayout(dungeonSeed)
        items.applyFloor({
          ...savedItems,
          x: layout.chest.x,
          y: layout.chest.y,
          droppedSword: savedItems.droppedSword ? layout.nearestWalkable(savedItems.droppedSword) : null,
        })
        monsters.placeAll(layout.monsters)
        actor.placeAt(layout.nearestWalkable(actor.getPosition()))
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
