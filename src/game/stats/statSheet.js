import { BASE_STAT, STAT_POINT_CAP } from './constants.js'

const STAT_LABEL = {
  str: '힘',
  agi: '민첩',
  vit: '체력',
  int: '지능',
}

const PRIMARY_LABEL = {
  str: '힘 계열',
  agi: '민첩 계열',
  int: '지능 계열',
}

const formatValue = (value) => {
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) {
    return String(rounded)
  }
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

// 정보 창에 스탯 배분과 계산된 능력치를 그린다.
export const createStatSheet = (progression, getGear) => {
  const root = document.getElementById('stat-sheet')
  if (!(root instanceof HTMLElement)) {
    throw new Error('스탯 창을 찾을 수 없습니다.')
  }

  const refresh = () => {
    try {
      progression.setGear(getGear())
      const state = progression.getState()
      const derived = state.derived
      const statRows = Object.entries(STAT_LABEL).map(([key, label]) => `
        <div class="stat-row">
          <span>${label}</span>
          <span>
            <button type="button" data-stat="${key}" data-delta="-1" ${state.stats[key] <= BASE_STAT ? 'disabled' : ''}>−</button>
            <strong>${state.stats[key]}</strong>
            <button type="button" data-stat="${key}" data-delta="1" ${state.unspent < 1 ? 'disabled' : ''}>+</button>
          </span>
        </div>
      `).join('')
      const classButtons = Object.entries(PRIMARY_LABEL).map(([key, label]) => `
        <button type="button" data-primary="${key}" aria-pressed="${state.primaryStat === key ? 'true' : 'false'}">${label}</button>
      `).join('')

      root.innerHTML = `
        <p class="stat-points">남은 포인트 ${state.unspent} · 합계 ${state.ownedPoints}/${STAT_POINT_CAP}</p>
        <div class="class-row">${classButtons}</div>
        ${statRows}
        <div class="derived-list">
          <p>최대 HP ${formatValue(derived.maxHp)}</p>
          <p>최대 MP ${formatValue(derived.maxMp)}</p>
          <p>공격력 ${formatValue(derived.totalAtk)}</p>
          <p>방어력 ${formatValue(derived.totalDef)}</p>
          <p>공격 속도 ${formatValue(derived.attackSpeed)}</p>
          <p>치명타 ${formatValue(derived.critChancePercent)}%</p>
        </div>
        <p class="stat-note">시작 포인트 50. 4층을 지날 때마다 1포인트. 힘·민첩·체력·지능과 남은 포인트의 합은 200을 넘지 않습니다.</p>
      `
    } catch (error) {
      console.error('스탯 창 표시 실패', error)
    }
  }

  root.addEventListener('click', (event) => {
    try {
      if (!(event.target instanceof Element)) {
        return
      }
      const button = event.target.closest('button')
      if (!(button instanceof HTMLButtonElement) || button.disabled) {
        return
      }
      const primary = button.dataset.primary
      if (primary) {
        progression.setPrimaryStat(primary)
      } else if (button.dataset.stat) {
        progression.allocate(button.dataset.stat, Number(button.dataset.delta))
      }
      refresh()
    } catch (error) {
      console.error('스탯 배분 실패', error)
    }
  })

  refresh()
  return { refresh }
}
