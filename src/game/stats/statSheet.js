import { COMBAT_SKILLS } from '../combat/skills.js?v=27'
import { BASE_STAT, STAT_POINT_CAP } from './constants.js?v=27'

const HERO_NAME = '방랑자'
const HERO_META = 'HUMAN / MALE / 방랑자'

const STAT_ORDER = [
  { key: 'str', label: 'STR' },
  { key: 'int', label: 'INT' },
  { key: 'agi', label: 'AGI' },
  { key: 'vit', label: 'VIT' },
]

const PRIMARY_LABEL = {
  str: '힘 계열',
  agi: '민첩 계열',
  int: '지능 계열',
}

// 오만의 탑 프로필처럼 3열 장비 칸. ring2는 귀걸이 자리로 보여 준다.
const PROFILE_GEAR = {
  left: [
    { id: 'weapon', label: 'WEAPON', mark: 'W', shape: 'tall' },
    { id: 'gloves', label: 'GLOVES', mark: 'G', shape: '' },
    { id: 'ring1', label: 'RING', mark: 'R', shape: '' },
  ],
  center: [
    { id: 'head', label: 'HELMET', mark: 'H', shape: '' },
    { id: 'torso', label: 'ARMOR', mark: 'A', shape: 'tall' },
    { id: 'belt', label: 'BELT', mark: 'B', shape: 'wide' },
    { id: 'boots', label: 'BOOTS', mark: 'S', shape: '' },
  ],
  right: [
    { id: 'offhand', label: 'SHIELD', mark: 'SH', shape: 'tall' },
    { id: 'amulet', label: 'NECKLACE', mark: 'N', shape: '' },
    { id: 'earring', label: 'EARRING', mark: 'E', shape: '' },
  ],
}

const formatValue = (value) => {
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) {
    return String(rounded)
  }
  return rounded.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

const drawItemIcon = (canvas, image, source) => {
  if (!(canvas instanceof HTMLCanvasElement) || !image || !source) {
    return
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = false
  const scale = Math.min(canvas.width / source.width, canvas.height / source.height) * 0.9
  const width = source.width * scale
  const height = source.height * scale
  ctx.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    (canvas.width - width) / 2,
    (canvas.height - height) / 2,
    width,
    height,
  )
}

const gearColumnHtml = (slots, equipment) => slots.map((slot) => {
  const item = equipment?.[slot.id] || null
  const filled = item ? 'filled' : ''
  return `
    <div class="profile-gear-slot">
      <span>${slot.label}</span>
      <div class="profile-gear-frame ${slot.shape} ${filled}" data-profile-slot="${slot.id}" title="${item ? item.name : `${slot.label} 비어 있음`}">
        ${item ? '<canvas width="64" height="64" aria-hidden="true"></canvas>' : slot.mark}
      </div>
    </div>
  `
}).join('')

// 정보 창을 오만의 탑 캐릭터 프로필처럼 능력치·장비 화면으로 그린다.
export const createStatSheet = (progression, getContext) => {
  const root = document.getElementById('stat-sheet')
  if (!(root instanceof HTMLElement)) {
    throw new Error('스탯 창을 찾을 수 없습니다.')
  }

  const refresh = () => {
    try {
      const context = typeof getContext === 'function' ? getContext() : {}
      progression.setGear({
        weaponAtk: context.weaponAtk || 0,
        armorDef: context.armorDef || 0,
        bonus: context.bonus || {},
      })
      const state = progression.getState()
      const derived = state.derived
      const equipment = context.equipment || {}
      const gold = Math.max(0, Math.floor(Number(context.gold) || 0))
      const level = Math.max(1, Math.floor(Number(context.level) || 1))
      const classButtons = Object.entries(PRIMARY_LABEL).map(([key, label]) => `
        <button type="button" data-primary="${key}" aria-pressed="${state.primaryStat === key ? 'true' : 'false'}">${label}</button>
      `).join('')
      const statRows = STAT_ORDER.map(({ key, label }) => `
        <div class="profile-stat-row">
          <span>${label}</span>
          <div class="profile-stat-controls">
            <button type="button" data-stat="${key}" data-delta="-1" ${state.stats[key] <= BASE_STAT ? 'disabled' : ''}>−</button>
            <strong>${state.stats[key]}</strong>
            <button type="button" data-stat="${key}" data-delta="1" ${state.unspent < 1 ? 'disabled' : ''}>+</button>
          </div>
        </div>
      `).join('')
      const skillCards = COMBAT_SKILLS.map((skill, index) => `
        <div class="profile-skill">
          <div class="profile-skill-top">
            <div class="profile-skill-name">${skill.name}</div>
            <div class="profile-skill-key">Key: ${index + 1}</div>
          </div>
          <div class="profile-skill-desc">${skill.description}</div>
          <div class="profile-skill-meta">MP: ${skill.mpCost} · 배수 x${skill.multiplier}</div>
        </div>
      `).join('')

      root.innerHTML = `
        <div class="profile-left">
          <div>
            <p class="profile-name">
              ${HERO_NAME}
              <span class="profile-title">[${PRIMARY_LABEL[state.primaryStat] || '방랑자'}]</span>
            </p>
            <p class="profile-meta">${HERO_META}</p>
          </div>
          <div class="profile-resource-grid">
            <div class="profile-card">
              <div class="profile-label">Current Gold</div>
              <div class="profile-gold">${gold} GOLD</div>
            </div>
            <div class="profile-card">
              <div class="profile-label">Level</div>
              <div class="profile-level">${level} LV</div>
            </div>
          </div>
          <div class="profile-card">
            <div class="profile-label">Combat Power</div>
            <div class="profile-combat-grid">
              <div>
                <div class="profile-label">Total Attack</div>
                <div class="profile-atk">${formatValue(derived.totalAtk)}</div>
              </div>
              <div>
                <div class="profile-label">Total Defense</div>
                <div class="profile-def">${formatValue(derived.totalDef)}</div>
              </div>
            </div>
          </div>
          <div class="profile-card">
            <div class="profile-stat-head">
              <div class="profile-label profile-label-inline">Primary Stats</div>
              <div class="profile-points">남은 포인트 ${state.unspent}</div>
            </div>
            <div class="profile-class-row">${classButtons}</div>
            ${statRows}
            <div class="profile-derived">
              HP ${formatValue(derived.maxHp)} · MP ${formatValue(derived.maxMp)} ·
              공속 ${formatValue(derived.attackSpeed)} · 치명 ${formatValue(derived.critChancePercent)}%
              · 합계 ${state.ownedPoints}/${STAT_POINT_CAP}
            </div>
          </div>
          <div class="profile-card">
            <div class="profile-label">Learned Skills</div>
            ${skillCards}
          </div>
          <p class="profile-note">시작 포인트 20. 4층을 지날 때마다 1포인트. 힘·민첩·체력·지능과 남은 포인트의 합은 200을 넘지 않습니다. 장비 장착·해제는 가방 창에서 합니다.</p>
        </div>
        <div class="profile-right">
          <div class="profile-card">
            <div class="profile-gear-title">Current Gear</div>
            <div class="profile-gear-grid">
              <div class="profile-gear-col">${gearColumnHtml(PROFILE_GEAR.left, equipment)}</div>
              <div class="profile-gear-col">${gearColumnHtml(PROFILE_GEAR.center, equipment)}</div>
              <div class="profile-gear-col">${gearColumnHtml(PROFILE_GEAR.right, equipment)}</div>
            </div>
          </div>
        </div>
      `

      const resolveIcon = typeof context.getIconImage === 'function'
        ? context.getIconImage
        : () => null
      root.querySelectorAll('[data-profile-slot]').forEach((frame) => {
        if (!(frame instanceof HTMLElement)) {
          return
        }
        const item = equipment[frame.dataset.profileSlot]
        const canvas = frame.querySelector('canvas')
        if (item?.iconPath && canvas instanceof HTMLCanvasElement) {
          const image = resolveIcon(item.iconPath)
          if (image?.complete && image.naturalWidth > 0) {
            drawItemIcon(canvas, image, {
              x: 0,
              y: 0,
              width: image.naturalWidth,
              height: image.naturalHeight,
            })
          }
        }
      })
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
      } else {
        return
      }
      refresh()
    } catch (error) {
      console.error('스탯 배분 실패', error)
    }
  })

  refresh()
  return { refresh }
}
