export const BASIC_ATTACK_MULTIPLIER = 1
export const POWER_STRIKE_MP_COST = 15
export const POWER_STRIKE_MULTIPLIER = 2
export const HEAVY_STRIKE_MP_COST = 30
export const HEAVY_STRIKE_MULTIPLIER = 3

// 전투 중에 마나를 쓰고 공격력 배율로 피해를 준다.
export const COMBAT_SKILLS = [
  {
    id: 'power-strike',
    name: '강타',
    mpCost: POWER_STRIKE_MP_COST,
    multiplier: POWER_STRIKE_MULTIPLIER,
  },
  {
    id: 'heavy-strike',
    name: '일격',
    mpCost: HEAVY_STRIKE_MP_COST,
    multiplier: HEAVY_STRIKE_MULTIPLIER,
  },
]

export const skillById = (id) => COMBAT_SKILLS.find((skill) => skill.id === id) || null
