import { CRIT_DAMAGE_MULTIPLIER, MIN_DAMAGE } from './constants.js'

// 방어를 뺀 피해는 최소 1이며, 치명타는 그 값의 1.5배에서 소수점을 버린다.
export const calculateDamage = (attackerAtk, defenderDef, isCrit) => {
  if (!Number.isFinite(attackerAtk) || !Number.isFinite(defenderDef) || typeof isCrit !== 'boolean') {
    throw new Error('피해 계산 값이 올바르지 않습니다.')
  }

  const rawDamage = attackerAtk - defenderDef
  let finalDamage = Math.max(MIN_DAMAGE, rawDamage)
  if (isCrit) {
    finalDamage = Math.floor(finalDamage * CRIT_DAMAGE_MULTIPLIER)
  }
  return finalDamage
}
