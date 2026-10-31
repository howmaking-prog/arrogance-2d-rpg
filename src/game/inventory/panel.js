import { BAG_CELL_SIZE, BAG_COLUMNS, BAG_FILTERS, BAG_ROWS, EQUIP_LEFT, EQUIP_RIGHT } from './constants.js'

const HERO_URL = 'src/character/player.png?v=5'
const HERO_FRAME = 64
const HERO_ROW = 10

// 첨부 화면처럼 가운데 캐릭터, 양옆 장착, 오른쪽 필터+가방 칸을 그린다.
export const createInventoryPanel = ({ onBagActivate, onEquipActivate }) => {
  const root = document.getElementById('inventory')
  const leftRoot = document.getElementById('equip-left')
  const rightRoot = document.getElementById('equip-right')
  const heroCanvas = document.getElementById('equip-hero-canvas')
  const bagRoot = document.getElementById('bag-grid')
  const filterRoot = document.getElementById('bag-filters')
  const goldLabel = document.getElementById('inventory-gold')
  const quickSkills = document.getElementById('inventory-quick-skills')
  let filter = 'all'
  let heroImage = null

  const ensureDom = () => {
    if (
      !(root instanceof HTMLElement)
      || !(leftRoot instanceof HTMLElement)
      || !(rightRoot instanceof HTMLElement)
      || !(bagRoot instanceof HTMLElement)
    ) {
      throw new Error('가방 창 요소를 찾을 수 없습니다.')
    }
  }

  const makeSlot = (slot) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = `equip-slot equip-${slot.id}`
    button.dataset.slot = slot.id
    button.setAttribute('aria-label', slot.label)
    const label = document.createElement('span')
    label.className = 'equip-slot-label'
    label.textContent = slot.label
    const canvas = document.createElement('canvas')
    canvas.width = 44
    canvas.height = 44
    canvas.className = 'equip-slot-icon'
    canvas.setAttribute('aria-hidden', 'true')
    button.append(label, canvas)
    return button
  }

  const buildEquip = () => {
    leftRoot.replaceChildren()
    rightRoot.replaceChildren()
    EQUIP_LEFT.forEach((slot) => leftRoot.appendChild(makeSlot(slot)))
    EQUIP_RIGHT.forEach((slot) => rightRoot.appendChild(makeSlot(slot)))
  }

  const buildFilters = () => {
    if (!(filterRoot instanceof HTMLElement)) {
      return
    }
    filterRoot.replaceChildren()
    BAG_FILTERS.forEach((entry) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'bag-filter'
      button.dataset.filter = entry.id
      button.textContent = entry.label
      button.setAttribute('aria-pressed', entry.id === filter ? 'true' : 'false')
      filterRoot.appendChild(button)
    })
  }

  const buildBag = () => {
    bagRoot.style.setProperty('--bag-cols', String(BAG_COLUMNS))
    bagRoot.style.setProperty('--bag-rows', String(BAG_ROWS))
    bagRoot.style.setProperty('--bag-cell', `${BAG_CELL_SIZE}px`)
    bagRoot.replaceChildren()
    for (let index = 0; index < BAG_COLUMNS * BAG_ROWS; index += 1) {
      const cell = document.createElement('div')
      cell.className = 'bag-cell'
      bagRoot.appendChild(cell)
    }
    const layer = document.createElement('div')
    layer.id = 'bag-items'
    layer.className = 'bag-items'
    bagRoot.appendChild(layer)
  }

  const buildQuickSkills = () => {
    if (!(quickSkills instanceof HTMLElement)) {
      return
    }
    quickSkills.replaceChildren()
    ;[
      { id: 'power-strike', name: '강타' },
      { id: 'heavy-strike', name: '일격' },
      { id: 'empty-a', name: '' },
      { id: 'empty-b', name: '' },
    ].forEach((skill) => {
      const slot = document.createElement('div')
      slot.className = 'quick-skill'
      slot.textContent = skill.name || '·'
      slot.title = skill.name ? `${skill.name} 스킬` : '빈 스킬 칸'
      quickSkills.appendChild(slot)
    })
  }

  const drawHero = () => {
    if (!(heroCanvas instanceof HTMLCanvasElement) || !heroImage) {
      return
    }
    const ctx = heroCanvas.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.clearRect(0, 0, heroCanvas.width, heroCanvas.height)
    ctx.imageSmoothingEnabled = false
    const scale = 2.2
    const size = HERO_FRAME * scale
    ctx.drawImage(
      heroImage,
      0,
      HERO_ROW * HERO_FRAME,
      HERO_FRAME,
      HERO_FRAME,
      (heroCanvas.width - size) / 2,
      (heroCanvas.height - size) / 2 + 8,
      size,
      size,
    )
  }

  // 카탈로그 PNG 전체를 칸 안에 맞춰 그린다.
  const drawIcon = (canvas, image) => {
    if (!(canvas instanceof HTMLCanvasElement) || !image || !image.complete || image.naturalWidth <= 0) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false
    const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * 0.88
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale
    ctx.drawImage(
      image,
      0,
      0,
      image.naturalWidth,
      image.naturalHeight,
      (canvas.width - width) / 2,
      (canvas.height - height) / 2,
      width,
      height,
    )
  }

  try {
    ensureDom()
    buildEquip()
    buildFilters()
    buildBag()
    buildQuickSkills()
    heroImage = new Image()
    heroImage.addEventListener('load', () => {
      drawHero()
    })
    heroImage.addEventListener('error', () => {
      console.error('장착 창 캐릭터 이미지 로드 실패', HERO_URL)
    })
    heroImage.src = HERO_URL

    filterRoot?.addEventListener('click', (event) => {
      try {
        if (!(event.target instanceof Element)) {
          return
        }
        const button = event.target.closest('[data-filter]')
        if (!(button instanceof HTMLElement) || !button.dataset.filter) {
          return
        }
        filter = button.dataset.filter
        filterRoot.querySelectorAll('[data-filter]').forEach((node) => {
          node.setAttribute('aria-pressed', node.dataset.filter === filter ? 'true' : 'false')
        })
        root.dispatchEvent(new CustomEvent('inventory-filter', { detail: { filter } }))
      } catch (error) {
        console.error('가방 필터 실패', error)
      }
    })

    root.addEventListener('click', (event) => {
      try {
        if (event.detail !== 2 || !(event.target instanceof Element)) {
          return
        }
        const bagItem = event.target.closest('[data-bag-id]')
        if (bagItem instanceof HTMLElement) {
          event.preventDefault()
          onBagActivate(bagItem.dataset.bagId)
          return
        }
        const equipSlot = event.target.closest('[data-slot]')
        if (equipSlot instanceof HTMLElement && equipSlot.dataset.slot) {
          event.preventDefault()
          onEquipActivate(equipSlot.dataset.slot)
        }
      } catch (error) {
        console.error('가방 조작 실패', error)
      }
    })
  } catch (error) {
    console.error('가방 창 준비 실패', error)
  }

  return {
    getFilter: () => filter,
    setGold: (amount) => {
      if (goldLabel instanceof HTMLElement) {
        goldLabel.textContent = String(Math.max(0, Math.floor(Number(amount) || 0)))
      }
    },
    render: ({ bagItems, equipment, getIconImage }) => {
      try {
        ensureDom()
        drawHero()
        const resolveIcon = typeof getIconImage === 'function' ? getIconImage : () => null
        ;[...EQUIP_LEFT, ...EQUIP_RIGHT].forEach((slot) => {
          const button = root.querySelector(`[data-slot="${slot.id}"]`)
          if (!(button instanceof HTMLElement)) {
            return
          }
          const item = equipment[slot.id] || null
          button.classList.toggle('filled', Boolean(item))
          button.title = item
            ? `${item.name}${item.description ? ` · ${item.description}` : ''} · 더블클릭하면 벗는다`
            : `${slot.label} · 비어 있음`
          const canvas = button.querySelector('canvas')
          if (canvas instanceof HTMLCanvasElement) {
            const ctx = canvas.getContext('2d')
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
            if (item?.iconPath) {
              drawIcon(canvas, resolveIcon(item.iconPath))
            }
          }
        })

        const layer = document.getElementById('bag-items')
        if (!(layer instanceof HTMLElement)) {
          return
        }
        layer.replaceChildren()
        bagItems.forEach((item) => {
          if (filter !== 'all' && item.kind !== filter) {
            return
          }
          const tile = document.createElement('button')
          tile.type = 'button'
          tile.className = `bag-item rarity-${item.rarity || 'common'}`
          tile.dataset.bagId = item.id
          tile.style.left = `${item.x * BAG_CELL_SIZE}px`
          tile.style.top = `${item.y * BAG_CELL_SIZE}px`
          tile.style.width = `${item.width * BAG_CELL_SIZE}px`
          tile.style.height = `${item.height * BAG_CELL_SIZE}px`
          tile.title = item.equipSlot
            ? `${item.name} · 더블클릭하면 장착`
            : `${item.name}${item.description ? ` · ${item.description}` : ''}`
          const canvas = document.createElement('canvas')
          canvas.width = BAG_CELL_SIZE
          canvas.height = BAG_CELL_SIZE
          canvas.setAttribute('aria-hidden', 'true')
          tile.appendChild(canvas)
          if (item.iconPath) {
            drawIcon(canvas, resolveIcon(item.iconPath))
          }
          layer.appendChild(tile)
        })
      } catch (error) {
        console.error('가방 창 표시 실패', error)
      }
    },
  }
}
