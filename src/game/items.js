import {
  CHEST_ITEMS,
  getItemDef,
  INITIAL_ITEM_IDS,
  pickRandomChestItem,
  sumEquipmentBonuses,
} from './inventory/catalog.js?v=27'
import { clearFromBag, createEmptyBag, findFreeSpot, placeOnBag } from './inventory/bagGrid.js?v=23'
import { emptyEquipment } from './inventory/constants.js?v=27'
import { createInventoryPanel } from './inventory/panel.js?v=27'

const CHEST_WIDTH = 88
const CHEST_HEIGHT = 68
const CHEST_REACH = 120
const DROP_ICON_SIZE = 40

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const containsPoint = (point, centerX, centerY, width, height) => (
  Math.abs(point.x - centerX) <= width / 2
  && Math.abs(point.y - centerY) <= height / 2
)

const drawChest = (ctx, chest) => {
  const left = chest.x - chest.width / 2
  const top = chest.y - chest.height / 2
  const bodyTop = top + 28
  const bodyHeight = chest.height - 28

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.beginPath()
  ctx.ellipse(chest.x, top + chest.height - 2, chest.width * 0.42, 9, 0, 0, Math.PI * 2)
  ctx.fill()

  const drawBody = () => {
    ctx.fillStyle = '#6b3f22'
    ctx.fillRect(left, bodyTop, chest.width, bodyHeight)
    ctx.fillStyle = '#8a552c'
    for (let plank = 0; plank < 4; plank += 1) {
      const plankX = left + 8 + plank * ((chest.width - 16) / 4)
      ctx.fillRect(plankX, bodyTop + 4, 3, bodyHeight - 8)
    }
    ctx.fillStyle = '#d7b15a'
    ctx.fillRect(left, bodyTop + 8, chest.width, 5)
    ctx.fillRect(left, bodyTop + bodyHeight - 10, chest.width, 5)
    ctx.fillStyle = '#8d7340'
    ctx.fillRect(left, bodyTop, 6, bodyHeight)
    ctx.fillRect(left + chest.width - 6, bodyTop, 6, bodyHeight)
  }

  const drawLid = (lifted) => {
    const lidTop = lifted ? top - 8 : top
    const lidHeight = lifted ? 22 : 30
    ctx.fillStyle = lifted ? '#4e311c' : '#5c3a22'
    ctx.beginPath()
    ctx.moveTo(left + 4, bodyTop)
    ctx.quadraticCurveTo(chest.x, lidTop, left + chest.width - 4, bodyTop)
    ctx.lineTo(left + chest.width - 8, bodyTop - (lifted ? 2 : 8))
    ctx.quadraticCurveTo(chest.x, lidTop + lidHeight * 0.2, left + 8, bodyTop - (lifted ? 2 : 8))
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#d7b15a'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(left + 10, bodyTop - 4)
    ctx.quadraticCurveTo(chest.x, lidTop + 8, left + chest.width - 10, bodyTop - 4)
    ctx.stroke()
  }

  if (!chest.open) {
    drawBody()
    drawLid(false)
    ctx.fillStyle = '#f0d48a'
    ctx.fillRect(chest.x - 7, bodyTop - 2, 14, 16)
    ctx.fillStyle = '#2a2118'
    ctx.beginPath()
    ctx.arc(chest.x, bodyTop + 8, 3, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  drawLid(true)
  drawBody()
  ctx.fillStyle = '#1a140f'
  ctx.fillRect(left + 8, bodyTop + 4, chest.width - 16, 14)
  ctx.fillStyle = '#e7c56a'
  ctx.fillRect(chest.x - 4, bodyTop + 8, 8, 5)
  ctx.fillStyle = '#f0d48a'
  ctx.fillRect(chest.x - 7, bodyTop + 16, 14, 10)
}

const drawDroppedLoot = (ctx, image, loot) => {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.beginPath()
  ctx.ellipse(loot.x, loot.y + 18, 18, 7, 0, 0, Math.PI * 2)
  ctx.fill()
  if (image?.complete && image.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      image,
      loot.x - DROP_ICON_SIZE / 2,
      loot.y - DROP_ICON_SIZE / 2,
      DROP_ICON_SIZE,
      DROP_ICON_SIZE,
    )
  } else {
    ctx.fillStyle = '#c9a45a'
    ctx.fillRect(loot.x - 12, loot.y - 12, 24, 24)
  }
  ctx.fillStyle = '#f4efe2'
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(loot.name, loot.x, loot.y + DROP_ICON_SIZE / 2 + 16)
}

// 보물상자, 바닥 드롭, 장착과 가방을 한곳에서 다룬다.
export const createFieldItems = (canvas, position, options = {}) => {
  const getFloor = typeof options.getFloor === 'function' ? options.getFloor : () => 1
  const chest = {
    x: position.x,
    y: position.y,
    width: CHEST_WIDTH,
    height: CHEST_HEIGHT,
    open: false,
  }
  console.log(`[상태] 보물상자 배치 | 위치 (${Math.round(chest.x)}, ${Math.round(chest.y)})`)
  let droppedLoot = null
  let nextItemId = 1
  let bagGrid = createEmptyBag()
  let bagItems = []
  let equipment = emptyEquipment()
  const equipListeners = []
  const iconCache = new Map()

  const loadIcon = (path) => {
    if (!path) {
      return null
    }
    if (iconCache.has(path)) {
      return iconCache.get(path)
    }
    const image = new Image()
    image.addEventListener('load', () => {
      refreshPanel()
    })
    image.addEventListener('error', () => {
      console.error('아이템 이미지 로드 실패', path)
    })
    image.src = path
    iconCache.set(path, image)
    return image
  }

  const makeBagItem = (def, spot) => {
    const id = `item-${nextItemId}`
    nextItemId += 1
    return {
      id,
      defId: def.id,
      name: def.name,
      kind: def.filterKind,
      equipSlot: def.equipSlot,
      description: def.description,
      stats: { ...(def.stats || {}) },
      consumableEffect: def.consumableEffect ? { ...def.consumableEffect } : null,
      width: def.width || 1,
      height: def.height || 1,
      rarity: def.rarity || 'common',
      iconPath: def.iconPath,
      x: spot.x,
      y: spot.y,
    }
  }

  const refreshPanel = () => {
    panel.render({
      bagItems,
      equipment,
      getIconImage: loadIcon,
    })
    equipListeners.forEach((listener) => listener())
  }

  const addDefToBag = (def) => {
    if (!def) {
      throw new Error('넣을 아이템이 없습니다.')
    }
    const spot = findFreeSpot(bagGrid, def.width || 1, def.height || 1)
    if (!spot) {
      throw new Error('가방에 자리가 없습니다.')
    }
    const item = makeBagItem(def, spot)
    bagGrid = placeOnBag(bagGrid, item.id, spot.x, spot.y, item.width, item.height)
    bagItems = [...bagItems, item]
    if (item.iconPath) {
      loadIcon(item.iconPath)
    }
    return item
  }

  const equipFromBag = (itemId) => {
    const item = bagItems.find((entry) => entry.id === itemId)
    if (!item?.equipSlot || item.equipSlot === 'gloves') {
      return
    }
    const slotId = item.equipSlot
    bagGrid = clearFromBag(bagGrid, item.id)
    bagItems = bagItems.filter((entry) => entry.id !== itemId)
    const previous = equipment[slotId]
    if (previous) {
      const spot = findFreeSpot(bagGrid, previous.width, previous.height)
      if (!spot) {
        bagGrid = placeOnBag(bagGrid, item.id, item.x, item.y, item.width, item.height)
        bagItems = [...bagItems, item]
        throw new Error('벗은 장비를 둘 가방 자리가 없습니다.')
      }
      bagGrid = placeOnBag(bagGrid, previous.id, spot.x, spot.y, previous.width, previous.height)
      bagItems = [...bagItems, { ...previous, x: spot.x, y: spot.y }]
    }
    equipment = { ...equipment, [slotId]: { ...item } }
    refreshPanel()
    console.log(`[상태] 장착 | ${item.name} → ${slotId}`)
  }

  const unequipSlot = (slotId) => {
    const item = equipment[slotId]
    if (!item) {
      return
    }
    const spot = findFreeSpot(bagGrid, item.width, item.height)
    if (!spot) {
      throw new Error('가방에 자리가 없어 장비를 벗을 수 없습니다.')
    }
    bagGrid = placeOnBag(bagGrid, item.id, spot.x, spot.y, item.width, item.height)
    bagItems = [...bagItems, { ...item, x: spot.x, y: spot.y }]
    equipment = { ...equipment, [slotId]: null }
    refreshPanel()
    console.log(`[상태] 장착 해제 | ${item.name}`)
  }

  const panel = createInventoryPanel({
    onBagActivate: (itemId) => {
      try {
        equipFromBag(itemId)
      } catch (error) {
        console.error('가방 장착 실패', error)
      }
    },
    onEquipActivate: (slotId) => {
      try {
        unequipSlot(slotId)
      } catch (error) {
        console.error('장비 해제 실패', error)
      }
    },
  })

  const openChest = () => {
    try {
      if (chest.open) {
        console.log('[상태] 이미 열린 보물상자')
        return
      }
      const floor = getFloor()
      const def = pickRandomChestItem(floor) || CHEST_ITEMS[0] || getItemDef('i-steel-sword')
      if (!def) {
        throw new Error('상자에서 꺼낼 아이템이 없습니다.')
      }
      chest.open = true
      droppedLoot = {
        x: chest.x,
        y: chest.y + chest.height / 2 + DROP_ICON_SIZE / 2 + 18,
        defId: def.id,
        name: def.name,
        iconPath: def.iconPath,
      }
      if (def.iconPath) {
        loadIcon(def.iconPath)
      }
      console.log(`[상태] 보물상자 오픈 | ${def.name}`)
    } catch (error) {
      console.error('보물상자 처리 실패', error)
    }
  }

  const storeSword = () => {
    try {
      if (!droppedLoot) {
        return
      }
      const def = getItemDef(droppedLoot.defId)
      if (!def) {
        throw new Error('떨어진 아이템 정의를 찾을 수 없습니다.')
      }
      addDefToBag(def)
      const name = droppedLoot.name
      droppedLoot = null
      refreshPanel()
      console.log(`[상태] 가방 보관 | ${name} | 가방 ${bagItems.length}개`)
    } catch (error) {
      console.error('인벤토리 저장 실패', error)
    }
  }

  const keepInside = () => {
    chest.x = clamp(chest.x, 48, Math.max(48, canvas.width - 48))
    chest.y = clamp(chest.y, 48, Math.max(48, canvas.height - 48))
    if (!droppedLoot) {
      return
    }
    droppedLoot.x = clamp(droppedLoot.x, 48, Math.max(48, canvas.width - 48))
    droppedLoot.y = clamp(droppedLoot.y, 72, Math.max(72, canvas.height - 48))
  }

  const captureFloor = () => ({
    x: chest.x,
    y: chest.y,
    open: chest.open,
    droppedSword: droppedLoot ? { ...droppedLoot } : null,
  })

  const applyFloor = (state) => {
    try {
      chest.x = state.x
      chest.y = state.y
      chest.open = Boolean(state.open)
      droppedLoot = state.droppedSword ? { ...state.droppedSword } : null
      if (droppedLoot?.iconPath) {
        loadIcon(droppedLoot.iconPath)
      }
      console.log(`[상태] 보물상자 배치 | 위치 (${Math.round(chest.x)}, ${Math.round(chest.y)})`)
    } catch (error) {
      console.error('층 보물상자 복원 실패', error)
    }
  }

  const inventoryRoot = document.getElementById('inventory')
  if (inventoryRoot instanceof HTMLElement) {
    inventoryRoot.addEventListener('inventory-filter', () => {
      refreshPanel()
    })
  }

  // 시작 장비·포션을 가방에 넣는다.
  INITIAL_ITEM_IDS.forEach((id) => {
    try {
      const def = getItemDef(id)
      if (def) {
        addDefToBag(def)
      }
    } catch (error) {
      console.error('시작 아이템 지급 실패', id, error)
    }
  })

  refreshPanel()

  return {
    openChest,
    storeSword,
    keepInside,
    captureFloor,
    applyFloor,
    setGold: (amount) => panel.setGold(amount),
    getEquipment: () => ({ ...equipment }),
    getEquippedBonuses: () => sumEquipmentBonuses(equipment),
    getSwordArt: () => {
      const weapon = equipment.weapon
      if (!weapon?.iconPath) {
        return { image: null, source: null }
      }
      return { image: loadIcon(weapon.iconPath), source: null }
    },
    // 아이콘형 무기는 LPC 스프라이트 레이어가 아니므로 필드 캐릭터에는 겹치지 않는다.
    getEquippedWeapon: () => null,
    getEquippedAttack: () => sumEquipmentBonuses(equipment).atk,
    getEquippedDefense: () => sumEquipmentBonuses(equipment).def,
    getIconImage: loadIcon,
    onEquipChange: (listener) => {
      equipListeners.push(listener)
    },
    hitChest: (point) => containsPoint(point, chest.x, chest.y, chest.width, chest.height),
    isChestInReach: (playerPoint) => Math.hypot(playerPoint.x - chest.x, playerPoint.y - chest.y) <= CHEST_REACH,
    isSwordInReach: (playerPoint) => {
      if (!droppedLoot) {
        return false
      }
      return Math.hypot(playerPoint.x - droppedLoot.x, playerPoint.y - droppedLoot.y) <= CHEST_REACH
    },
    hitDroppedSword: (point) => {
      if (!droppedLoot) {
        return false
      }
      return containsPoint(point, droppedLoot.x, droppedLoot.y, DROP_ICON_SIZE + 16, DROP_ICON_SIZE + 28)
    },
    draw: (ctx) => {
      drawChest(ctx, chest)
      if (droppedLoot) {
        drawDroppedLoot(ctx, loadIcon(droppedLoot.iconPath), droppedLoot)
      }
    },
  }
}
