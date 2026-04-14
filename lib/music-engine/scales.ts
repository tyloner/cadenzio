export type ScaleName =
  | "major"
  | "natural_minor"
  | "pentatonic_major"
  | "pentatonic_minor"
  | "blues"
  | "dorian"
  | "lydian"
  | "phrygian"

export type GenreName =
  | "classical"
  | "blues"
  | "jazz"
  | "ambient"
  | "electronic"

export type InstrumentName = "piano" | "synth" | "violin" | "drums"

// Semitone intervals from root
export const SCALES: Record<ScaleName, number[]> = {
  major:             [0, 2, 4, 5, 7, 9, 11],
  natural_minor:     [0, 2, 3, 5, 7, 8, 10],
  pentatonic_major:  [0, 2, 4, 7, 9],
  pentatonic_minor:  [0, 3, 5, 7, 10],
  blues:             [0, 3, 5, 6, 7, 10],
  dorian:            [0, 2, 3, 5, 7, 9, 10],
  lydian:            [0, 2, 4, 6, 7, 9, 11],
  phrygian:          [0, 1, 3, 5, 7, 8, 10],
}

export type RhythmPattern = {
  /** Emit a rhythm hit every N lead events */
  stride: number
  /** Offset alternate hits by a third-beat for swing feel */
  swing: boolean
  /** Cycling velocity multipliers across the pattern */
  velocityAccent: number[]
}

export const GENRE_CONFIG: Record<
  GenreName,
  {
    scale: ScaleName
    rhythm: boolean
    rhythmPattern: RhythmPattern
    /** Multiplier applied to the bearing-derived step — controls melodic aggressiveness */
    stepScale: number
    /** Absolute cap on step size per GPS segment */
    maxStep: number
    /** How many notes form one phrase before direction resets */
    phraseLength: number
    /** Velocity range [min, max] — speed drives within this band */
    velocityMin: number
    velocityMax: number
  }
> = {
  //                                                                              stepScale maxStep phrase  vel min  vel max
  classical:  { scale: "major",    rhythm: false, rhythmPattern: { stride: 4, swing: false, velocityAccent: [1.0, 0.6, 0.8, 0.6] }, stepScale: 0.6, maxStep: 4,  phraseLength: 8,  velocityMin: 0.35, velocityMax: 0.85 },
  blues:      { scale: "blues",    rhythm: true,  rhythmPattern: { stride: 3, swing: true,  velocityAccent: [1.0, 0.7, 0.9]       }, stepScale: 1.0, maxStep: 6,  phraseLength: 8,  velocityMin: 0.25, velocityMax: 0.95 },
  jazz:       { scale: "dorian",   rhythm: true,  rhythmPattern: { stride: 4, swing: true,  velocityAccent: [1.0, 0.5, 0.8, 0.5]  }, stepScale: 1.2, maxStep: 8,  phraseLength: 6,  velocityMin: 0.30, velocityMax: 0.90 },
  ambient:    { scale: "lydian",   rhythm: false, rhythmPattern: { stride: 8, swing: false, velocityAccent: [0.6]                  }, stepScale: 0.3, maxStep: 2,  phraseLength: 16, velocityMin: 0.15, velocityMax: 0.50 },
  electronic: { scale: "phrygian", rhythm: true,  rhythmPattern: { stride: 2, swing: false, velocityAccent: [1.0, 0.8, 1.0, 0.6]  }, stepScale: 1.0, maxStep: 7,  phraseLength: 4,  velocityMin: 0.50, velocityMax: 1.00 },
}

export type InstrumentConfig = {
  emoji: string
  /** null = no reverb for this instrument */
  reverb: { decay: number; wet: number } | null
  padVolume: number
  /** Whether rhythm track should be louder/more prominent */
  rhythmProminent: boolean
}

export const INSTRUMENT_CONFIG: Record<InstrumentName, InstrumentConfig> = {
  piano:  { emoji: "🎹", reverb: { decay: 1.5, wet: 0.25 }, padVolume: -12, rhythmProminent: false },
  violin: { emoji: "🎻", reverb: { decay: 3.0, wet: 0.40 }, padVolume: -12, rhythmProminent: false },
  synth:  { emoji: "🎛️", reverb: null,                       padVolume: -12, rhythmProminent: false },
  drums:  { emoji: "🥁", reverb: null,                       padVolume: -30, rhythmProminent: true  },
}

/** Genre-specific oscillator type used when instrument = "synth" */
export const GENRE_OSC: Record<GenreName, string> = {
  blues:      "sawtooth",
  electronic: "square",
  jazz:       "triangle",
  classical:  "triangle",
  ambient:    "sine",
}

// MIDI note number from note name (e.g. "C4" = 60)
export function noteNameToMidi(name: string): number {
  const noteMap: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  }
  const match = name.match(/^([A-G])(#?)(\d)$/)
  if (!match) return 60
  const semitone = noteMap[match[1]] + (match[2] === "#" ? 1 : 0)
  const octave = parseInt(match[3], 10)
  return 12 * (octave + 1) + semitone
}

// Build full MIDI note array for a scale starting at rootMidi
export function buildScale(rootMidi: number, scale: ScaleName): number[] {
  const intervals = SCALES[scale]
  const notes: number[] = []
  // 3 octaves up, 1 down
  for (let oct = -1; oct <= 3; oct++) {
    for (const interval of intervals) {
      notes.push(rootMidi + oct * 12 + interval)
    }
  }
  return notes.filter((n) => n >= 21 && n <= 108).sort((a, b) => a - b)
}
