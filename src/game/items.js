import { BRASS_SWORD_ATK } from './stats/constants.js'

// 상자와 떨어진 아이템에 손을 뻗을 수 있는 거리. 좌표는 중심이다.
const CHEST_WIDTH = 88
const CHEST_HEIGHT = 68
const CHEST_REACH = 120

// 걷기 아래 방향 첫 칸에 있는 놋쇠검만 잘라 바닥 아이템으로 쓴다.
const SWORD_URL = 'src/item/weapon/Sword_brass.png'
const SWORD_SOURCE = { x: 25, y: 686, width: 20, height: 11 }
const SWORD_SCALE = 2
const SWORD_NAME = '놋쇠검'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const swordDrawSize = () => ({
  width: SWORD_SOURCE.width * SWORD_SCALE,
  height: SWORD_SOURCE.height * SWORD_SCALE,
})

const containsPoint = (point, centerX, centerY, width, height) => (
  Math.abs(point.x - centerX) <= width / 2
  && Math.abs(point.y - centerY) <= height / 2
)

// 나무결과 쇠테, 자물쇠가 있는 상자를 그린다. 열리면 뚜껑이 뒤로 젖혀진다.
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

const drawDroppedSword = (ctx, image, item) => {
  const size = swordDrawSize()
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    image,
    SWORD_SOURCE.x,
    SWORD_SOURCE.y,
    SWORD_SOURCE.width,
    SWORD_SOURCE.height,
    item.x - size.width / 2,
    item.y - size.height / 2,
    size.width,
    size.height,
  )
  ctx.fillStyle = '#f4efe2'
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(SWORD_NAME, item.x, item.y + size.height / 2 + 16)
}

// 보물상자, 바닥의 놋쇠검, 인벤토리 표시를 한곳에서 다룬다.
export const createFieldItems = (canvas, position) => {
  const chest = {
    x: position.x,
    y: position.y,
    width: CHEST_WIDTH,
    height: CHEST_HEIGHT,
    open: false,
  }
  console.log(`[상태] 보물상자 배치 | 위치 (${Math.round(chest.x)}, ${Math.round(chest.y)})`)
  let droppedSword = null
  let swordReady = false
  let equipped = false
  const inventory = []
  const equipListeners = []

  const swordImage = new Image()
  swordImage.addEventListener('load', () => {
    try {
      const minWidth = SWORD_SOURCE.x + SWORD_SOURCE.width
      const minHeight = SWORD_SOURCE.y + SWORD_SOURCE.height
      if (swordImage.naturalWidth < minWidth || swordImage.naturalHeight < minHeight) {
        throw new Error('놋쇠검 이미지가 자를 영역보다 작습니다.')
      }
      swordReady = true
      console.log(`[상태] 놋쇠검 로드 | ${swordImage.naturalWidth}x${swordImage.naturalHeight}`)
    } catch (error) {
      console.error('놋쇠검 검증 실패', error)
    }
  })
  swordImage.addEventListener('error', () => {
    console.error('놋쇠검 이미지 로드 실패', SWORD_URL)
  })
  swordImage.src = SWORD_URL

  const emptyLabel = document.getElementById('inventory-empty')
  const inventoryItem = document.getElementById('inventory-item')
  const swordIcon = document.getElementById('sword-icon')

  // 인벤토리에 넣은 놋쇠검을 칸 안에 다시 그린다.
  const renderInventory = () => {
    try {
      const hasSword = inventory.some((item) => item.name === SWORD_NAME)
      if (!(emptyLabel instanceof HTMLElement) || !(inventoryItem instanceof HTMLElement)) {
        throw new Error('인벤토리 요소를 찾을 수 없습니다.')
      }
      emptyLabel.hidden = hasSword
      inventoryItem.hidden = !hasSword
      inventoryItem.classList.toggle('equipped', hasSword && equipped)
      inventoryItem.title = equipped ? '더블클릭하면 장착을 해제합니다.' : '더블클릭하면 장착합니다.'
      const label = inventoryItem.querySelector('span')
      if (label) {
        label.textContent = equipped ? `${SWORD_NAME} · 장착` : SWORD_NAME
      }
      if (!hasSword || !(swordIcon instanceof HTMLCanvasElement)) {
        return
      }
      const iconCtx = swordIcon.getContext('2d')
      if (!iconCtx) {
        throw new Error('인벤토리 칸을 그릴 수 없습니다.')
      }
      iconCtx.clearRect(0, 0, swordIcon.width, swordIcon.height)
      iconCtx.imageSmoothingEnabled = false
      iconCtx.drawImage(
        swordImage,
        SWORD_SOURCE.x,
        SWORD_SOURCE.y,
        SWORD_SOURCE.width,
        SWORD_SOURCE.height,
        0,
        0,
        swordIcon.width,
        swordIcon.height,
      )
    } catch (error) {
      console.error('인벤토리 표시 실패', error)
    }
  }

  // 상자를 열면 놋쇠검을 상자 앞 바닥에 한 번만 떨어뜨린다.
  const openChest = () => {
    try {
      if (chest.open) {
        console.log('[상태] 이미 열린 보물상자')
        return
      }
      if (!swordReady) {
        throw new Error('놋쇠검 이미지를 아직 불러오지 못했습니다.')
      }
      const size = swordDrawSize()
      chest.open = true
      droppedSword = {
        x: chest.x,
        y: chest.y + chest.height / 2 + size.height / 2 + 18,
        name: SWORD_NAME,
      }
      console.log(`[상태] 보물상자 오픈 | ${SWORD_NAME}이 바닥에 떨어졌습니다.`)
    } catch (error) {
      console.error('보물상자 처리 실패', error)
    }
  }

  // 인벤토리의 검을 더블클릭하면 장착하고, 다시 더블클릭하면 해제한다.
  const equipSword = () => {
    try {
      const hasSword = inventory.some((item) => item.name === SWORD_NAME)
      if (!hasSword) {
        return
      }
      equipped = !equipped
      renderInventory()
      equipListeners.forEach((listener) => listener())
      console.log(`[상태] ${equipped ? '장착' : '장착 해제'} | ${SWORD_NAME}`)
    } catch (error) {
      console.error('장착 처리 실패', error)
    }
  }

  const inventoryPanel = document.getElementById('inventory')
  if (inventoryPanel instanceof HTMLElement) {
    // 칸 안의 캔버스는 더블클릭이 빠지는 경우가 있어, 두 번째 클릭으로 장착한다.
    inventoryPanel.addEventListener('click', (event) => {
      try {
        if (event.detail !== 2 || !(event.target instanceof Element)) {
          return
        }
        const slot = event.target.closest('#inventory-item')
        if (!(slot instanceof HTMLElement) || slot.hidden) {
          return
        }
        event.preventDefault()
        equipSword()
      } catch (error) {
        console.error('장착 처리 실패', error)
      }
    })
  }

  const storeSword = () => {
    try {
      if (!droppedSword) {
        return
      }
      inventory.push({ name: droppedSword.name })
      droppedSword = null
      renderInventory()
      console.log(`[상태] 인벤토리 저장 | ${SWORD_NAME} | 보유: ${inventory.length}`)
    } catch (error) {
      console.error('인벤토리 저장 실패', error)
    }
  }

  const keepInside = () => {
    chest.x = clamp(chest.x, 48, Math.max(48, canvas.width - 48))
    chest.y = clamp(chest.y, 48, Math.max(48, canvas.height - 48))
    if (!droppedSword) {
      return
    }
    droppedSword.x = clamp(droppedSword.x, 48, Math.max(48, canvas.width - 48))
    droppedSword.y = clamp(droppedSword.y, 72, Math.max(72, canvas.height - 48))
  }

  const captureFloor = () => ({
    x: chest.x,
    y: chest.y,
    open: chest.open,
    droppedSword: droppedSword ? { ...droppedSword } : null,
  })

  // 층을 옮길 때 그 층의 상자와 떨어진 검을 되돌린다. 인벤토리는 유지한다.
  const applyFloor = (state) => {
    try {
      chest.x = state.x
      chest.y = state.y
      chest.open = Boolean(state.open)
      droppedSword = state.droppedSword ? { ...state.droppedSword } : null
      console.log(`[상태] 보물상자 배치 | 위치 (${Math.round(chest.x)}, ${Math.round(chest.y)})`)
    } catch (error) {
      console.error('층 보물상자 복원 실패', error)
    }
  }

  return {
    openChest,
    storeSword,
    keepInside,
    captureFloor,
    applyFloor,
    getEquippedWeapon: () => (equipped && swordReady ? swordImage : null),
    getEquippedAttack: () => (equipped ? BRASS_SWORD_ATK : 0),
    getEquippedDefense: () => 0,
    onEquipChange: (listener) => {
      equipListeners.push(listener)
    },
    hitChest: (point) => containsPoint(point, chest.x, chest.y, chest.width, chest.height),
    isChestInReach: (playerPoint) => Math.hypot(playerPoint.x - chest.x, playerPoint.y - chest.y) <= CHEST_REACH,
    isSwordInReach: (playerPoint) => {
      if (!droppedSword) {
        return false
      }
      return Math.hypot(playerPoint.x - droppedSword.x, playerPoint.y - droppedSword.y) <= CHEST_REACH
    },
    hitDroppedSword: (point) => {
      if (!droppedSword) {
        return false
      }
      const size = swordDrawSize()
      return containsPoint(point, droppedSword.x, droppedSword.y, size.width + 16, size.height + 28)
    },
    draw: (ctx) => {
      drawChest(ctx, chest)
      if (droppedSword && swordReady) {
        drawDroppedSword(ctx, swordImage, droppedSword)
      }
    },
  }
}
