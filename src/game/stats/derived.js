import {
  AGI_ATK_PER_AGI,
  AGI_ATK_PER_STR,
  AGI_SPEED_FIRST_BAND,
  AGI_SPEED_FIRST_PERCENT,
  AGI_SPEED_REST_PERCENT,
  AGI_SPEED_SECOND_BAND,
  AGI_SPEED_SECOND_PERCENT,
  ATTACK_SPEED_BONUS_CAP_PERCENT,
  BASE_ATTACK_SPEED,
  BASE_HP,
  BASE_MP,
  CRIT_PERCENT_PER_AGI,
  HP_PER_VIT,
  INT_ATK_PER_INT,
  MP_PER_INT,
  STR_ATK_PER_AGI,
  STR_ATK_PER_STR,
} from './constants.js'

const assertFinite = (value, message) => {
  if (!Number.isFinite(value)) {
    throw new Error(message)
  }
}

export const maxHp = (vit) => {
  assertFinite(vit, '체력 스탯이 올바르지 않습니다.')
  return BASE_HP + vit * HP_PER_VIT
}

export const maxMp = (intelligence) => {
  assertFinite(intelligence, '지능 스탯이 올바르지 않습니다.')
  return BASE_MP + intelligence * MP_PER_INT
}

// 직업의 주 스탯과 민첩, 힘 보정으로 맨손 공격력을 구한다.
export const baseAttack = (primaryStat, stats) => {
  assertFinite(stats.str, '힘 스탯이 올바르지 않습니다.')
  assertFinite(stats.agi, '민첩 스탯이 올바르지 않습니다.')
  assertFinite(stats.int, '지능 스탯이 올바르지 않습니다.')

  if (primaryStat === 'str') {
    return stats.str * STR_ATK_PER_STR + stats.agi * STR_ATK_PER_AGI
  }
  if (primaryStat === 'agi') {
    return stats.agi * AGI_ATK_PER_AGI + stats.str * AGI_ATK_PER_STR
  }
  if (primaryStat === 'int') {
    return stats.int * INT_ATK_PER_INT
  }
  throw new Error('주 스탯 계열이 올바르지 않습니다.')
}

export const totalAttack = (primaryStat, stats, weaponAtk) => {
  assertFinite(weaponAtk, '무기 공격력이 올바르지 않습니다.')
  return baseAttack(primaryStat, stats) + weaponAtk
}

// 방어력은 스탯이 아니라 장착한 방어구와 장신구의 합이다.
export const totalDefense = (armorDef) => {
  assertFinite(armorDef, '방어구 방어력이 올바르지 않습니다.')
  return armorDef
}

// 민첩 구간마다 공격 속도 증가율이 줄고, 보너스 상한은 60%다.
export const attackSpeed = (agi) => {
  assertFinite(agi, '민첩 스탯이 올바르지 않습니다.')
  const first = Math.min(Math.max(agi, 0), AGI_SPEED_FIRST_BAND)
  const second = Math.min(Math.max(agi - AGI_SPEED_FIRST_BAND, 0), AGI_SPEED_SECOND_BAND - AGI_SPEED_FIRST_BAND)
  const rest = Math.max(agi - AGI_SPEED_SECOND_BAND, 0)
  const bonusPercent = Math.min(
    first * AGI_SPEED_FIRST_PERCENT + second * AGI_SPEED_SECOND_PERCENT + rest * AGI_SPEED_REST_PERCENT,
    ATTACK_SPEED_BONUS_CAP_PERCENT,
  )
  return BASE_ATTACK_SPEED * (1 + bonusPercent / 100)
}

export const critChancePercent = (agi) => {
  assertFinite(agi, '민첩 스탯이 올바르지 않습니다.')
  return agi * CRIT_PERCENT_PER_AGI
}
