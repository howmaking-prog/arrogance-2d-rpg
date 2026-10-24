import { calculateDamage } from '../stats/damage.js'
import { skillById } from './skills.js'

const MIN_ATTACK_SPEED = 0.1
const FLOAT_LIFE = 0.75
const FLASH_TIME = 0.12
const MAX_SWINGS_PER_TICK = 4

const attackInterval = (attackSpeed) => 1 / Math.max(attackSpeed, MIN_ATTACK_SPEED)

const copyFighter = (source) => ({
  name: source.name,
  hp: source.hp ?? source.maxHp,
  maxHp: source.maxHp,
  mp: source.mp ?? source.maxMp ?? 0,
  maxMp: source.maxMp ?? 0,
  atk: source.atk,
  def: source.def,
  attackSpeed: source.attackSpeed,
  critChance: source.critChance,
  cooldown: 0,
})

// 플레이어와 몬스터가 공격 속도마다 자동으로 때리고, 스킬은 마나를 쓴다.
export const createCombatManager = ({ getPlayer, random = Math.random } = {}) => {
  let status = 'idle'
  let player = null
  let monster = null
  let reward = null
  let pendingResult = null
  let playerFlash = 0
  let monsterFlash = 0
  const floats = []

  const snapshot = () => ({
    status,
    reward,
    player: player ? { ...player } : null,
    monster: monster ? { ...monster } : null,
    playerFlash: playerFlash > 0 ? player.flashKind : null,
    monsterFlash: monsterFlash > 0 ? monster.flashKind : null,
    floats: floats.map((item) => ({ ...item })),
  })

  const pushFloat = (target, damage, crit) => {
    floats.push({
      target,
      text: crit ? `${damage} 치명타` : String(damage),
      crit,
      age: 0,
      life: FLOAT_LIFE,
    })
  }

  const strike = (attacker, target, targetName, multiplier) => {
    try {
      const crit = random() < attacker.critChance
      const damage = calculateDamage(attacker.atk * multiplier, target.def, crit)
      target.hp = Math.max(0, target.hp - damage)
      target.flashKind = crit ? 'crit' : 'hit'
      if (targetName === 'player') {
        playerFlash = FLASH_TIME
      } else {
        monsterFlash = FLASH_TIME
      }
      pushFloat(targetName, damage, crit)
      return { damage, crit }
    } catch (error) {
      console.error('전투 피해 계산 실패', error)
      return null
    }
  }

  const finishIfNeeded = () => {
    if (status !== 'fighting') {
      return
    }
    if (monster.hp <= 0) {
      status = 'victory'
      pendingResult = { result: 'victory', reward }
      return
    }
    if (player.hp <= 0) {
      status = 'defeat'
      pendingResult = { result: 'defeat', reward: null }
    }
  }

  const swing = (attacker, target, targetName, multiplier) => {
    const hit = strike(attacker, target, targetName, multiplier)
    finishIfNeeded()
    return hit
  }

  return {
    start: (monsterProfile) => {
      try {
        const stats = getPlayer()
        player = copyFighter({ ...stats, name: '플레이어' })
        monster = copyFighter({ ...monsterProfile, hp: monsterProfile.maxHp, mp: 0, maxMp: 0 })
        reward = { exp: monsterProfile.exp, gold: monsterProfile.gold }
        status = 'fighting'
        pendingResult = null
        playerFlash = 0
        monsterFlash = 0
        floats.length = 0
        return snapshot()
      } catch (error) {
        console.error('전투 시작 실패', error)
        status = 'idle'
        return snapshot()
      }
    },
    isFighting: () => status === 'fighting',
    isBusy: () => status === 'fighting' || status === 'victory' || status === 'defeat',
    update: (dt) => {
      if (status !== 'fighting' || !Number.isFinite(dt) || dt < 0) {
        return snapshot()
      }
      try {
        const stats = getPlayer()
        player.maxHp = stats.maxHp
        player.maxMp = stats.maxMp
        player.hp = Math.min(player.hp, player.maxHp)
        player.mp = Math.min(player.mp, player.maxMp)
        player.atk = stats.atk
        player.def = stats.def
        player.attackSpeed = stats.attackSpeed
        player.critChance = stats.critChance

        player.cooldown += dt
        monster.cooldown += dt
        playerFlash = Math.max(0, playerFlash - dt)
        monsterFlash = Math.max(0, monsterFlash - dt)
        for (let index = floats.length - 1; index >= 0; index -= 1) {
          floats[index].age += dt
          if (floats[index].age >= floats[index].life) {
            floats.splice(index, 1)
          }
        }
        let swings = 0
        while (status === 'fighting' && player.cooldown >= attackInterval(player.attackSpeed) && swings < MAX_SWINGS_PER_TICK) {
          player.cooldown -= attackInterval(player.attackSpeed)
          swing(player, monster, 'monster', 1)
          swings += 1
        }
        swings = 0
        while (status === 'fighting' && monster.cooldown >= attackInterval(monster.attackSpeed) && swings < MAX_SWINGS_PER_TICK) {
          monster.cooldown -= attackInterval(monster.attackSpeed)
          swing(monster, player, 'player', 1)
          swings += 1
        }
      } catch (error) {
        console.error('전투 진행 실패', error)
      }
      return snapshot()
    },
    useSkill: (skillId) => {
      try {
        if (status !== 'fighting') {
          return { ok: false, reason: '전투 중이 아닙니다.' }
        }
        const skill = skillById(skillId)
        if (!skill) {
          return { ok: false, reason: '스킬을 찾을 수 없습니다.' }
        }
        if (player.mp < skill.mpCost) {
          return { ok: false, reason: '마나가 부족합니다.' }
        }
        player.mp -= skill.mpCost
        const hit = swing(player, monster, 'monster', skill.multiplier)
        return { ok: Boolean(hit), ...hit, mp: player.mp }
      } catch (error) {
        console.error('스킬 사용 실패', error)
        return { ok: false, reason: '스킬 사용에 실패했습니다.' }
      }
    },
    takeResult: () => {
      const result = pendingResult
      pendingResult = null
      return result
    },
    exportVitals: () => (player ? { hp: player.hp, mp: player.mp } : null),
    end: () => {
      const vitals = player ? { hp: player.hp, mp: player.mp } : null
      status = 'idle'
      player = null
      monster = null
      reward = null
      pendingResult = null
      floats.length = 0
      return vitals
    },
    getSnapshot: snapshot,
  }
}
