import { BAG_COLUMNS, BAG_ROWS } from './constants.js'

const inBounds = (x, y, width, height) => (
  x >= 0
  && y >= 0
  && x + width <= BAG_COLUMNS
  && y + height <= BAG_ROWS
)

export const createEmptyBag = () => (
  Array.from({ length: BAG_ROWS }, () => Array.from({ length: BAG_COLUMNS }, () => null))
)

export const fitsInBag = (grid, x, y, width, height, ignoreId = null) => {
  if (!inBounds(x, y, width, height)) {
    return false
  }
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      const owner = grid[row][col]
      if (owner !== null && owner !== ignoreId) {
        return false
      }
    }
  }
  return true
}

// 왼쪽 위부터 빈 자리를 찾는다.
export const findFreeSpot = (grid, width, height) => {
  for (let y = 0; y <= BAG_ROWS - height; y += 1) {
    for (let x = 0; x <= BAG_COLUMNS - width; x += 1) {
      if (fitsInBag(grid, x, y, width, height)) {
        return { x, y }
      }
    }
  }
  return null
}

export const placeOnBag = (grid, itemId, x, y, width, height) => {
  if (!fitsInBag(grid, x, y, width, height)) {
    throw new Error('가방에 자리가 없습니다.')
  }
  const next = grid.map((row) => [...row])
  for (let row = y; row < y + height; row += 1) {
    for (let col = x; col < x + width; col += 1) {
      next[row][col] = itemId
    }
  }
  return next
}

export const clearFromBag = (grid, itemId) => (
  grid.map((row) => row.map((cell) => (cell === itemId ? null : cell)))
)
