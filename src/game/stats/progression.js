import {
  BASE_STAT,
  FLOORS_PER_STAT_POINT,
  PRIMARY_STATS,
  STARTING_BONUS_POINTS,
  STAT_KEYS,
  STAT_POINT_CAP,
} from './constants.js'
import {
  attackSpeed,
  baseAttack,
  critChancePercent,
  maxHp,
  maxMp,
  totalAttack,
  totalDefense,
} from './derived.js'

const statSum = (stats) => STAT_KEYS.reduce((sum, key) => sum + stats[key], 0)

// 기본 스탯, 시작 포인트, 층 보너스를 한곳에서 배분한다.
export const createStatProgression = () => {
  const stats = {
    str: BASE_STAT,
    agi: BASE_STAT,
    vit: BASE_STAT,
    int: BASE_STAT,
  }
  let unspent = STARTING_BONUS_POINTS
  let highestFloor = 1
  let towerPointsApplied = 0
  let primaryStat = 'str'
  let weaponAtk = 0
  let armorDef = 0

  const ownedPoints = () => statSum(stats) + unspent

  const getState = () => {
    const snapshot = { ...stats }
    const attack = totalAttack(primaryStat, snapshot, weaponAtk)
    return {
      stats: snapshot,
      unspent,
      highestFloor,
      towerPointsApplied,
      primaryStat,
      weaponAtk,
      armorDef,
      ownedPoints: ownedPoints(),
      derived: {
        maxHp: maxHp(snapshot.vit),
        maxMp: maxMp(snapshot.int),
        baseAtk: baseAttack(primaryStat, snapshot),
        totalAtk: attack,
        totalDef: totalDefense(armorDef),
        attackSpeed: attackSpeed(snapshot.agi),
        critChancePercent: critChancePercent(snapshot.agi),
      },
    }
  }

  const allocate = (stat, amount) => {
    if (!STAT_KEYS.includes(stat)) {
      throw new Error('배분할 스탯이 올바르지 않습니다.')
    }
    if (!Number.isInteger(amount) || amount === 0) {
      throw new Error('스탯 포인트는 0이 아닌 정수여야 합니다.')
    }

    if (amount > 0) {
      if (amount > unspent) {
        throw new Error('남은 스탯 포인트가 부족합니다.')
      }
      if (statSum(stats) + amount > STAT_POINT_CAP) {
        throw new Error('스탯 합계 상한을 넘을 수 없습니다.')
      }
      stats[stat] += amount
      unspent -= amount
      return getState()
    }

    const nextValue = stats[stat] + amount
    if (nextValue < BASE_STAT) {
      throw new Error('기본 스탯보다 낮출 수 없습니다.')
    }
    stats[stat] = nextValue
    unspent -= amount
    return getState()
  }

  // 한 층을 위로 지나갈 때마다 클리어로 센다. 4층마다 포인트 1, 합계 200에서 멈춘다.
  const reachFloor = (floorNumber) => {
    if (!Number.isInteger(floorNumber) || floorNumber < 1) {
      throw new Error('층 수가 올바르지 않습니다.')
    }
    if (floorNumber > highestFloor) {
      highestFloor = floorNumber
    }

    const earned = Math.floor(Math.max(0, highestFloor - 1) / FLOORS_PER_STAT_POINT)
    const room = STAT_POINT_CAP - ownedPoints()
    const granted = Math.max(0, Math.min(earned - towerPointsApplied, room))
    unspent += granted
    towerPointsApplied = earned
    return { granted, ...getState() }
  }

  const setPrimaryStat = (nextPrimary) => {
    if (!PRIMARY_STATS.includes(nextPrimary)) {
      throw new Error('주 스탯 계열이 올바르지 않습니다.')
    }
    primaryStat = nextPrimary
    return getState()
  }

  const setGear = ({ weaponAtk: nextWeaponAtk, armorDef: nextArmorDef }) => {
    if (!Number.isFinite(nextWeaponAtk) || nextWeaponAtk < 0 || !Number.isFinite(nextArmorDef) || nextArmorDef < 0) {
      throw new Error('장착 능력치가 올바르지 않습니다.')
    }
    weaponAtk = nextWeaponAtk
    armorDef = nextArmorDef
    return getState()
  }

  return {
    getState,
    allocate,
    reachFloor,
    setPrimaryStat,
    setGear,
  }
}
