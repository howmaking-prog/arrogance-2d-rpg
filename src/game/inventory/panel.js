import { BAG_CELL_SIZE, BAG_COLUMNS, BAG_ROWS, EQUIP_SLOTS } from './constants.js'

// 디아블로 2처럼 왼쪽 장착, 오른쪽 가방 칸을 그린다.
export const createInventoryPanel = ({ onBagActivate, onEquipActivate }) => {
  const root = document.getElementById('inventory')
  const equipRoot = document.getElementById('equip-panel')
  const bagRoot = document.getElementById('bag-grid')
  const goldLabel = document.getElementById('inventory-gold')

  const ensureDom = () => {
    if (!(root instanceof HTMLElement) || !(equipRoot instanceof HTMLElement) || !(bagRoot instanceof HTMLElement)) {
      throw new Error('가방 창 요소를 찾을 수 없습니다.')
    }
  }

  const buildEquip = () => {
    equipRoot.replaceChildren()
    EQUIP_SLOTS.forEach((slot) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = `equip-slot equip-${slot.id}`
      button.dataset.slot = slot.id
      button.setAttribute('aria-label', slot.label)
      const label = document.createElement('span')
      label.className = 'equip-slot-label'
      label.textContent = slot.label
      const canvas = document.createElement('canvas')
      canvas.width = slot.id === 'weapon' || slot.id === 'offhand' || slot.id === 'torso' ? 44 : 36
      canvas.height = slot.id === 'weapon' || slot.id === 'offhand' || slot.id === 'torso' ? 72 : 36
      canvas.className = 'equip-slot-icon'
      canvas.setAttribute('aria-hidden', 'true')
      button.append(label, canvas)
      equipRoot.appendChild(button)
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
      cell.dataset.index = String(index)
      bagRoot.appendChild(cell)
    }
    const layer = document.createElement('div')
    layer.id = 'bag-items'
    layer.className = 'bag-items'
    bagRoot.appendChild(layer)
  }

  try {
    ensureDom()
    buildEquip()
    buildBag()
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

  const drawIcon = (canvas, image, source) => {
    if (!(canvas instanceof HTMLCanvasElement) || !image || !source) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false
    const scale = Math.min(canvas.width / source.width, canvas.height / source.height)
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

  return {
    setGold: (amount) => {
      if (goldLabel instanceof HTMLElement) {
        goldLabel.textContent = String(Math.max(0, Math.floor(Number(amount) || 0)))
      }
    },
    render: ({ bagItems, equipment, swordImage, swordSource }) => {
      try {
        ensureDom()
        EQUIP_SLOTS.forEach((slot) => {
          const button = equipRoot.querySelector(`[data-slot="${slot.id}"]`)
          if (!(button instanceof HTMLElement)) {
            return
          }
          const item = equipment[slot.id] || null
          button.classList.toggle('filled', Boolean(item))
          button.title = item
            ? `${item.name} · 더블클릭하면 벗는다`
            : `${slot.label} · 비어 있음`
          const canvas = button.querySelector('canvas')
          if (canvas instanceof HTMLCanvasElement) {
            const ctx = canvas.getContext('2d')
            ctx?.clearRect(0, 0, canvas.width, canvas.height)
            if (item && item.name === '놋쇠검') {
              drawIcon(canvas, swordImage, swordSource)
            }
          }
        })

        const layer = document.getElementById('bag-items')
        if (!(layer instanceof HTMLElement)) {
          return
        }
        layer.replaceChildren()
        bagItems.forEach((item) => {
          const tile = document.createElement('button')
          tile.type = 'button'
          tile.className = 'bag-item'
          tile.dataset.bagId = item.id
          tile.style.left = `${item.x * BAG_CELL_SIZE}px`
          tile.style.top = `${item.y * BAG_CELL_SIZE}px`
          tile.style.width = `${item.width * BAG_CELL_SIZE}px`
          tile.style.height = `${item.height * BAG_CELL_SIZE}px`
          tile.title = `${item.name} · 더블클릭하면 장착`
          const canvas = document.createElement('canvas')
          canvas.width = item.width * BAG_CELL_SIZE
          canvas.height = item.height * BAG_CELL_SIZE
          canvas.setAttribute('aria-hidden', 'true')
          tile.appendChild(canvas)
          if (item.name === '놋쇠검') {
            drawIcon(canvas, swordImage, swordSource)
          }
          layer.appendChild(tile)
        })
      } catch (error) {
        console.error('가방 창 표시 실패', error)
      }
    },
  }
}
