export const BASIC_ATTACK_MULTIPLIER = 1
export const POWER_STRIKE_MP_COST = 15
export const POWER_STRIKE_MULTIPLIER = 2
export const HEAVY_STRIKE_MP_COST = 30
export const HEAVY_STRIKE_MULTIPLIER = 3

// 오만의 탑 파괴 계열을 실시간 전투용으로 맞춘 액티브 스킬이다.
export const COMBAT_SKILLS = [
  {
    id: 'power-strike',
    name: '강타',
    mpCost: POWER_STRIKE_MP_COST,
    multiplier: POWER_STRIKE_MULTIPLIER,
    description: '무기를 크게 휘둘러 공격력의 2배 피해를 준다.',
  },
  {
    id: 'heavy-strike',
    name: '일격',
    mpCost: HEAVY_STRIKE_MP_COST,
    multiplier: HEAVY_STRIKE_MULTIPLIER,
    description: '급소를 노려 공격력의 3배 피해를 준다.',
  },
]

export const skillById = (id) => COMBAT_SKILLS.find((skill) => skill.id === id) || null

export const skillHitMessage = (skill, damage, crit) => {
  if (!skill) {
    return crit ? `치명타! ${damage}` : `${damage} 피해`
  }
  if (skill.id === 'power-strike') {
    return crit
      ? `강타 치명타! ${damage}의 피해를 입혔다.`
      : `강타! ${damage}의 피해를 입혔다.`
  }
  if (skill.id === 'heavy-strike') {
    return crit
      ? `일격 치명타! ${damage}의 파괴적인 피해!`
      : `일격! ${damage}의 피해를 입혔다.`
  }
  return `${skill.name}! ${damage} 피해`
}
