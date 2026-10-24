// 난이도마다 바닥, 벽, 문의 색을 바꾼다.
export const DUNGEON_MODE = {
  NORMAL: 'NORMAL',
  HARD: 'HARD',
  NIGHTMARE: 'NIGHTMARE',
  HELL: 'HELL',
}

const THEME_ORDER = [
  DUNGEON_MODE.NORMAL,
  DUNGEON_MODE.HARD,
  DUNGEON_MODE.NIGHTMARE,
  DUNGEON_MODE.HELL,
]

const FLOORS_PER_THEME = 2

export const DUNGEON_THEMES = {
  NORMAL: {
    id: DUNGEON_MODE.NORMAL,
    label: '일반',
    voidColor: '#0c0d0b',
    floors: ['#3e433a', '#4a5044', '#34382f', '#3f4a38', '#2e332b'],
    walls: ['#3a342e', '#4a4038', '#2c2824', '#564c42'],
    doorFloor: '#2a261f',
    doorFrame: '#6b5434',
    accent: 'rgba(86, 140, 72, 0.55)',
    accentEvery: 5,
    torchCore: '#fff1c2',
    torchFlame: '#f0c14a',
    torchGlow: 'rgba(255, 170, 70, 0.38)',
  },
  HARD: {
    id: DUNGEON_MODE.HARD,
    label: '철벽',
    voidColor: '#090b10',
    floors: ['#2c333c', '#3a424c', '#23282f', '#343c46', '#1e242b'],
    walls: ['#4d565f', '#3a424a', '#2a3138', '#5c6772'],
    doorFloor: '#1a1e24',
    doorFrame: '#8a929a',
    accent: 'rgba(120, 84, 64, 0.5)',
    accentEvery: 6,
    torchCore: '#d7e4f2',
    torchFlame: '#8eb4d4',
    torchGlow: 'rgba(140, 180, 220, 0.32)',
  },
  NIGHTMARE: {
    id: DUNGEON_MODE.NIGHTMARE,
    label: '악몽',
    voidColor: '#07060c',
    floors: ['#2a2438', '#3a3050', '#221c30', '#46385f', '#1a1524'],
    walls: ['#2a2236', '#3a3048', '#16121e', '#4a3c5c'],
    doorFloor: '#140f1c',
    doorFrame: '#b07cff',
    accent: 'rgba(176, 124, 255, 0.72)',
    accentEvery: 4,
    torchCore: '#f2e6ff',
    torchFlame: '#b07cff',
    torchGlow: 'rgba(150, 80, 220, 0.4)',
  },
  HELL: {
    id: DUNGEON_MODE.HELL,
    label: '지옥',
    voidColor: '#100704',
    floors: ['#3a241c', '#4a2c22', '#2a1814', '#5a3428', '#241410'],
    walls: ['#3a221c', '#4a2a22', '#241410', '#5a3228'],
    doorFloor: '#1a0c08',
    doorFrame: '#e25822',
    accent: 'rgba(226, 88, 34, 0.88)',
    accentEvery: 3,
    torchCore: '#ffe08a',
    torchFlame: '#ff5a1f',
    torchGlow: 'rgba(255, 80, 20, 0.45)',
  },
}

// 두 층마다 다음 난이도 색으로 넘어가고, 7층부터는 지옥으로 고정한다.
export const modeForFloor = (floor) => {
  const level = Math.max(1, Math.floor(Number(floor) || 1))
  const index = Math.min(THEME_ORDER.length - 1, Math.floor((level - 1) / FLOORS_PER_THEME))
  return THEME_ORDER[index]
}

export const themeForMode = (mode) => DUNGEON_THEMES[mode] || DUNGEON_THEMES.NORMAL
