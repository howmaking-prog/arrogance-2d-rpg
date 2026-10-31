// 레벨마다 필요한 경험치. 막대는 이번 레벨 구간만 채운다.
export const EXP_PER_LEVEL = 100

export const expProgress = (totalExp) => {
  try {
    const total = Math.max(0, Math.floor(Number(totalExp) || 0))
    const level = Math.floor(total / EXP_PER_LEVEL) + 1
    const current = total % EXP_PER_LEVEL
    return {
      total,
      level,
      current,
      max: EXP_PER_LEVEL,
      ratio: current / EXP_PER_LEVEL,
    }
  } catch (error) {
    console.error('경험치 계산 실패', error)
    return {
      total: 0,
      level: 1,
      current: 0,
      max: EXP_PER_LEVEL,
      ratio: 0,
    }
  }
}
