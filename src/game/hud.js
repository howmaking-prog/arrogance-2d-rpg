// 하단 단축키로 가운데 창을 열고 닫는다.
export const createHud = () => {
  try {
    const hotbar = document.getElementById('hotbar')
    if (!(hotbar instanceof HTMLElement)) {
      throw new Error('단축키 슬롯을 찾을 수 없습니다.')
    }

    const buttons = [...hotbar.querySelectorAll('[data-window]')]

    const setOpen = (id, open) => {
      const panel = document.getElementById(id)
      if (!(panel instanceof HTMLElement)) {
        return
      }
      panel.hidden = !open
      buttons.forEach((button) => {
        if (button.getAttribute('data-window') === id) {
          button.setAttribute('aria-pressed', open ? 'true' : 'false')
        }
      })
    }

    const openWindow = (id) => {
      buttons.forEach((button) => {
        const target = button.getAttribute('data-window')
        if (target) {
          setOpen(target, target === id)
        }
      })
    }

    hotbar.addEventListener('click', (event) => {
      try {
        if (!(event.target instanceof Element)) {
          return
        }
        const button = event.target.closest('[data-window]')
        if (!(button instanceof HTMLElement)) {
          return
        }
        const id = button.getAttribute('data-window')
        const panel = id ? document.getElementById(id) : null
        if (!id || !(panel instanceof HTMLElement)) {
          return
        }
        if (panel.hidden) {
          openWindow(id)
          return
        }
        setOpen(id, false)
      } catch (error) {
        console.error('단축키 처리 실패', error)
      }
    })

    document.querySelectorAll('[data-close]').forEach((button) => {
      button.addEventListener('click', () => {
        try {
          const id = button.getAttribute('data-close')
          if (id) {
            setOpen(id, false)
          }
        } catch (error) {
          console.error('창 닫기 실패', error)
        }
      })
    })
  } catch (error) {
    console.error('화면 창 준비 실패', error)
  }
}
