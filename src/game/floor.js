import { createTilemapRenderer } from './dungeon/tilemap.js?v=14'

const VOID_COLOR = '#070604'

let floorCache = null
const renderer = createTilemapRenderer()

const paintFloor = (width, height, layout) => {
  const surface = document.createElement('canvas')
  surface.width = width
  surface.height = height
  const layer = surface.getContext('2d')
  if (!layer) {
    throw new Error('바닥 버퍼를 만들 수 없습니다.')
  }
  layer.fillStyle = VOID_COLOR
  layer.fillRect(0, 0, width, height)
  layer.imageSmoothingEnabled = false
  renderer.draw(layer, layout)

  const shade = layer.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.2,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.78,
  )
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)')
  shade.addColorStop(1, 'rgba(0, 0, 0, 0.45)')
  layer.fillStyle = shade
  layer.fillRect(0, 0, width, height)
  return surface
}

// 타일셋이 준비된 뒤에만 층을 캐시한다.
export const drawTowerFloor = (ctx, width, height, layout) => {
  try {
    renderer.useMode(layout.mode).catch((error) => {
      console.error('타일셋 준비 실패', error)
    })
    if (!renderer.isReady()) {
      ctx.fillStyle = VOID_COLOR
      ctx.fillRect(0, 0, width, height)
      return
    }
    if (
      !floorCache
      || floorCache.width !== width
      || floorCache.height !== height
      || floorCache.floor !== layout.floor
      || floorCache.seed !== layout.seed
    ) {
      floorCache = {
        width,
        height,
        floor: layout.floor,
        seed: layout.seed,
        canvas: paintFloor(width, height, layout),
      }
    }
    ctx.drawImage(floorCache.canvas, 0, 0)
  } catch (error) {
    console.error('바닥 그리기 실패', error)
  }
}
