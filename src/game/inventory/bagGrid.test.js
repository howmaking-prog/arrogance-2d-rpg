import { createEmptyBag, findFreeSpot, placeOnBag, clearFromBag, fitsInBag } from './bagGrid.js'

describe('가방 그리드', () => {
  test('1x3 아이템이 들어갈 빈 칸을 찾는다', () => {
    const grid = createEmptyBag()
    expect(findFreeSpot(grid, 1, 3)).toEqual({ x: 0, y: 0 })
    const filled = placeOnBag(grid, 'a', 0, 0, 1, 3)
    expect(findFreeSpot(filled, 1, 3)).toEqual({ x: 1, y: 0 })
    expect(fitsInBag(filled, 0, 0, 1, 3)).toBe(false)
  })

  test('아이템을 치우면 자리가 다시 비다', () => {
    const filled = placeOnBag(createEmptyBag(), 'sword', 2, 1, 1, 3)
    const cleared = clearFromBag(filled, 'sword')
    expect(findFreeSpot(cleared, 1, 3)).toEqual({ x: 0, y: 0 })
  })
})
