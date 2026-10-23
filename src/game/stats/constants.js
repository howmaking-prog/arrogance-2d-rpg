// 기본 스탯은 네 가지이며, 모두 같은 기본값에서 시작한다.
export const BASE_STAT = 10
export const STAT_KEYS = ['str', 'agi', 'vit', 'int']
export const PRIMARY_STATS = ['str', 'agi', 'int']

// 시작 시 배분하는 보너스와, 기본값까지 포함한 스탯 합계 상한이다.
export const STARTING_BONUS_POINTS = 50
export const STAT_POINT_CAP = 200
export const FLOORS_PER_STAT_POINT = 4

export const BASE_HP = 100
export const HP_PER_VIT = 10
export const BASE_MP = 100
export const MP_PER_INT = 10

export const STR_ATK_PER_STR = 1.5
export const STR_ATK_PER_AGI = 0.2
export const AGI_ATK_PER_AGI = 1.2
export const AGI_ATK_PER_STR = 0.3
export const INT_ATK_PER_INT = 1.5

export const BASE_ATTACK_SPEED = 1
export const ATTACK_SPEED_BONUS_CAP_PERCENT = 60
export const AGI_SPEED_FIRST_BAND = 40
export const AGI_SPEED_SECOND_BAND = 80
export const AGI_SPEED_FIRST_PERCENT = 0.8
export const AGI_SPEED_SECOND_PERCENT = 0.4
export const AGI_SPEED_REST_PERCENT = 0.1

export const CRIT_PERCENT_PER_AGI = 0.2
export const CRIT_DAMAGE_MULTIPLIER = 1.5
export const MIN_DAMAGE = 1

// 놋쇠검의 무기 공격력. 방어구가 없으면 방어력은 0이다.
export const BRASS_SWORD_ATK = 8
