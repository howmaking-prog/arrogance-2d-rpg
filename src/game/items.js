// 필드 위 보물상자. 좌표는 상자 중심이다.
const CHEST = { x: 300, y: 190, width: 72, height: 52 }

// 걷기 아래 방향 첫 칸에 있는 놋쇠검만 잘라 바닥 아이템으로 쓴다.
const SWORD_URL = 'src/item/weapon/Sword_brass.png'
const SWORD_SOURCE = { x: 25, y: 686, width: 20, height: 11 }
const SWORD_SCALE = 5
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

// 닫힌 상자는 뚜껑이 덮여 있고, 열리면 안쪽과 젖혀진 뚜껑을 보여 준다.
const drawChest = (ctx, chest) => {
  const left = chest.x - chest.width / 2
  const top = chest.y - chest.height / 2

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'
  ctx.beginPath()
  ctx.ellipse(chest.x, top + chest.height - 4, 30, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#8a5a2b'
  ctx.fillRect(left, top + 20, chest.width, chest.height - 20)
  ctx.fillStyle = '#d4b06a'
  ctx.fillRect(left, top + 28, chest.width, 5)
  ctx.fillRect(left, top + chest.height - 10, chest.width, 5)
  ctx.fillStyle = '#f0d48a'
  ctx.fillRect(chest.x - 5, top + 34, 10, 10)

  if (!chest.open) {
    ctx.fillStyle = '#6b4424'
    ctx.fillRect(left, top, chest.width, 24)
    ctx.fillStyle = '#d4b06a'
    ctx.fillRect(left, top + 10, chest.width, 4)
    return
  }

  ctx.fillStyle = '#2a2118'
  ctx.fillRect(left + 6, top + 24, chest.width - 12, 16)
  ctx.fillStyle = '#6b4424'
  ctx.beginPath()
  ctx.moveTo(left, top + 20)
  ctx.lineTo(left + 10, top - 6)
  ctx.lineTo(left + chest.width - 10, top - 6)
  ctx.lineTo(left + chest.width, top + 20)
  ctx.fill()
  ctx.fillStyle = '#d4b06a'
  ctx.fillRect(left + 10, top + 2, chest.width - 20, 4)
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
export const createFieldItems = (canvas) => {
  const chest = { ...CHEST, open: false }
  let droppedSword = null
  let swordReady = false
  let equipped = false
  const inventory = []

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
      console.log(`[상태] ${equipped ? '장착' : '장착 해제'} | ${SWORD_NAME}`)
    } catch (error) {
      console.error('장착 처리 실패', error)
    }
  }

  if (inventoryItem instanceof HTMLElement) {
    inventoryItem.addEventListener('dblclick', (event) => {
      event.preventDefault()
      equipSword()
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

  return {
    openChest,
    storeSword,
    keepInside,
    getEquippedWeapon: () => (equipped && swordReady ? swordImage : null),
    hitChest: (point) => containsPoint(point, chest.x, chest.y, chest.width, chest.height),
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
