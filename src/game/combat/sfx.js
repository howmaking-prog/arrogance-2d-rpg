const SWING_SECONDS = 0.09
const HIT_SECONDS = 0.12

const contextOf = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) {
    throw new Error('이 브라우저에는 오디오가 없습니다.')
  }
  return new AudioContext()
}

// 짧은 쇠 소리와 타격음을 만들어 재생한다. 파일 없이 바로 낸다.
export const createHitSounds = () => {
  let context = null

  const ensure = () => {
    if (!context) {
      context = contextOf()
    }
    if (context.state === 'suspended') {
      context.resume().catch((error) => {
        console.error('타격음 재개 실패', error)
      })
    }
    return context
  }

  const tone = (audio, frequency, seconds, type, volume) => {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    const now = audio.currentTime
    osc.type = type
    osc.frequency.setValueAtTime(frequency, now)
    osc.frequency.exponentialRampToValueAtTime(Math.max(48, frequency * 0.45), now + seconds)
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + seconds)
    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start(now)
    osc.stop(now + seconds)
  }

  const noise = (audio, seconds, volume, frequency) => {
    const length = Math.max(1, Math.floor(audio.sampleRate * seconds))
    const buffer = audio.createBuffer(1, length, audio.sampleRate)
    const data = buffer.getChannelData(0)
    for (let index = 0; index < length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / length)
    }
    const source = audio.createBufferSource()
    const filter = audio.createBiquadFilter()
    const gain = audio.createGain()
    source.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.value = frequency
    gain.gain.value = volume
    source.connect(filter)
    filter.connect(gain)
    gain.connect(audio.destination)
    source.start()
  }

  return {
    unlock: () => {
      try {
        ensure()
      } catch (error) {
        console.error('타격음 준비 실패', error)
      }
    },
    playStrike: (who, crit) => {
      try {
        const audio = ensure()
        const metal = who === 'player'
        tone(audio, crit ? 740 : metal ? 520 : 180, metal ? SWING_SECONDS : HIT_SECONDS, metal ? 'triangle' : 'square', crit ? 0.22 : 0.16)
        noise(audio, metal ? 0.07 : 0.09, crit ? 0.2 : 0.12, metal ? 1800 : 420)
      } catch (error) {
        console.error('타격음 재생 실패', error)
      }
    },
  }
}
