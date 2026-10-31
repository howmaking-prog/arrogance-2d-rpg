import { createGoblin } from './monster.js?v=24'

const distance = (from, to) => Math.hypot(from.x - to.x, from.y - to.y)

// 한 층에 고블린을 여러 마리 두고, 가까운 한 마리와만 싸운다.
export const createGoblinPack = (canvas, positions) => {
  const spots = Array.isArray(positions) && positions.length > 0
    ? positions
    : [{ x: 0, y: 0, alive: false }]
  let foes = spots.map((position, index) => ({
    id: index,
    unit: createGoblin(canvas, {
      x: position.x,
      y: position.y,
      homeX: position.homeX ?? position.x,
      homeY: position.homeY ?? position.y,
      alive: typeof position.alive === 'boolean' ? position.alive : true,
      respawnLeft: position.respawnLeft || 0,
    }),
  }))
  let activeId = null

  const byId = (id) => foes.find((foe) => foe.id === id) || null

  return {
    placeAll: (list) => {
      try {
        const next = Array.isArray(list) && list.length > 0 ? list : spots
        foes = next.map((position, index) => ({
          id: index,
          unit: createGoblin(canvas, {
            x: position.x,
            y: position.y,
            homeX: position.homeX ?? position.x,
            homeY: position.homeY ?? position.y,
            alive: typeof position.alive === 'boolean' ? position.alive : true,
            respawnLeft: position.respawnLeft || 0,
          }),
        }))
        activeId = null
        console.log(`[상태] 고블린 ${foes.filter((foe) => foe.unit.isAlive()).length}마리`)
      } catch (error) {
        console.error('고블린 무리 배치 실패', error)
      }
    },
    capture: () => foes.map((foe) => ({ id: foe.id, ...foe.unit.capture() })),
    nearestAlive: (point, maxDistance) => {
      let best = null
      foes.forEach((foe) => {
        if (!foe.unit.isAlive()) {
          return
        }
        const range = distance(point, foe.unit.getPosition())
        if (range > maxDistance) {
          return
        }
        if (!best || range < best.range) {
          best = { id: foe.id, range, position: foe.unit.getPosition() }
        }
      })
      return best
    },
    setActive: (id) => {
      activeId = id
    },
    clearActive: () => {
      activeId = null
    },
    defeatActive: () => {
      const foe = byId(activeId)
      if (foe) {
        foe.unit.defeat()
      }
      activeId = null
    },
    getActivePosition: () => {
      const foe = byId(activeId)
      return foe ? foe.unit.getPosition() : null
    },
    aliveCount: () => foes.filter((foe) => foe.unit.isAlive()).length,
    // 전투 중에는 순찰을 멈추고, 죽은 고블린만 리젠 시간을 잰다.
    update: (dt, isWalkable, combatBusy) => {
      foes.forEach((foe) => {
        foe.unit.update(dt, isWalkable, !combatBusy)
      })
    },
    draw: (ctx, flash, attack, playerPoint) => {
      foes.forEach((foe) => {
        if (!foe.unit.isAlive()) {
          return
        }
        const position = foe.unit.getPosition()
        const dx = playerPoint.x - position.x
        const dy = playerPoint.y - position.y
        const facing = Math.abs(dx) > Math.abs(dy)
          ? (dx < 0 ? 'left' : 'right')
          : (dy < 0 ? 'up' : 'down')
        const fighting = foe.id === activeId
        foe.unit.draw(ctx, fighting ? flash : null, fighting ? attack : null, fighting ? facing : null)
      })
    },
  }
}
