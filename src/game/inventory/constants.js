// 디아블로 2 가방처럼 10x4 칸을 쓴다.
export const BAG_COLUMNS = 10
export const BAG_ROWS = 4
export const BAG_CELL_SIZE = 28

// 좌측 장착 칸. 검만 있어도 자리를 미리 잡아 둔다.
export const EQUIP_SLOTS = [
  { id: 'head', label: '투구', kind: 'head' },
  { id: 'amulet', label: '목걸이', kind: 'amulet' },
  { id: 'weapon', label: '무기', kind: 'weapon' },
  { id: 'torso', label: '갑옷', kind: 'torso' },
  { id: 'offhand', label: '보조', kind: 'offhand' },
  { id: 'gloves', label: '장갑', kind: 'gloves' },
  { id: 'belt', label: '허리띠', kind: 'belt' },
  { id: 'boots', label: '신발', kind: 'boots' },
  { id: 'ring1', label: '반지', kind: 'ring' },
  { id: 'ring2', label: '반지', kind: 'ring' },
]

export const BRASS_SWORD = {
  name: '놋쇠검',
  kind: 'weapon',
  width: 1,
  height: 3,
}
