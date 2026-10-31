export const MESSAGE_LOG_LIMIT = 8

// 우측 하단 반투명 메시지 창. 확인 없이 전투 결과를 흘려보낸다.
export const createMessageLog = () => {
  const root = document.getElementById('message-log')
  const list = document.getElementById('message-log-list')
  const lines = []

  const render = () => {
    if (!(list instanceof HTMLElement)) {
      return
    }
    list.replaceChildren()
    lines.forEach((line) => {
      const item = document.createElement('li')
      item.textContent = line
      list.appendChild(item)
    })
    list.scrollTop = list.scrollHeight
  }

  const push = (text) => {
    try {
      const message = String(text || '').trim()
      if (!message) {
        return
      }
      lines.push(message)
      while (lines.length > MESSAGE_LOG_LIMIT) {
        lines.shift()
      }
      if (root instanceof HTMLElement) {
        root.hidden = false
      }
      render()
    } catch (error) {
      console.error('메시지 표시 실패', error)
    }
  }

  try {
    if (!(root instanceof HTMLElement) || !(list instanceof HTMLElement)) {
      throw new Error('메시지 창을 찾을 수 없습니다.')
    }
    root.hidden = false
    render()
  } catch (error) {
    console.error('메시지 창 준비 실패', error)
  }

  return {
    push,
    clear: () => {
      lines.length = 0
      render()
    },
  }
}
