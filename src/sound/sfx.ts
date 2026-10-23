import type { RotorKey } from '@/types/eggs'
import type { SoundName } from '@/types/scene'

let context: AudioContext | null = null
let bus: AudioNode | null = null

const out = (ctx: AudioContext) => bus ?? ctx.destination

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  context ??= new AudioContext()
  if (context.state === 'suspended') void context.resume()
  return context
}

function tone(frequency: number, start: number, length: number, type: OscillatorType = 'sine', volume = 0.2) {
  const ctx = audio()
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + start
  oscillator.type = type
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(volume, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length)
  oscillator.connect(gain).connect(out(ctx))
  oscillator.start(t0)
  oscillator.stop(t0 + length)
}

function noise(start: number, length: number, volume: number, cutoff: number) {
  const ctx = audio()
  if (!ctx) return
  const samples = Math.floor(ctx.sampleRate * length)
  const buffer = ctx.createBuffer(1, samples, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < samples; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / samples) ** 3
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + start
  source.buffer = buffer
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  gain.gain.setValueAtTime(volume, t0)
  source.connect(filter).connect(gain).connect(out(ctx))
  source.start(t0)
}

function thump(start: number, from = 160, to = 45, length = 0.2, volume = 0.5) {
  const ctx = audio()
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + start
  oscillator.frequency.setValueAtTime(from, t0)
  oscillator.frequency.exponentialRampToValueAtTime(to, t0 + length * 0.7)
  gain.gain.setValueAtTime(volume, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length)
  oscillator.connect(gain).connect(out(ctx))
  oscillator.start(t0)
  oscillator.stop(t0 + length + 0.02)
}

type Band = { start: number; length: number; volume: number; frequency: number; q?: number; attack?: number; sweepTo?: number; wobble?: number }

// Band-passed noise with a swell: whooshes, crowds and rumbles.
function band({ start, length, volume, frequency, q = 1, attack = 0.02, sweepTo, wobble = 0 }: Band) {
  const ctx = audio()
  if (!ctx) return
  const samples = Math.floor(ctx.sampleRate * length)
  const buffer = ctx.createBuffer(1, samples, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + start
  source.buffer = buffer
  filter.type = 'bandpass'
  filter.Q.value = q
  filter.frequency.setValueAtTime(frequency, t0)
  if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t0 + length)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + attack)
  if (wobble > 0) {
    for (let t = attack; t < length - 0.1; t += 0.11) gain.gain.linearRampToValueAtTime(volume * (1 - wobble * Math.random()), t0 + t)
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length)
  source.connect(filter).connect(gain).connect(out(ctx))
  source.start(t0)
}

function cheer(start: number, length: number, volume: number) {
  band({ start, length, volume, frequency: 900, q: 0.8, attack: 0.25, wobble: 0.5 })
  band({ start, length: length * 0.9, volume: volume * 0.7, frequency: 2200, q: 1.2, attack: 0.3, wobble: 0.6 })
  for (let i = 0; i < 5; i++) {
    const at = start + 0.1 + Math.random() * length * 0.5
    const ctx = audio()
    if (!ctx) return
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    const t0 = ctx.currentTime + at
    const base = 380 + Math.random() * 260
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(base, t0)
    oscillator.frequency.exponentialRampToValueAtTime(base * 1.6, t0 + 0.35)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(volume * 0.18, t0 + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5)
    oscillator.connect(gain).connect(out(ctx))
    oscillator.start(t0)
    oscillator.stop(t0 + 0.55)
  }
}

function glide(start: number, length: number, from: number, to: number, type: OscillatorType, volume: number, cutoff = 6000) {
  const ctx = audio()
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + start
  oscillator.type = type
  oscillator.frequency.setValueAtTime(from, t0)
  oscillator.frequency.exponentialRampToValueAtTime(to, t0 + length)
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(volume, t0 + Math.min(0.03, length / 4))
  gain.gain.setValueAtTime(volume, t0 + length * 0.7)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length)
  oscillator.connect(filter).connect(gain).connect(out(ctx))
  oscillator.start(t0)
  oscillator.stop(t0 + length + 0.02)
}

function woof(start: number, pitch = 1) {
  glide(start, 0.16, 520 * pitch, 260 * pitch, 'sawtooth', 0.22, 1500)
  glide(start + 0.01, 0.12, 760 * pitch, 380 * pitch, 'square', 0.05, 2200)
  noise(start, 0.08, 0.12, 1200)
}

function wail(start: number, length: number, low: number, high: number, period: number, volume: number) {
  for (let t = 0; t < length; t += period) {
    glide(start + t, period * 0.55, low, high, 'sawtooth', volume, 2600)
    glide(start + t + period * 0.55, period * 0.45, high, low, 'sawtooth', volume, 2600)
  }
}

const GONG_PARTIALS = [1, 2.76, 5.4, 8.93]

const SOUNDS: Record<SoundName, () => void> = {
  ding: () => {
    tone(880, 0, 0.6)
    tone(660, 0.35, 0.8)
  },
  stamp: () => {
    thump(0)
    noise(0, 0.09, 0.35, 1800)
    noise(0.05, 0.05, 0.12, 600)
  },
  ticket: () => {
    tone(1318, 0, 0.5, 'sine', 0.16)
    tone(988, 0.28, 0.9, 'sine', 0.16)
  },
  buzz: () => tone(140, 0, 0.5, 'sawtooth', 0.15),
  fanfare: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.35, 'triangle')),
  tension: () => [220, 233, 220, 233].forEach((f, i) => tone(f, i * 0.4, 0.38, 'sawtooth', 0.08)),
  whoosh: () => tone(300, 0, 0.4, 'triangle', 0.1),
  chime: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.22, 1.4, 'sine', 0.14)),
  punch: () => {
    thump(0, 120 + Math.random() * 60, 40, 0.18, 0.6)
    noise(0, 0.06, 0.4, 3200)
    noise(0.01, 0.12, 0.2, 700)
  },
  swing: () => band({ start: 0, length: 0.22, volume: 0.18, frequency: 600, q: 2, attack: 0.08, sweepTo: 2400 }),
  crowd: () => cheer(0, 2.2, 0.16),
  gong: () => GONG_PARTIALS.forEach((ratio, i) => tone(98 * ratio, 0, 2.6 - i * 0.4, 'sine', 0.16 / (i + 1))),
  ko: () => {
    thump(0, 90, 28, 0.6, 0.8)
    noise(0, 0.3, 0.5, 2000)
    ;[0.12, 0.24, 0.36].forEach((delay, i) => noise(delay, 0.2, 0.18 / (i + 1), 900))
    cheer(0.2, 2.8, 0.2)
  },
  trapdoor: () => {
    thump(0, 70, 30, 0.4, 0.6)
    band({ start: 0.05, length: 1.1, volume: 0.22, frequency: 1600, q: 4, attack: 0.02, sweepTo: 180 })
  },
  bark: () => {
    woof(0)
    woof(0.24, 1.08)
  },
  siren: () => [0, 0.5, 1].forEach(at => {
    tone(960, at, 0.24, 'square', 0.05)
    tone(770, at + 0.25, 0.24, 'square', 0.05)
  }),
  alarm: () => {
    wail(0, 5, 620, 1050, 0.9, 0.07)
    for (let t = 0; t < 5; t += 0.18) tone(2400, t, 0.08, 'square', 0.025)
  },
  partyHorn: () => {
    glide(0, 0.55, 330, 470, 'sawtooth', 0.12, 1800)
    ;[1568, 1976, 2349].forEach((f, i) => tone(f, 0.55 + i * 0.09, 0.4, 'sine', 0.08))
  },
  tbc: () => [82, 82, 110, 98, 82, 123, 110, 98].forEach((f, i) => tone(f, i * 0.17, 0.3, 'sawtooth', 0.09)),
}

export function playSound(name: SoundName) {
  SOUNDS[name]()
}

export function announce(text: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.85
  utterance.pitch = 0.6
  window.speechSynthesis.speak(utterance)
}

const DISCO_BEAT = 0.5
const DISCO_BASS = [55, 55, 82.4, 73.4, 65.4, 65.4, 73.4, 82.4]
const DISCO_CHORDS = [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 294]]

function discoBar(start: number, bar: number) {
  for (let beat = 0; beat < 4; beat++) {
    const at = start + beat * DISCO_BEAT
    thump(at, 140, 42, 0.22, 0.45)
    noise(at + DISCO_BEAT / 2, 0.05, 0.08, 9000)
    glide(at, DISCO_BEAT * 0.45, DISCO_BASS[(bar * 2 + beat) % 8], DISCO_BASS[(bar * 2 + beat) % 8] * 1.01, 'triangle', 0.16, 900)
  }
  DISCO_CHORDS[bar % 4].forEach(f => {
    tone(f * 2, start + DISCO_BEAT * 1.5, 0.18, 'square', 0.025)
    tone(f * 2, start + DISCO_BEAT * 3.5, 0.18, 'square', 0.025)
  })
}

// A short original four-on-the-floor groove for the Konami dance; returns a stop function.
export function playDisco(seconds: number): () => void {
  const ctx = audio()
  if (!ctx) return () => {}
  const gain = ctx.createGain()
  gain.gain.value = 1
  gain.connect(ctx.destination)
  bus = gain
  try {
    for (let bar = 0; bar * 4 * DISCO_BEAT < seconds; bar++) discoBar(bar * 4 * DISCO_BEAT, bar)
  } finally {
    bus = null
  }
  return () => {
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08)
    setTimeout(() => gain.disconnect(), 600)
  }
}

const ROTOR_FADE_S = 0.4

function loopedNoise(ctx: AudioContext): AudioBufferSourceNode {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true
  return source
}

// Helicopter chop: band-passed noise and a low thump pulsed by a blade-rate LFO, following the keyframes.
export function playRotor(keys: RotorKey[]): () => void {
  const ctx = audio()
  if (!ctx || !keys.length) return () => {}
  const t0 = ctx.currentTime
  const master = ctx.createGain()
  const chop = ctx.createGain()
  const depth = ctx.createGain()
  const lfo = ctx.createOscillator()
  const filter = ctx.createBiquadFilter()
  const hum = ctx.createOscillator()
  const humGain = ctx.createGain()
  const noiseSource = loopedNoise(ctx)
  filter.type = 'bandpass'
  filter.frequency.value = 380
  filter.Q.value = 0.7
  lfo.type = 'sawtooth'
  chop.gain.value = 0.5
  depth.gain.value = 0.5
  hum.frequency.value = 52
  humGain.gain.value = 0.35
  lfo.connect(depth).connect(chop.gain)
  noiseSource.connect(filter).connect(chop)
  hum.connect(humGain).connect(chop)
  chop.connect(master).connect(ctx.destination)
  master.gain.setValueAtTime(keys[0].gain * 0.5, t0)
  lfo.frequency.setValueAtTime(keys[0].rate, t0)
  for (const key of keys.slice(1)) {
    master.gain.linearRampToValueAtTime(key.gain * 0.5, t0 + key.at)
    lfo.frequency.linearRampToValueAtTime(key.rate, t0 + key.at)
  }
  const end = t0 + (keys.at(-1)?.at ?? 0) + 0.1
  for (const node of [noiseSource, lfo, hum]) {
    node.start(t0)
    node.stop(end)
  }
  return () => {
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setTargetAtTime(0, ctx.currentTime, ROTOR_FADE_S / 4)
    setTimeout(() => {
      for (const node of [noiseSource, lfo, hum]) {
        try {
          node.stop()
        } catch {
          // already stopped
        }
      }
      master.disconnect()
    }, ROTOR_FADE_S * 1000)
  }
}
