import { expProgress } from './exp.js'

const BAR_LERP = 10

// 화면 중앙 하단 경험치 막대. 전투 보상 직후 차오르는 모습을 보여 준다.
export const createExpBar = () => {
  const root = document.getElementById('exp-bar')
  const fill = document.getElementById('exp-fill')
  const label = document.getElementById('exp-label')
  const text = document.getElementById('exp-text')
  let shown = 0
  let target = 0
  let level = 1
  let max = 100

  const paint = (progress) => {
    if (label instanceof HTMLElement) {
      label.textContent = `Lv ${progress.level}`
    }
    if (text instanceof HTMLElement) {
      text.textContent = `${progress.current} / ${progress.max}`
    }
    if (fill instanceof HTMLElement) {
      fill.style.width = `${Math.max(0, Math.min(100, (shown / Math.max(progress.max, 1)) * 100))}%`
    }
  }

  const setExp = (totalExp) => {
    try {
      const progress = expProgress(totalExp)
      if (progress.level !== level) {
        shown = 0
      }
      level = progress.level
      max = progress.max
      target = progress.current
      paint(progress)
    } catch (error) {
      console.error('경험치 막대 갱신 실패', error)
    }
  }

  try {
    if (!(root instanceof HTMLElement) || !(fill instanceof HTMLElement)) {
      throw new Error('경험치 막대를 찾을 수 없습니다.')
    }
    root.hidden = false
    setExp(0)
  } catch (error) {
    console.error('경험치 막대 준비 실패', error)
  }

  return {
    setExp,
    sync: (dt) => {
      if (!Number.isFinite(dt) || dt < 0) {
        return
      }
      const blend = Math.min(1, dt * BAR_LERP)
      shown += (target - shown) * blend
      if (Math.abs(target - shown) < 0.2) {
        shown = target
      }
      paint({ level, current: Math.round(target), max })
    },
  }
}
