import { lungeOffset, slashFrame, SLASH_FRAMES } from './strikePose.js'

describe('베기 동작', () => {
  test('시작은 첫 칸이고 끝으로 갈수록 다음 칸으로 넘어간다', () => {
    expect(slashFrame(0, 0.34)).toBe(0)
    expect(slashFrame(0.34, 0.34)).toBe(SLASH_FRAMES - 1)
  })

  test('오른쪽 베기는 앞으로 나갔다가 제자리로 돌아온다', () => {
    expect(lungeOffset('right', 0, 0.34)).toEqual({ x: 0, y: 0 })
    expect(lungeOffset('right', 0.17, 0.34).x).toBeGreaterThan(20)
    expect(lungeOffset('left', 0.17, 0.34).x).toBeLessThan(-20)
  })
})
