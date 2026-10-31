// 오만의 탑 아이템 CSV를 2D RPG용 데이터로 옮긴다.
// 포맷: ID,Type,Name,Description,Price,Atk,Def,Str,Agi,Int,Luk,Vit,MaxHp,MaxMp,BossFloor,Shop,Chest,Drop,Initial

const ITEM_CSV = `
i-rusty-sword,W,녹슨 단검,날이 무뎌진 낡은 단검입니다.,50,5,0,0,0,0,0,0,0,0,,,,,1
i-steel-sword,W,강철 검,잘 제련된 강철 검입니다.,150,15,0,0,0,0,0,0,0,0,,1,1,1,,
i-gear-blade,W,톱니날 검,회전하는 톱니가 달린 잔혹한 검입니다.,600,30,0,0,3,0,0,0,0,0,,2,1,2,,
i-frost-claymore,W,강철 대검,냉기가 흐르는 거대한 대검입니다.,1000,50,0,5,0,0,0,0,0,0,,3,2,3,,
i-thunder-rapier,W,아이스 레이피어,얼음의 속성를 가진 찌르기용 검입니다.,1500,65,0,0,12,0,0,0,0,0,,4,3,4,,
i-dragon-slayer,W,신속의 블레이드,번개의 속도를 머금은 대검입니다.,2000,80,0,15,5,0,0,10,0,0,,5,4,5,,
i-orc-great-axe,W,오크의 대부도끼,거대한 오크 전사가 사용하던 묵직한 도끼입니다.,2500,90,0,20,0,0,0,5,0,0,,6,5,6,,
i-combat-longsword,W,전투용 롱소드,실전성을 극대화한 기사용 장검으로 공수 밸런스가 좋습니다.,3200,100,5,8,8,0,0,0,0,0,,7,6,7,,
i-lizardman-trident,W,리자드맨의 삼지창,늪지대 리자드맨의 무기로 치명적인 급습에 특화되어 있습니다.,4000,110,0,5,15,0,5,0,0,0,,8,7,8,,
i-lightsaber,W,라이트 세이버,검신이 빛으로 이루어져 있는 명검으로 공속이 아주 빠른 검입니다.,5000,130,0,30,0,10,0,0,0,0,,9,8,9,,
i-caledfwlch,W,칼레드불흐,모든 것을 벨 수 있다는 전설의 명검 엑스칼리버 입니다.,6500,150,0,20,10,0,10,0,0,0,,10,9,10,,
i-cloth-armor,A,누더기 옷,방어 효과가 거의 없는 낡은 옷입니다.,50,0,5,0,0,0,0,0,0,0,,,,,1
i-leather-armor,A,가죽 갑옷,질긴 가죽으로 만든 갑옷입니다.,120,0,10,0,0,0,0,0,0,0,,1,1,1,,
i-shadow-cloak,A,그림자 망토,그림자의 기운이 서린 망토입니다.,300,0,15,0,5,0,0,0,0,0,,2,1,2,,
i-brass-armor,A,황동 중갑,무겁지만 견고한 황동 판금 갑옷입니다.,550,0,25,0,0,0,0,5,0,0,,3,2,3,,
i-plate-mail,A,강철 판금 갑옷,전신을 보호하는 육중한 철제 갑옷입니다.,900,0,35,0,0,0,0,10,200,0,,4,3,4,,
i-wizard-robe,A,현자의 로브,마법이 깃들어 체력과 마력을 높여주는 의복입니다.,1300,0,45,0,0,20,20,0,200,200,,5,4,5,,
i-ancient-armor,A,기사의 갑옷,왕의 기사들만 착용하는 가벼우면서 단단한 갑옷입니다.,1800,0,60,10,5,5,0,0,100,0,,6,5,6,,
i-mithril-plate,A,미스릴 판금 갑옷,미스릴로 제작되어 가벼우면서도 웬만한 공격은 모두 튕겨냅니다.,2300,0,70,12,0,0,0,15,300,0,,7,6,7,,
i-dragon-scale,A,용의 비늘 갑옷,드래곤의 비늘을 엮어 만든 갑옷으로 착용자에게 강력한 생명력을 부여합니다.,3000,0,80,15,10,0,0,10,400,0,,8,7,8,,
i-titan-armor,A,타이탄의 대지갑옷,신들이 착용한다는 높은 방어력을 가진 마력 갑옷입니다.,3800,0,90,0,0,40,15,0,250,0,,9,8,9,,
i-angel-armor,A,대천사의 수호갑옷,대천사장 가브리엘이 착용하는 신성한 갑옷입니다.,5000,0,100,10,10,40,15,0,300,0,,10,9,10,,
i-leather-cap,H,가죽 모자,기본적인 머리 보호용 가죽 모자입니다.,100,0,4,0,0,0,0,0,20,0,,1,1,1,,
i-iron-helm,H,철제 투구,단단한 철로 만든 투구입니다.,250,0,8,0,0,0,0,2,50,0,,2,1,2,,
i-circlet-of-mind,H,정신의 서클릿,집중력을 높여주는 마법 서클릿입니다.,500,0,10,0,0,8,0,0,50,50,,3,2,3,,
i-knight-helmet,H,기사의 투구,눈을 제외한 전면을 보호하는 기사용 투구입니다.,900,0,14,2,0,0,0,5,100,0,,4,3,4,,
i-viking-great-helm,H,바이킹 대투구,웅장한 뿔이 달린 전사의 투구입니다.,1400,0,18,0,0,15,5,0,50,150,,5,4,5,,
i-mithril-bascinet,H,미스릴 투구,가볍지만 강철보다 단단한 미스릴제 투구입니다.,1800,2,22,8,0,0,0,10,200,0,,6,5,6,,
i-champion-crown,H,챔피언의 왕관,승리자만이 쓸 수 있는 권위 있는 왕관입니다.,2200,0,28,5,5,5,0,8,250,100,,7,6,7,,
i-dragon-horn-helm,H,드래곤 투구,드래곤의 뿔을 깎아 만든 강력한 투구입니다.,2700,5,35,10,0,0,10,10,300,150,,8,7,8,,
i-valkyri-helm,H,발키리 윙드 헬름,발키리의 힘을 부여하는 투구입니다.,3200,10,40,15,0,0,0,15,350,200,,9,8,9,,
i-holy-guardian-helm,H,성스러운 수호투구,보호마법이 걸려있는 성스러운 마법 투구입니다.,3600,10,50,15,0,0,0,15,400,250,,10,9,10,,
i-leather-belt,B,가죽 벨트,내구성이 좋은 일반적인 가죽 벨트입니다.,300,0,3,0,0,0,2,2,0,0,,2,1,2,,
i-heavy-buckle,B,강철 버클 벨트,무거운 철제 버클이 달린 벨트입니다.,500,0,6,3,0,0,3,5,0,0,,3,2,3,,
i-thief-sash,B,도적의 허리띠,다양한 주머니가 달린 가벼운 허리띠입니다.,800,0,4,0,8,0,5,10,0,0,,4,3,4,,
i-plate-tasset,B,판금 요대,허리 아래를 보호하는 금속판이 덧대진 벨트입니다.,1100,0,12,5,0,0,10,15,0,0,,5,4,5,,
i-monk-waistband,B,수도사의 띠,평온한 마음을 유지해주는 수행자의 띠입니다.,1500,0,8,0,5,5,10,20,0,0,,6,5,6,,
i-giant-strength-belt,B,거인의 힘 허리띠,착용자에게 거인의 완력을 부여합니다.,2000,10,10,15,0,0,15,25,0,0,,7,6,7,,
i-vampire-girdle,B,흡혈귀의 거들,생명력을 흡수하는 마력이 깃들어 있습니다.,2500,0,15,0,5,0,15,30,0,0,,8,7,8,,
i-valkyrie-wing-belt,B,발키리 윙 벨트,신속한 기동을 돕는 날개 장식 벨트입니다.,3200,0,20,5,15,0,20,35,0,0,,9,8,9,,
i-zeus-belt,B,제우스의 벨트,제우스신의 가호가 깃든 성스러운 벨트입니다.,4000,5,25,12,12,12,20,40,0,0,,10,9,10,,
i-leather-boots,S,가죽 장화,여행자들이 즐겨 신는 튼튼한 장화입니다.,200,0,4,0,5,0,0,0,0,0,,2,1,2,,
i-swift-shoes,S,신속의 신발,바람의 기운이 깃든 가벼운 신발입니다.,450,0,3,0,10,0,0,0,0,0,,3,2,3,,
i-heavy-boots,S,무거운 군화,보호 기능에 충실한 두꺼운 철제 장화입니다.,800,0,12,0,15,0,0,0,0,0,,4,3,4,,
i-assassin-step,S,암살자의 장화,발소리를 죽여주는 검은 가죽 장화입니다.,1200,5,8,0,20,0,0,0,0,0,,5,4,5,,
i-plate-greaves,S,판금 경갑,다리 전체를 견고하게 감싸는 판금 신발입니다.,1700,0,10,0,25,0,0,0,0,0,,6,5,6,,
i-mage-boots,S,마법사의 부츠,마법이 다리 전체를 감싸고 있는 신발입니다.,2200,0,25,10,30,0,0,0,0,0,,7,6,7,,
i-shadow-walk,S,그림자 걸음,어둠 속을 소리 없이 이동하게 해줍니다.,2700,8,18,0,35,0,0,0,0,0,,8,7,8,,
i-dragon-talon-boots,S,용의 발톱 장화,드래곤의 발톱처럼 견고하고 위협적입니다.,3200,15,22,12,40,0,0,0,0,0,,9,8,9,,
i-winged-boots,S,헤르메스의 신발,하늘을 날 수 있는 마법의 신발입니다.,4000,10,25,15,45,0,0,0,0,0,,10,9,10,,
i-wooden-shield,SH,나무 방패,임시로 만든 조잡한 나무 방패입니다.,250,0,5,0,0,0,0,0,0,0,,2,1,2,,
i-buckler,SH,버클러,손목에 고정하는 작은 원형 방패입니다.,500,2,10,0,0,0,0,0,0,0,,3,2,3,,
i-kite-shield,SH,카이트 쉴드,전신을 가리기 좋은 연 모양의 방패입니다.,800,0,15,0,0,0,0,0,0,0,,4,3,4,,
i-spiked-shield,SH,가시 박힌 방패,방어와 동시에 반격을 노릴 수 있습니다.,1200,15,20,0,0,0,0,0,0,0,,5,4,5,,
i-tower-shield,SH,타워 쉴드,성벽처럼 거대하고 무거운 방패입니다.,1800,0,30,10,0,0,0,0,0,0,,6,5,6,,
i-eagle-shield,SH,독수리 방패,독수리 그림이 새겨진 티타늄 방패입니다.,2400,0,35,15,0,0,0,0,0,0,,7,6,7,,
i-paladin-shield,SH,성기사의 방패,신성한 기운으로 착용자를 보호합니다.,3000,0,45,15,5,10,0,15,200,100,,8,7,8,,
i-dragon-scale-shield,SH,용비늘 방패,드래곤의 비늘로 만들어 파괴가 불가능합니다.,3500,10,60,20,0,0,0,25,400,0,,9,8,9,,
i-magic-shield,SH,홀리 쉴드,성스러운 기운으로 착용자를 보호하는 마력의 방패입니다.,4000,20,80,25,0,0,10,30,500,200,,10,9,10,,
i-health-potion,C,체력 포션,마시면 체력을 100 회복합니다.,100,0,0,0,0,0,0,0,100,0,,1,1,1,1
i-mana-potion,C,마나 포션,마시면 마나를 50 회복합니다.,100,0,0,0,0,0,0,0,0,50,,1,1,1,1
i-health-potion2,C,중급 체력 포션,마시면 체력을 200 회복합니다.,200,0,0,0,0,0,0,0,200,0,,3,3,3,
i-mana-potion2,C,중급 마나 포션,마시면 마나를 100 회복합니다.,200,0,0,0,0,0,0,0,0,100,,3,3,3,
i-health-potion3,C,고급 체력 포션,마시면 체력을 400 회복합니다.,300,0,0,0,0,0,0,0,400,0,,5,5,5,
i-mana-potion3,C,고급 마나 포션,마시면 마나를 200 회복합니다.,300,0,0,0,0,0,0,0,0,200,,5,5,5,
i-health-potion4,C,풀 체력 포션,마시면 체력을 전부 회복합니다.,300,0,0,0,0,0,0,0,10000,0,,7,7,7,
i-mana-potion4,C,풀 마나 포션,마시면 마나를 전부 회복합니다.,300,0,0,0,0,0,0,0,0,100000,,7,7,7,
i-golem-crush-ring,R,골렘의 파쇄 반지,1층 보스 드롭. 모든 것을 부수는 골렘의 완력이 깃든 반지입니다.,0,10,5,0,0,0,0,0,50,0,1,,,
i-orc-warrior-ring,R,오크전사 반지,2층 보스 드롭. 오크 전사의 힘이 깃든 반지입니다.,0,10,10,5,0,0,0,0,75,0,2,,,
i-berserk-ring,R,광폭의 반지,3층 보스 드롭. 광폭한 힘이 담긴 반지입니다.,0,15,10,0,10,0,0,0,100,0,3,,,
i-fire-ring,R,화염의 반지,4층 보스 드롭. 화염의 마력이 서린 반지입니다.,0,15,15,10,5,5,0,0,150,0,4,,,
i-knight-ring,R,기사의 용맹 반지,5층 보스 드롭. 기사의 용맹을 상징하는 반지입니다.,0,25,20,10,0,0,5,0,200,0,5,,,
i-zodiac-ring,R,흑요석 반지,6층 보스 드롭. 착용자의 마력을 안정시키고 외부의 충격을 무디게 만드는 마력이 깃들어 있습니다.,0,25,30,10,0,10,5,0,250,0,6,,,
i-jordan-ring,R,요르단의 반지,7층 보스 드롭. 오래전 잊힌 왕국의 이름을 딴 전설적인 마력 반지입니다.,0,30,25,10,5,10,0,0,300,0,6,,,
i-dragon-ring,R,화염 드래곤의 반지,8층 보스 드롭. 화염 드래곤의 강력한 마력이 담긴 반지입니다.,0,35,30,10,10,10,5,0,350,0,8,,,
i-holyknight-ring,R,성기사의 수호 반지,9층 보스 드롭. 반지 착용자를 보호하는 보호막이 깃든 반지입니다.,0,40,40,20,20,20,0,0,400,0,9,,,
i-orc-mage-earring,E,오크마법사 귀걸이,2층 보스 드롭. 마력이 응집된 귀걸이입니다.,0,5,10,0,0,5,0,0,0,50,2,,,
i-berserk-earring,E,광폭의 귀걸이,3층 보스 드롭. 광폭한 힘이 담긴 귀걸이입니다.,0,10,15,5,5,0,0,0,0,100,3,,,
i-frost-earring,E,빙결의 귀걸이,4층 보스 드롭. 얼음의 마력이 서린 귀걸이입니다.,0,15,20,5,5,10,0,0,0,150,4,,,
i-knight-earring,E,기사의 용맹 귀걸이,5층 보스 드롭. 기사의 용맹을 상징하는 귀걸이입니다.,0,20,25,10,5,0,0,0,0,200,5,,,
i-ancient-sage-earring,E,고대 현자의 귀걸이,6층 보스 드롭. 심연의 마력을 정제하여 만든 고결한 귀걸이입니다.,0,25,30,5,5,20,10,0,0,250,6,,,
i-greatmage-earring,E,대마법사의 귀걸이,7층 보스 드롭. 대마법사의 지혜를 상징하는 귀걸이입니다.,0,30,35,10,10,25,0,0,0,300,7,,,
i-dragon-earring,E,아이스 드래곤의 귀걸이,8층 보스 드롭. 아이스 드래곤의 강력한 마력이 담긴 귀걸이입니다.,0,35,40,15,15,15,0,0,0,350,8,,,
i-holyknight-earring,E,성기사의 귀걸이,9층 보스 드롭. 귀걸이 착용자를 보호하는 보호막이 깃든 귀걸이입니다.,0,40,50,20,20,20,0,0,0,400,9,,,
i-orc-champion-necklace,N,오크챔피언 목걸이,1층 보스 드롭. 전사의 모든 능력을 높이는 목걸이입니다.,0,5,5,0,2,2,2,0,50,50,2,,,
i-berserk-necklace,N,광폭의 목걸이,3층 보스 드롭. 광폭한 힘이 담긴 목걸이입니다.,0,10,10,0,3,3,3,0,75,75,3,,,
i-lightning-necklace,N,번개의 목걸이,4층 보스 드롭. 번개의 속도가 서린 목걸이입니다.,0,15,10,0,5,5,5,0,100,100,4,,,
i-knight-necklace,N,기사의 용맹 목걸이,5층 보스 드롭. 기사의 용맹을 상징하는 목걸이입니다.,0,20,15,10,5,0,0,0,125,125,5,,,
i-chaos-eye-necklace,N,혼돈의 눈 목걸이,6층 보스 드롭. 운명과 혼돈의 힘이 공존하는 기괴한 목걸이입니다.,0,25,15,10,5,10,0,0,150,150,6,,,
i-arakne-necklace,N,아라크네의 목걸이,7층 보스 드롭. 아라크네의 눈으로 만든 마력이 넘치는 목걸이입니다.,0,30,20,10,10,20,10,0,175,175,7,,,
i-dragon-necklace,N,고대 드래곤의 목걸이,8층 보스 드롭. 고대 드래곤의 강력한 마력이 담긴 목걸이입니다.,0,35,25,15,15,15,0,0,200,200,8,,,
i-holyknight-necklace,N,성기사의 목걸이,9층 보스 드롭. 목걸이 착용자를 보호하는 보호막이 깃든 목걸이입니다.,0,40,30,20,20,20,0,0,250,250,9,,,
`.trim()

const FOLDER_BY_TYPE = {
  W: 'Weapon',
  A: 'Armor',
  H: 'Helm',
  B: 'Belt',
  S: 'Boots',
  SH: 'Shield',
  C: 'Potion',
  R: 'Ring',
  N: 'Necklace',
  E: 'Earring',
}

const EQUIP_SLOT_BY_TYPE = {
  W: 'weapon',
  A: 'torso',
  H: 'head',
  B: 'belt',
  S: 'boots',
  SH: 'offhand',
  R: 'ring1',
  N: 'amulet',
  E: 'earring',
}

const FILTER_KIND_BY_TYPE = {
  W: 'weapon',
  A: 'armor',
  H: 'armor',
  B: 'armor',
  S: 'armor',
  SH: 'armor',
  C: 'potion',
  R: 'jewelry',
  N: 'jewelry',
  E: 'jewelry',
}

// 파일명이 데이터 ID와 다르거나 폴더가 다른 경우만 보정한다.
const ICON_OVERRIDES = {
  'i-buckler': 'src/item/Belt/i-buckler.png',
  'i-eagle-shield': 'src/item/Shield/i-eagle-guard.png',
}

const parseIntOrZero = (value) => {
  const number = Number.parseInt(value, 10)
  return Number.isFinite(number) ? number : 0
}

const parseFloorList = (value) => {
  if (!value || !String(value).trim()) {
    return []
  }
  return String(value)
    .split(',')
    .map((part) => parseIntOrZero(part.trim()))
    .filter((floor) => floor > 0)
}

const parseCsvRow = (row) => {
  const result = []
  let current = ''
  let inQuotes = false
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (!inQuotes && char === ',') {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

const iconPathFor = (id, typeKey) => {
  if (ICON_OVERRIDES[id]) {
    return ICON_OVERRIDES[id]
  }
  const folder = FOLDER_BY_TYPE[typeKey]
  if (!folder) {
    return null
  }
  return `src/item/${folder}/${id}.png`
}

const parseItemRow = (parts) => {
  if (parts.length < 5) {
    return null
  }
  const [
    id,
    typeKey,
    name,
    description,
    priceStr,
    atkStr = '0',
    defStr = '0',
    strStr = '0',
    agiStr = '0',
    intStr = '0',
    lukStr = '0',
    vitStr = '0',
    maxHpStr = '0',
    maxMpStr = '0',
    bossFloorStr = '',
    shopStr = '',
    chestStr = '',
    dropStr = '',
    initialStr = '',
  ] = parts

  if (!FOLDER_BY_TYPE[typeKey]) {
    return null
  }

  const atk = parseIntOrZero(atkStr)
  const def = parseIntOrZero(defStr)
  const str = parseIntOrZero(strStr)
  const agi = parseIntOrZero(agiStr)
  const intelligence = parseIntOrZero(intStr)
  const luk = parseIntOrZero(lukStr)
  const vit = parseIntOrZero(vitStr)
  const maxHp = parseIntOrZero(maxHpStr)
  const maxMp = parseIntOrZero(maxMpStr)
  const isConsumable = typeKey === 'C'

  const stats = {}
  if (atk) stats.atk = atk
  if (def) stats.def = def
  if (str) stats.str = str
  if (agi) stats.agi = agi
  if (intelligence) stats.int = intelligence
  if (luk) stats.luk = luk
  if (vit) stats.vit = vit
  if (!isConsumable && maxHp) stats.maxHp = maxHp
  if (!isConsumable && maxMp) stats.maxMp = maxMp

  return {
    item: {
      id,
      name,
      description,
      typeKey,
      price: parseIntOrZero(priceStr),
      filterKind: FILTER_KIND_BY_TYPE[typeKey],
      equipSlot: EQUIP_SLOT_BY_TYPE[typeKey] || null,
      iconPath: iconPathFor(id, typeKey),
      stats,
      consumableEffect: isConsumable
        ? {
          ...(maxHp ? { hp: maxHp } : {}),
          ...(maxMp ? { mp: maxMp } : {}),
        }
        : null,
      width: 1,
      height: 1,
      rarity: typeKey === 'C' ? 'common' : (atk + def >= 80 ? 'rare' : 'common'),
    },
    meta: {
      bossFloor: bossFloorStr ? parseIntOrZero(bossFloorStr) : 0,
      shopFloors: parseFloorList(shopStr),
      chest: chestStr === '1',
      dropFloors: parseFloorList(dropStr),
      initial: initialStr === '1',
    },
  }
}

const PARSED = (() => {
  const allItems = {}
  const meta = {}
  const chestIds = []
  ITEM_CSV.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      return
    }
    const parsed = parseItemRow(parseCsvRow(trimmed))
    if (!parsed) {
      return
    }
    // 같은 ID가 여러 층용으로 반복되면 첫 정의만 남긴다.
    if (!allItems[parsed.item.id]) {
      allItems[parsed.item.id] = parsed.item
      meta[parsed.item.id] = parsed.meta
      if (parsed.meta.chest) {
        chestIds.push(parsed.item.id)
      }
    } else if (parsed.meta.chest && !meta[parsed.item.id].chest) {
      meta[parsed.item.id].chest = true
      chestIds.push(parsed.item.id)
    }
  })
  return { allItems, meta, chestIds }
})()

export const ALL_ITEMS = PARSED.allItems

export const INITIAL_ITEM_IDS = [
  'i-rusty-sword',
  'i-cloth-armor',
  'i-health-potion',
  'i-mana-potion',
]

export const getItemDef = (id) => ALL_ITEMS[id] || null

export const CHEST_ITEMS = PARSED.chestIds.map((id) => ALL_ITEMS[id]).filter(Boolean)

export const getDroppableItemsForFloor = (floor) => Object.entries(PARSED.meta)
  .filter(([id, entry]) => (
    entry.dropFloors.includes(floor)
    && ALL_ITEMS[id]
    && ALL_ITEMS[id].filterKind !== 'jewelry'
  ))
  .map(([id]) => ALL_ITEMS[id])

export const pickRandomChestItem = (floor = 1) => {
  try {
    const dropPool = getDroppableItemsForFloor(floor)
    const pool = dropPool.length > 0 ? dropPool : CHEST_ITEMS
    if (pool.length === 0) {
      return getItemDef('i-steel-sword')
    }
    return pool[Math.floor(Math.random() * pool.length)]
  } catch (error) {
    console.error('상자 아이템 선택 실패', error)
    return getItemDef('i-steel-sword')
  }
}

// 장착 중인 아이템들의 능력치 합을 구한다.
export const sumEquipmentBonuses = (equipment) => {
  const bonus = {
    atk: 0,
    def: 0,
    str: 0,
    agi: 0,
    int: 0,
    vit: 0,
    maxHp: 0,
    maxMp: 0,
  }
  Object.values(equipment || {}).forEach((item) => {
    if (!item?.stats) {
      return
    }
    bonus.atk += item.stats.atk || 0
    bonus.def += item.stats.def || 0
    bonus.str += item.stats.str || 0
    bonus.agi += item.stats.agi || 0
    bonus.int += item.stats.int || 0
    bonus.vit += item.stats.vit || 0
    bonus.maxHp += item.stats.maxHp || 0
    bonus.maxMp += item.stats.maxMp || 0
  })
  return bonus
}
