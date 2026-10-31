import { createGoblin, MONSTER_RESPAWN_SECONDS } from './monster.js'

const fakeCanvas = { width: 800, height: 600 }

beforeAll(() => {
  // Node 테스트 환경에는 브라우저 Image가 없다.
  global.Image = class {
    addEventListener() {}
    set src(_value) {}
  }
})

describe('고블린 리젠과 순찰', () => {
  test('쓰러지면 일정 시간 뒤 스폰 지점에서 다시 살아난다', () => {
    const goblin = createGoblin(fakeCanvas, { x: 100, y: 200 })
    goblin.defeat()
    expect(goblin.isAlive()).toBe(false)
    goblin.update(MONSTER_RESPAWN_SECONDS - 1, () => true, true)
    expect(goblin.isAlive()).toBe(false)
    goblin.update(2, () => true, true)
    expect(goblin.isAlive()).toBe(true)
    expect(goblin.getPosition()).toEqual({ x: 100, y: 200 })
  })

  test('살아 있으면 스폰 지점 근처로 순찰한다', () => {
    const goblin = createGoblin(fakeCanvas, { x: 300, y: 300 })
    for (let step = 0; step < 40; step += 1) {
      goblin.update(0.2, () => true, true)
    }
    const spot = goblin.getPosition()
    const home = goblin.getHome()
    expect(Math.hypot(spot.x - home.x, spot.y - home.y)).toBeLessThanOrEqual(140)
    expect(spot.x !== home.x || spot.y !== home.y).toBe(true)
  })

  test('전투 중에는 순찰을 멈추고 리젠 타이머만 진행한다', () => {
    const goblin = createGoblin(fakeCanvas, { x: 50, y: 50 })
    goblin.update(0.5, () => true, true)
    const before = goblin.getPosition()
    goblin.update(1, () => true, false)
    expect(goblin.getPosition()).toEqual(before)
    goblin.defeat()
    goblin.update(MONSTER_RESPAWN_SECONDS + 0.1, () => true, false)
    expect(goblin.isAlive()).toBe(true)
  })
})
