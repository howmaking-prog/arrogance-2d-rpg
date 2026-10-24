import { COMBAT_SKILLS } from './skills.js'

const BAR_LERP = 8
const FLOAT_RISE = 48

const barWidth = (shown, max) => {
  if (max <= 0) {
    return '0%'
  }
  return `${Math.max(0, Math.min(100, (shown / max) * 100))}%`
}

// 체력과 마나 막대, 스킬 버튼, 승리와 패배 창을 필드 위에 올린다.
export const createCombatView = ({ onSkill, onNextFloor, onRestart }) => {
  const root = document.getElementById('combat')
  const result = document.getElementById('combat-result')
  const playerHp = document.getElementById('combat-player-hp')
  const playerMp = document.getElementById('combat-player-mp')
  const monsterHp = document.getElementById('combat-monster-hp')
  const playerLabel = document.getElementById('combat-player-label')
  const monsterLabel = document.getElementById('combat-monster-label')
  const skills = document.getElementById('combat-skill-list')
  const title = document.getElementById('combat-result-title')
  const body = document.getElementById('combat-result-body')
  const nextButton = document.getElementById('combat-next')
  const restartButton = document.getElementById('combat-restart')
  const shown = { playerHp: 0, playerMp: 0, monsterHp: 0 }

  try {
    if (!(skills instanceof HTMLElement)) {
      throw new Error('전투 스킬 버튼을 찾을 수 없습니다.')
    }
    skills.replaceChildren()
    COMBAT_SKILLS.forEach((skill) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.dataset.skill = skill.id
      button.textContent = `${skill.name} ${skill.mpCost}`
      skills.appendChild(button)
    })
    skills.addEventListener('click', (event) => {
      try {
        if (!(event.target instanceof Element)) {
          return
        }
        const button = event.target.closest('[data-skill]')
        const skillId = button instanceof HTMLElement ? button.dataset.skill : ''
        if (skillId) {
          onSkill(skillId)
        }
      } catch (error) {
        console.error('전투 스킬 처리 실패', error)
      }
    })
    nextButton?.addEventListener('click', () => {
      try {
        onNextFloor()
      } catch (error) {
        console.error('다음 층 이동 실패', error)
      }
    })
    restartButton?.addEventListener('click', () => {
      try {
        onRestart()
      } catch (error) {
        console.error('재시작 실패', error)
      }
    })
  } catch (error) {
    console.error('전투 창 준비 실패', error)
  }

  const setOpen = (open) => {
    if (root instanceof HTMLElement) {
      root.hidden = !open
    }
  }

  return {
    setOpen,
    hideResult: () => {
      if (result instanceof HTMLElement) {
        result.hidden = true
      }
    },
    showVictory: (reward) => {
      if (!(result instanceof HTMLElement) || !(title instanceof HTMLElement) || !(body instanceof HTMLElement)) {
        return
      }
      title.textContent = '승리'
      body.textContent = `경험치 ${reward.exp}, 골드 ${reward.gold}을 얻었다.`
      if (nextButton instanceof HTMLElement) {
        nextButton.hidden = false
      }
      if (restartButton instanceof HTMLElement) {
        restartButton.hidden = true
      }
      result.hidden = false
    },
    showDefeat: () => {
      if (!(result instanceof HTMLElement) || !(title instanceof HTMLElement) || !(body instanceof HTMLElement)) {
        return
      }
      title.textContent = '패배'
      body.textContent = '쓰러졌다. 다시 도전할 수 있다.'
      if (nextButton instanceof HTMLElement) {
        nextButton.hidden = true
      }
      if (restartButton instanceof HTMLElement) {
        restartButton.hidden = false
      }
      result.hidden = false
    },
    sync: (dt, state) => {
      if (!state.player || !state.monster) {
        return
      }
      const blend = Math.min(1, dt * BAR_LERP)
      shown.playerHp += (state.player.hp - shown.playerHp) * blend
      shown.playerMp += (state.player.mp - shown.playerMp) * blend
      shown.monsterHp += (state.monster.hp - shown.monsterHp) * blend
      if (playerHp instanceof HTMLElement) {
        playerHp.style.width = barWidth(shown.playerHp, state.player.maxHp)
      }
      if (playerMp instanceof HTMLElement) {
        playerMp.style.width = barWidth(shown.playerMp, state.player.maxMp)
      }
      if (monsterHp instanceof HTMLElement) {
        monsterHp.style.width = barWidth(shown.monsterHp, state.monster.maxHp)
      }
      if (playerLabel instanceof HTMLElement) {
        playerLabel.textContent = `HP ${Math.ceil(state.player.hp)} / ${Math.ceil(state.player.maxHp)}  MP ${Math.ceil(state.player.mp)}`
      }
      if (monsterLabel instanceof HTMLElement) {
        monsterLabel.textContent = `${state.monster.name} ${Math.ceil(state.monster.hp)} / ${Math.ceil(state.monster.maxHp)}`
      }
      if (skills instanceof HTMLElement) {
        skills.querySelectorAll('[data-skill]').forEach((button) => {
          const skill = COMBAT_SKILLS.find((item) => item.id === button.dataset.skill)
          button.disabled = !skill || state.player.mp < skill.mpCost || state.status !== 'fighting'
        })
      }
    },
    resetBars: (state) => {
      shown.playerHp = state.player?.hp || 0
      shown.playerMp = state.player?.mp || 0
      shown.monsterHp = state.monster?.maxHp || 0
    },
    drawFloats: (ctx, points) => {
      points.forEach((item) => {
        const progress = item.age / item.life
        ctx.globalAlpha = 1 - progress
        ctx.fillStyle = item.crit ? '#ff5a4a' : '#f6e27a'
        ctx.font = item.crit ? 'bold 20px sans-serif' : 'bold 16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(item.text, item.x, item.y - progress * FLOAT_RISE)
        ctx.globalAlpha = 1
      })
    },
  }
}
