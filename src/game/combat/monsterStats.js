const GOBLIN_BASE_HP = 56
const GOBLIN_HP_PER_FLOOR = 22
const GOBLIN_BASE_ATK = 8
const GOBLIN_ATK_PER_FLOOR = 3
const GOBLIN_DEF_FLOORS = 2
const GOBLIN_ATTACK_SPEED = 0.65
const GOBLIN_CRIT_CHANCE = 0.05
const GOBLIN_BASE_EXP = 12
const GOBLIN_EXP_PER_FLOOR = 6
const GOBLIN_BASE_GOLD = 8
const GOBLIN_GOLD_PER_FLOOR = 4

// 층이 올라갈수록 고블린의 체력과 공격이 커진다.
export const createGoblinProfile = (floor) => {
  const level = Math.max(1, Math.floor(Number(floor) || 1))
  const steps = level - 1
  return {
    name: '고블린',
    maxHp: GOBLIN_BASE_HP + steps * GOBLIN_HP_PER_FLOOR,
    atk: GOBLIN_BASE_ATK + steps * GOBLIN_ATK_PER_FLOOR,
    def: Math.floor(steps / GOBLIN_DEF_FLOORS),
    attackSpeed: GOBLIN_ATTACK_SPEED,
    critChance: GOBLIN_CRIT_CHANCE,
    exp: GOBLIN_BASE_EXP + steps * GOBLIN_EXP_PER_FLOOR,
    gold: GOBLIN_BASE_GOLD + steps * GOBLIN_GOLD_PER_FLOOR,
  }
}
