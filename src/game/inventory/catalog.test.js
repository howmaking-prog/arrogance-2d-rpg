import {
  ALL_ITEMS,
  CHEST_ITEMS,
  getDroppableItemsForFloor,
  getItemDef,
  INITIAL_ITEM_IDS,
  sumEquipmentBonuses,
} from './catalog.js'

describe('오만의 탑 아이템 카탈로그', () => {
  test('시작 아이템과 주요 장비가 정의되어 있다', () => {
    INITIAL_ITEM_IDS.forEach((id) => {
      expect(getItemDef(id)).toBeTruthy()
    })
    expect(getItemDef('i-steel-sword').equipSlot).toBe('weapon')
    expect(getItemDef('i-leather-cap').equipSlot).toBe('head')
    expect(getItemDef('i-wooden-shield').equipSlot).toBe('offhand')
    expect(getItemDef('i-fire-ring').filterKind).toBe('jewelry')
    expect(getItemDef('i-health-potion').consumableEffect.hp).toBe(100)
  })

  test('이미지 경로는 src/item 하위 폴더를 가리킨다', () => {
    expect(getItemDef('i-rusty-sword').iconPath).toBe('src/item/Weapon/i-rusty-sword.png')
    expect(getItemDef('i-cloth-armor').iconPath).toBe('src/item/Armor/i-cloth-armor.png')
    expect(getItemDef('i-buckler').iconPath).toBe('src/item/Belt/i-buckler.png')
    expect(getItemDef('i-eagle-shield').iconPath).toBe('src/item/Shield/i-eagle-guard.png')
  })

  test('상자·드롭 풀과 장비 보너스 합산을 계산한다', () => {
    expect(CHEST_ITEMS.length).toBeGreaterThan(5)
    expect(getDroppableItemsForFloor(1).length).toBeGreaterThan(0)
    expect(Object.keys(ALL_ITEMS).length).toBeGreaterThan(50)
    const bonus = sumEquipmentBonuses({
      weapon: { stats: { atk: 15 } },
      torso: { stats: { def: 10, vit: 2 } },
    })
    expect(bonus.atk).toBe(15)
    expect(bonus.def).toBe(10)
    expect(bonus.vit).toBe(2)
  })
})
