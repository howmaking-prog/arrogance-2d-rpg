import { createCombatManager } from './combat.js'
import { createGoblinProfile } from './monsterStats.js'
import { POWER_STRIKE_MP_COST } from './skills.js'

const playerStats = {
  maxHp: 200,
  hp: 200,
  maxMp: 100,
  mp: 100,
  atk: 20,
  def: 0,
  attackSpeed: 1,
  critChance: 0,
}

const managerWith = (random = () => 0) => createCombatManager({
  getPlayer: () => playerStats,
  random,
})

describe('자동 전투', () => {
  test('공격 속도 간격마다 방어를 뺀 피해를 주고 최소 피해는 1이다', () => {
    const combat = managerWith()
    combat.start({
      name: '고블린',
      maxHp: 100,
      atk: 5,
      def: 4,
      attackSpeed: 1,
      critChance: 0,
      exp: 3,
      gold: 2,
    })
    combat.update(1)
    const after = combat.getSnapshot()
    expect(after.monster.hp).toBe(84)
    expect(after.floats.some((item) => item.text === '16' && item.target === 'monster')).toBe(true)
    expect(after.swings.some((item) => item.who === 'player')).toBe(true)
  })

  test('치명타는 방어를 뺀 피해의 1.5배다', () => {
    const combat = createCombatManager({
      getPlayer: () => ({ ...playerStats, critChance: 1, atk: 10 }),
      random: () => 0,
    })
    combat.start({
      name: '고블린',
      maxHp: 100,
      atk: 1,
      def: 0,
      attackSpeed: 0.1,
      critChance: 0,
      exp: 1,
      gold: 1,
    })
    combat.update(1)
    expect(combat.getSnapshot().monster.hp).toBe(85)
    expect(combat.getSnapshot().floats[0].crit).toBe(true)
  })

  test('마나가 충분하면 스킬이 공격력 배율로 들어가고 부족하면 쓰지 않는다', () => {
    const combat = createCombatManager({
      getPlayer: () => ({ ...playerStats, mp: POWER_STRIKE_MP_COST - 1, maxMp: 100, atk: 10 }),
      random: () => 1,
    })
    combat.start(createGoblinProfile(1))
    const failed = combat.useSkill('power-strike')
    expect(failed.ok).toBe(false)
    expect(combat.getSnapshot().player.mp).toBe(POWER_STRIKE_MP_COST - 1)

    combat.end()
    const ready = createCombatManager({
      getPlayer: () => ({ ...playerStats, mp: 40, maxMp: 100, atk: 10 }),
      random: () => 1,
    })
    ready.start({
      name: '고블린',
      maxHp: 100,
      atk: 1,
      def: 0,
      attackSpeed: 0.1,
      critChance: 0,
      exp: 4,
      gold: 5,
    })
    const cast = ready.useSkill('power-strike')
    expect(cast.ok).toBe(true)
    expect(ready.getSnapshot().player.mp).toBe(25)
    expect(ready.getSnapshot().monster.hp).toBe(80)
  })

  test('몬스터 체력이 0이면 승리하고 경험치와 골드를 준다', () => {
    const combat = managerWith()
    combat.start({
      name: '고블린',
      maxHp: 10,
      atk: 1,
      def: 0,
      attackSpeed: 0.1,
      critChance: 0,
      exp: 9,
      gold: 7,
    })
    combat.update(1)
    expect(combat.takeResult()).toEqual({ result: 'victory', reward: { exp: 9, gold: 7 } })
    expect(combat.takeResult()).toBeNull()
  })

  test('플레이어 체력이 0이면 패배한다', () => {
    const combat = createCombatManager({
      getPlayer: () => ({ ...playerStats, hp: 5, maxHp: 5, attackSpeed: 0.1 }),
      random: () => 1,
    })
    combat.start({
      name: '고블린',
      maxHp: 50,
      atk: 12,
      def: 0,
      attackSpeed: 1,
      critChance: 0,
      exp: 1,
      gold: 1,
    })
    combat.update(1)
    expect(combat.takeResult().result).toBe('defeat')
  })

  test('1층 고블린보다 위층의 고블린이 더 단단하다', () => {
    expect(createGoblinProfile(3).maxHp).toBeGreaterThan(createGoblinProfile(1).maxHp)
    expect(createGoblinProfile(3).atk).toBeGreaterThan(createGoblinProfile(1).atk)
  })
})
