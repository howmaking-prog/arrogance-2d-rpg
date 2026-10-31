// 첨부 UI처럼 오른쪽은 5x6 사각 칸이다.
export const BAG_COLUMNS = 5
export const BAG_ROWS = 6
export const BAG_CELL_SIZE = 52

export const BAG_FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'weapon', label: '무기' },
  { id: 'armor', label: '방어구' },
  { id: 'potion', label: '포션' },
  { id: 'jewelry', label: '장신구' },
]

// 캐릭터 기준 왼쪽·오른쪽 장착 칸. 장갑은 비워 두고 시각만 맞춘다.
export const EQUIP_LEFT = [
  { id: 'head', label: '투구', kind: 'head' },
  { id: 'torso', label: '갑옷', kind: 'torso' },
  { id: 'gloves', label: '장갑', kind: 'gloves' },
  { id: 'belt', label: '허리띠', kind: 'belt' },
  { id: 'boots', label: '신발', kind: 'boots' },
]

export const EQUIP_RIGHT = [
  { id: 'weapon', label: '무기', kind: 'weapon' },
  { id: 'offhand', label: '방패', kind: 'offhand' },
  { id: 'amulet', label: '목걸이', kind: 'amulet' },
  { id: 'ring1', label: '반지', kind: 'ring' },
  { id: 'earring', label: '귀걸이', kind: 'earring' },
]

export const EQUIP_SLOTS = [...EQUIP_LEFT, ...EQUIP_RIGHT]

export const emptyEquipment = () => ({
  head: null,
  torso: null,
  gloves: null,
  belt: null,
  boots: null,
  weapon: null,
  offhand: null,
  amulet: null,
  ring1: null,
  earring: null,
})
