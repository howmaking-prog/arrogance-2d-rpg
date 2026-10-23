import { calculateDamage } from './damage.js'
import { attackSpeed, baseAttack, critChancePercent, maxHp, maxMp, totalDefense } from './derived.js'
import { createStatProgression } from './progression.js'

describe('파생 능력치', () => {
  test('체력과 지능으로 최대 HP와 MP를 구한다', () => {
    expect(maxHp(10)).toBe(200)
    expect(maxMp(10)).toBe(200)
    expect(maxHp(25)).toBe(350)
  })

  test('주 스탯 계열마다 맨손 공격력 공식이 다르다', () => {
    const stats = { str: 10, agi: 10, int: 10 }
    expect(baseAttack('str', stats)).toBeCloseTo(17)
    expect(baseAttack('agi', stats)).toBeCloseTo(15)
    expect(baseAttack('int', stats)).toBeCloseTo(15)
  })

  test('방어력은 스탯이 아니라 장착 방어의 합이다', () => {
    expect(totalDefense(0)).toBe(0)
    expect(totalDefense(7)).toBe(7)
  })

  test('민첩 구간마다 공격 속도 증가가 줄고 60%에서 멈춘다', () => {
    expect(attackSpeed(10)).toBeCloseTo(1.08)
    expect(attackSpeed(40)).toBeCloseTo(1.32)
    expect(attackSpeed(41)).toBeCloseTo(1.324)
    expect(attackSpeed(80)).toBeCloseTo(1.48)
    expect(attackSpeed(1000)).toBeCloseTo(1.6)
  })

  test('치명타 확률은 민첩 1당 0.2%다', () => {
    expect(critChancePercent(10)).toBeCloseTo(2)
    expect(critChancePercent(50)).toBeCloseTo(10)
  })
})

describe('피해 계산', () => {
  test('방어를 빼도 최소 피해는 1이다', () => {
    expect(calculateDamage(10, 3, false)).toBe(7)
    expect(calculateDamage(10, 40, false)).toBe(1)
  })

  test('치명타는 최소 피해를 적용한 뒤 1.5배에서 소수점을 버린다', () => {
    expect(calculateDamage(10, 3, true)).toBe(10)
    expect(calculateDamage(2, 0, true)).toBe(3)
    expect(calculateDamage(1, 0, true)).toBe(1)
  })
})

describe('스탯 성장', () => {
  test('네 스탯은 10에서 시작하고 배분 포인트는 50이다', () => {
    const state = createStatProgression().getState()
    expect(state.stats).toEqual({ str: 10, agi: 10, vit: 10, int: 10 })
    expect(state.unspent).toBe(50)
    expect(state.ownedPoints).toBe(90)
    expect(state.primaryStat).toBe('str')
  })

  test('포인트를 넣고 기본값까지만 되돌릴 수 있다', () => {
    const progression = createStatProgression()
    progression.allocate('str', 5)
    expect(progression.getState().stats.str).toBe(15)
    expect(progression.getState().unspent).toBe(45)
    progression.allocate('str', -5)
    expect(progression.getState().stats.str).toBe(10)
    expect(() => progression.allocate('str', -1)).toThrow('기본 스탯')
    expect(() => progression.allocate('str', 51)).toThrow('부족')
  })

  test('무기 공격력은 계열 공격력에 더한다', () => {
    const progression = createStatProgression()
    progression.setGear({ weaponAtk: 8, armorDef: 3 })
    const state = progression.getState()
    expect(state.derived.baseAtk).toBeCloseTo(17)
    expect(state.derived.totalAtk).toBeCloseTo(25)
    expect(state.derived.totalDef).toBe(3)
  })

  test('4층을 지날 때마다 포인트 1을 주고 합계 200에서 멈춘다', () => {
    const progression = createStatProgression()
    expect(progression.reachFloor(4).granted).toBe(0)
    expect(progression.reachFloor(5).granted).toBe(1)
    expect(progression.reachFloor(3).granted).toBe(0)
    expect(progression.getState().unspent).toBe(51)

    const capped = createStatProgression().reachFloor(1 + 110 * 4)
    expect(capped.granted).toBe(110)
    expect(capped.ownedPoints).toBe(200)
    const blocked = createStatProgression()
    blocked.reachFloor(1 + 110 * 4)
    expect(blocked.reachFloor(blocked.getState().highestFloor + 4).granted).toBe(0)
    expect(blocked.getState().ownedPoints).toBe(200)
  })
})
