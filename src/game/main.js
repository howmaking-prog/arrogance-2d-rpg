import { createCombatManager } from './combat/combat.js?v=17'
import { createCombatView } from './combat/combatView.js?v=17'
import { createGoblinProfile } from './combat/monsterStats.js?v=15'
import { createHitSounds } from './combat/sfx.js?v=17'
import { createDungeonLayout } from './dungeon/layout.js?v=18'
import { drawTowerFloor } from './floor.js?v=18'
import { createHud } from './hud.js?v=10'
import { createFieldItems } from './items.js?v=10'
import { createGoblin } from './monster.js?v=17'
import { createPlayer, toCanvasPoint } from './player.js?v=17'
import { drawStairs, stairAtPoint, stairsFromLayout } from './stairs.js?v=14'
import { createStatProgression } from './stats/progression.js?v=10'
import { createStatSheet } from './stats/statSheet.js?v=10'

const CLICK_DELAY = 220
const ENGAGE_DISTANCE = 120

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

    // 보이는 화면만 맞춘다. 던전 크기는 화면과 따로 둔다.
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
      floor,
      seed: dungeonSeed,
    })
    const bindWorld = () => {
      actor.setWorldBounds({
        minX: layout.tileSize / 2,
        minY: layout.tileSize / 2,
        maxX: layout.worldWidth - layout.tileSize / 2,
        maxY: layout.worldHeight - layout.tileSize / 2,
      })
      actor.setBlocked((x, y) => !layout.isWalkable(x, y))
    }
    bindWorld()
    actor.placeAt(layout.playerStart)
    createHud()
    const items = createFieldItems(canvas, layout.chest)
    const goblin = createGoblin(canvas, layout.encounter)
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
    let vitals = null
    const wallet = { exp: 0, gold: 0 }
    const sounds = createHitSounds()
    let heardSwing = 0
    const playNewStrikes = (state) => {
      state.swings.forEach((swing) => {
        if (swing.id > heardSwing) {
          sounds.playStrike(swing.who, swing.crit)
        }
      })
      heardSwing = state.swings.reduce((latest, swing) => Math.max(latest, swing.id), heardSwing)
    }
    const facingBetween = (from, to) => {
      const dx = to.x - from.x
      const dy = to.y - from.y
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx < 0 ? 'left' : 'right'
      }
      return dy < 0 ? 'up' : 'down'
    }
    const combat = createCombatManager({
      getPlayer: () => {
        const state = progression.getState()
        const maxHpValue = state.derived.maxHp
        const maxMpValue = state.derived.maxMp
        return {
          maxHp: maxHpValue,
          maxMp: maxMpValue,
          hp: vitals ? Math.min(vitals.hp, maxHpValue) : maxHpValue,
          mp: vitals ? Math.min(vitals.mp, maxMpValue) : maxMpValue,
          atk: state.derived.totalAtk,
          def: state.derived.totalDef,
          attackSpeed: state.derived.attackSpeed,
          critChance: state.derived.critChancePercent / 100,
        }
      },
    })

    const currentStairs = () => stairsFromLayout(layout, floor)

    const showFloor = () => {
      const label = `오만의 탑 ${floor}층`
      if (floorTitle instanceof HTMLElement) {
        floorTitle.textContent = label
      }
      canvas.setAttribute('aria-label', label)
      console.log(`[상태] ${label} | ${layout.theme.label} | 맵 ${layout.cols}x${layout.rows}`)
    }

    const rebuildLayout = (seed) => {
      dungeonSeed = seed
      layout = createDungeonLayout({
        floor,
        seed: dungeonSeed,
      })
      bindWorld()
    }

    const viewCamera = () => layout.camera(actor.getPosition(), canvas.width, canvas.height)

    const toWorldPoint = (event) => {
      const point = toCanvasPoint(canvas, event)
      const camera = viewCamera()
      return { x: point.x + camera.x, y: point.y + camera.y }
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

    // 방문한 층은 그대로 두고, 처음 가는 층만 새로 배치한다.
    const changeFloor = (direction) => {
      const nextFloor = direction === 'up' ? floor + 1 : floor - 1
      if (nextFloor < 1) {
        return
      }

      floors.set(floor, {
        items: items.captureFloor(),
        goblin: goblin.capture(),
        seed: dungeonSeed,
      })
      floor = nextFloor

      const saved = floors.get(floor)
      if (saved) {
        rebuildLayout(saved.seed)
        items.applyFloor(saved.items)
        goblin.place(saved.goblin)
      } else {
        rebuildLayout(randomSeed())
        items.applyFloor({
          x: layout.chest.x,
          y: layout.chest.y,
          open: false,
          droppedSword: null,
        })
        goblin.place({ ...layout.encounter, alive: true })
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

    const applyCombatResult = (result) => {
      if (!result) {
        return
      }
      const state = combat.getSnapshot()
      vitals = state.player ? { hp: state.player.hp, mp: state.player.mp } : vitals
      if (result.result === 'victory' && result.reward) {
        wallet.exp += result.reward.exp
        wallet.gold += result.reward.gold
        console.log(`[상태] 승리 | 경험치 ${wallet.exp} | 골드 ${wallet.gold}`)
        combatView.showVictory({
          exp: result.reward.exp,
          gold: result.reward.gold,
        })
        return
      }
      if (result.result === 'defeat') {
        console.log('[상태] 패배')
        combatView.showDefeat()
      }
    }

    const combatView = createCombatView({
      onSkill: (skillId) => {
        const cast = combat.useSkill(skillId)
        if (!cast.ok && cast.reason) {
          console.log(`[상태] ${cast.reason}`)
        }
        applyCombatResult(combat.takeResult())
      },
      onNextFloor: () => {
        combatView.hideResult()
        combatView.setOpen(false)
        vitals = combat.end()
        goblin.defeat()
        if (stairAtPoint(currentStairs(), actor.getPosition())) {
          holdStairs = true
        }
      },
      onRestart: () => {
        window.location.reload()
      },
    })

    const draw = () => {
      const camera = viewCamera()
      ctx.fillStyle = '#070604'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(-Math.round(camera.x), -Math.round(camera.y))
      drawTowerFloor(ctx, layout)
      drawStairs(ctx, currentStairs())
      items.draw(ctx)
      const state = combat.getSnapshot()
      const playerPoint = actor.getPosition()
      const monsterPoint = goblin.getPosition()
      const monsterSwing = state.swings.find((item) => item.who === 'monster')
      goblin.draw(ctx, state.monsterFlash, monsterSwing, facingBetween(monsterPoint, playerPoint))
      if (actor.isReady()) {
        const playerSwing = state.swings.find((item) => item.who === 'player')
        actor.draw(ctx, items.getEquippedWeapon(), state.playerFlash, playerSwing)
        combatView.drawFloats(ctx, state.floats.map((item) => ({
          ...item,
          x: item.target === 'monster' ? monsterPoint.x : playerPoint.x,
          y: (item.target === 'monster' ? monsterPoint.y : playerPoint.y) - 88,
        })))
      }
      ctx.restore()
      if (!actor.isReady()) {
        ctx.fillStyle = '#e8f0e4'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(actor.hasFailed() ? '캐릭터 이미지를 불러오지 못했습니다.' : '캐릭터 이미지를 불러오는 중...', 24, 36)
      }
    }

    canvas.addEventListener('mousemove', (event) => {
      try {
        pointer = toWorldPoint(event)
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

        sounds.unlock()
        const point = toWorldPoint(event)
        clearTimeout(clickTimer)
        if (combat.isBusy() || canOpenChest(point) || canTakeSword(point)) {
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
        if (combat.isBusy()) {
          return
        }
        const point = toWorldPoint(event)
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
        if (!combat.isBusy()) {
          actor.update(dt)
          stepOntoStairs()
          const here = actor.getPosition()
          const foe = goblin.getPosition()
          const nearMonster = goblin.isAlive() && Math.hypot(here.x - foe.x, here.y - foe.y) <= ENGAGE_DISTANCE
          if (nearMonster) {
            actor.placeAt(here)
            const started = combat.start(createGoblinProfile(floor))
            combatView.resetBars(started)
            combatView.hideResult()
            combatView.setOpen(true)
            console.log(`[상태] 전투 시작 | ${started.monster.name}`)
          }
        } else if (combat.isFighting()) {
          combat.update(dt)
          applyCombatResult(combat.takeResult())
          const state = combat.getSnapshot()
          playNewStrikes(state)
          combatView.sync(dt, state)
        } else if (combat.isBusy()) {
          combat.update(dt)
          const state = combat.getSnapshot()
          playNewStrikes(state)
          combatView.sync(dt, state)
        } else {
          combatView.sync(dt, combat.getSnapshot())
        }
        refreshCursor()
        draw()
      } catch (error) {
        console.error('프레임 처리 실패', error)
      }
      requestAnimationFrame(loop)
    }

    window.addEventListener('resize', () => {
      try {
        fitCanvas()
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
