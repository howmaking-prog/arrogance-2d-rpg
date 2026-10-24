import { createTilemapRenderer } from './dungeon/tilemap.js?v=16'

const VOID_COLOR = '#070604'

let floorCache = null
const renderer = createTilemapRenderer()

const paintFloor = (layout) => {
  const surface = document.createElement('canvas')
  surface.width = layout.worldWidth
  surface.height = layout.worldHeight
  const layer = surface.getContext('2d')
  if (!layer) {
    throw new Error('바닥 버퍼를 만들 수 없습니다.')
  }
  layer.fillStyle = VOID_COLOR
  layer.fillRect(0, 0, layout.worldWidth, layout.worldHeight)
  layer.imageSmoothingEnabled = false
  renderer.draw(layer, layout)
  return surface
}

// 넓은 층 전체를 한 번 그려 두고, 카메라는 호출하는 쪽에서 움직인다.
export const drawTowerFloor = (ctx, layout) => {
  try {
    renderer.useMode(layout.mode).catch((error) => {
      console.error('타일셋 준비 실패', error)
    })
    if (!renderer.isReady()) {
      return
    }
    if (
      !floorCache
      || floorCache.floor !== layout.floor
      || floorCache.seed !== layout.seed
      || floorCache.width !== layout.worldWidth
      || floorCache.height !== layout.worldHeight
    ) {
      floorCache = {
        width: layout.worldWidth,
        height: layout.worldHeight,
        floor: layout.floor,
        seed: layout.seed,
        canvas: paintFloor(layout),
      }
    }
    ctx.drawImage(floorCache.canvas, 0, 0)
  } catch (error) {
    console.error('바닥 그리기 실패', error)
  }
}
