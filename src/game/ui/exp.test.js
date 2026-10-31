import { EXP_PER_LEVEL, expProgress } from './exp.js'

describe('경험치 막대', () => {
  test('누적 경험치를 레벨과 이번 구간으로 나눈다', () => {
    expect(expProgress(0)).toEqual({
      total: 0,
      level: 1,
      current: 0,
      max: EXP_PER_LEVEL,
      ratio: 0,
    })
    expect(expProgress(12)).toMatchObject({ level: 1, current: 12, max: 100 })
    expect(expProgress(100)).toMatchObject({ level: 2, current: 0 })
    expect(expProgress(250)).toMatchObject({ level: 3, current: 50, ratio: 0.5 })
  })
})
