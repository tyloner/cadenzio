"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Music2 } from "lucide-react"

const SPEEDS = [1, 1.5, 2, 3] as const
type Speed = typeof SPEEDS[number]

interface NoteEvent {
  note: number
  duration: string
  time: number
  velocity: number
  track: "lead" | "rhythm" | "pad"
}

interface Props {
  midiEvents: NoteEvent[]
  bpmAvg: number | null
  genre: string
  instrument?: string
  startingNote: string
  scale: string
  onProgress?: (progress: number) => void
}

import { INSTRUMENT_CONFIG, GENRE_OSC, type InstrumentName, type GenreName } from "@/lib/music-engine/scales"

type ToneModule = typeof import("tone")

// Salamander Grand Piano — sampled every ~3 semitones, interpolated by Tone.Sampler
const PIANO_URLS: Record<string, string> = {
  A0: "A0.mp3",  C1: "C1.mp3",  "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
  A1: "A1.mp3",  C2: "C2.mp3",  "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
  A2: "A2.mp3",  C3: "C3.mp3",  "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
  A3: "A3.mp3",  C4: "C4.mp3",  "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
  A4: "A4.mp3",  C5: "C5.mp3",  "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
  A5: "A5.mp3",  C6: "C6.mp3",  "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
  A7: "A7.mp3",  C8: "C8.mp3",
}

export function CompositionPlayer({ midiEvents, bpmAvg, genre, instrument = "piano", startingNote, scale, onProgress }: Props) {
  const [playing, setPlaying]         = useState(false)
  const [progress, setProgress]       = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [loaded, setLoaded]           = useState(false)
  const [speed, setSpeed]             = useState<Speed>(1)

  const T                = useRef<ToneModule | null>(null)
  const disposables      = useRef<{ dispose: () => void }[]>([])
  const animRef          = useRef<number | null>(null)
  const lastReportedProg = useRef(-1)
  // Pre-loaded piano sampler (lives across plays; disposed on unmount / instrument change)
  const pianoSamplerRef  = useRef<InstanceType<ToneModule["Sampler"]> | null>(null)

  const totalDuration = midiEvents.length > 0
    ? Math.max(...midiEvents.map(e => e.time)) + 2
    : 0

  useEffect(() => {
    setLoaded(false)
    let cancelled = false
    import("tone").then(async (mod) => {
      T.current = mod
      if (instrument === "piano") {
        const sampler = new mod.Sampler({
          urls: PIANO_URLS,
          release: 1,
          baseUrl: "https://tonejs.github.io/audio/salamander/",
        })
        pianoSamplerRef.current = sampler
        await mod.loaded() // wait until all MP3s are buffered
      }
      if (!cancelled) setLoaded(true)
    })
    return () => {
      cancelled = true
      cleanup()
      try { pianoSamplerRef.current?.dispose() } catch { /* */ }
      pianoSamplerRef.current = null
    }
  }, [instrument])

  function midiToHz(midi: number) {
    return 440 * Math.pow(2, (midi - 69) / 12)
  }

  function midiToNoteName(midi: number): string {
    const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
    const octave = Math.floor(midi / 12) - 1
    return names[midi % 12] + octave
  }

  function cleanup() {
    const Tone = T.current
    if (!Tone) return
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
    disposables.current.forEach(d => { try { d.dispose() } catch { /* already disposed */ } })
    disposables.current = []
    if (animRef.current) cancelAnimationFrame(animRef.current)
    lastReportedProg.current = -1
  }

  async function togglePlay() {
    const Tone = T.current
    if (!Tone || !loaded) return

    if (playing) {
      Tone.getTransport().pause()
      if (animRef.current) cancelAnimationFrame(animRef.current)
      setPlaying(false)
      return
    }

    // Reset if finished
    if (progress >= 0.99) {
      cleanup()
      setProgress(0)
      setCurrentTime(0)
    }

    await Tone.start()

    Tone.getTransport().bpm.value = bpmAvg ?? 90
    Tone.getTransport().playbackRate = speed

    const knownInstrument = (instrument in INSTRUMENT_CONFIG)
      ? instrument as InstrumentName
      : (() => { console.warn(`Unknown instrument "${instrument}", falling back to synth`); return "synth" as InstrumentName })()

    const instConfig = INSTRUMENT_CONFIG[knownInstrument]
    const oscType    = GENRE_OSC[genre as GenreName] ?? "triangle"
    const isAmbient  = genre === "ambient"

    // Lead synth — real samples for piano, synthesis for others
    type LeadSynth = { triggerAttackRelease: (f: number | string, d: string, t: number, v: number) => void; connect: (n: { connect?: unknown }) => void; dispose: () => void; volume: { value: number } }

    let leadSynth: LeadSynth
    let leadOwnedByDisposables = true // false for sampler (reused across plays)

    if (knownInstrument === "piano" && pianoSamplerRef.current) {
      // Real Salamander Grand Piano samples — loaded in useEffect
      leadSynth = pianoSamplerRef.current as unknown as LeadSynth
      leadOwnedByDisposables = false
    } else if (knownInstrument === "violin") {
      // FMSynth: frequency modulation → bowed-string resonance
      const fm = new Tone.FMSynth({
        harmonicity: 3.01,
        oscillator: { type: "sine" },
        envelope: { attack: 0.12, decay: 0.2, sustain: 0.8, release: 2.0 },
        modulation: { type: "sine" },
        modulationIndex: 10,
        modulationEnvelope: { attack: 0.1, decay: 0.2, sustain: 1, release: 1.5 },
      })
      leadSynth = fm as unknown as LeadSynth
    } else if (knownInstrument === "drums") {
      // Synth with very short, punchy envelope for pitched percussion
      const s = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.005, decay: 0.08, sustain: 0.05, release: 0.15 },
      })
      s.volume.value = -8
      leadSynth = s as unknown as LeadSynth
    } else {
      // synth — genre-driven oscillator, existing behaviour
      const s = new Tone.Synth({
        oscillator: { type: oscType as OscillatorType },
        envelope: { attack: isAmbient ? 0.3 : 0.05, decay: 0.2, sustain: 0.6, release: isAmbient ? 2.0 : 0.6 },
      })
      leadSynth = s as unknown as LeadSynth
    }

    // Pad synth
    const padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.4, decay: 0.5, sustain: 0.7, release: 2 },
    })
    padSynth.volume.value = instConfig.padVolume

    // Rhythm synth — volume/octaves driven by instrument config
    const rhythmSynth = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: instConfig.rhythmProminent ? 6 : 4 })
    rhythmSynth.volume.value = instConfig.rhythmProminent ? 2 : -6

    // Output gain
    const masterGain = new Tone.Gain(0.75).toDestination()

    // Reverb — defined per instrument; ambient genre adds a gentle override when instrument has no reverb
    const reverbParams = instConfig.reverb ?? (isAmbient ? { decay: 5, wet: 0.6 } : null)
    let reverbNode: InstanceType<ToneModule["Reverb"]> | null = null
    if (reverbParams) {
      reverbNode = new Tone.Reverb(reverbParams)
      reverbNode.toDestination()
      leadSynth.connect(reverbNode as unknown as { connect?: unknown })
      padSynth.connect(reverbNode)
    } else {
      leadSynth.connect(masterGain as unknown as { connect?: unknown })
      padSynth.connect(masterGain)
    }
    rhythmSynth.connect(masterGain)

    // Schedule events via Part
    const lead = midiEvents.filter(e => e.track === "lead")
    const pads = midiEvents.filter(e => e.track === "pad")
    const hits = midiEvents.filter(e => e.track === "rhythm")

    const isPiano = knownInstrument === "piano"
    const leadPart = new Tone.Part<NoteEvent>((time, e) => {
      // Sampler needs note names for accurate pitch interpolation; synths use Hz
      const note = isPiano ? midiToNoteName(e.note) : midiToHz(e.note)
      leadSynth.triggerAttackRelease(note, e.duration, time, e.velocity)
    }, lead.map(e => [e.time, e]) as unknown as NoteEvent[])

    const padPart = new Tone.Part<NoteEvent>((time, e) => {
      padSynth.triggerAttackRelease(midiToHz(e.note), "2n", time, e.velocity)
    }, pads.map(e => [e.time, e]) as unknown as NoteEvent[])

    const rhythmPart = new Tone.Part<NoteEvent>((time) => {
      rhythmSynth.triggerAttackRelease("C1", "16n", time)
    }, hits.map(e => [e.time, e]) as unknown as NoteEvent[])

    leadPart.start(0)
    padPart.start(0)
    rhythmPart.start(0)

    disposables.current = [
      // Piano sampler is reused across plays — exclude it; everything else is recreated each time
      ...(leadOwnedByDisposables ? [leadSynth as { dispose: () => void }] : []),
      padSynth, rhythmSynth, masterGain,
      ...(reverbNode ? [reverbNode] : []),
      leadPart, padPart, rhythmPart,
    ]

    Tone.getTransport().start()
    setPlaying(true)

    const tick = () => {
      const Tone2 = T.current
      if (!Tone2) return
      const sec = Tone2.getTransport().seconds
      const p = Math.min(1, sec / totalDuration)
      setCurrentTime(sec)
      setProgress(p)
      // Report to map ~5×/sec (every 2% progress change)
      if (onProgress && Math.abs(p - lastReportedProg.current) >= 0.02) {
        lastReportedProg.current = p
        onProgress(p)
      }
      if (sec >= totalDuration) {
        cleanup()
        onProgress?.(1)
        setPlaying(false)
        return
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const Tone = T.current
    if (!Tone) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    Tone.getTransport().seconds = ratio * totalDuration
    setCurrentTime(ratio * totalDuration)
    setProgress(ratio)
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60)
    return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`
  }

  if (midiEvents.length === 0) return null

  return (
    <div className="bg-mist rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={!loaded}
          className="w-11 h-11 rounded-full bg-wave text-white flex items-center justify-center hover:bg-wave/80 transition-colors disabled:opacity-40 flex-shrink-0 shadow-sm"
          aria-label={playing ? "Pause" : "Play composition"}
        >
          {playing
            ? <Pause size={16} />
            : <Play size={16} className="ml-0.5" />}
        </button>

        {/* Progress bar */}
        <div className="flex-1 min-w-0">
          <div
            className="h-2 bg-border rounded-full overflow-hidden cursor-pointer"
            onClick={handleSeek}
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
          >
            <div
              className="h-full bg-wave rounded-full"
              style={{ width: `${progress * 100}%`, transition: playing ? "none" : undefined }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted mt-1 tabular-nums">
            <span>{fmt(currentTime / speed)}</span>
            <span>{fmt(totalDuration / speed)}</span>
          </div>
        </div>

        {/* Speed control */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setSpeed(s)
                if (T.current) T.current.getTransport().playbackRate = s
              }}
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors leading-tight ${
                speed === s ? "bg-wave text-white" : "text-muted hover:text-ink"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Music2 size={11} className="text-wave flex-shrink-0" />
        <span className="capitalize">{INSTRUMENT_CONFIG[instrument as InstrumentName]?.emoji ?? "🎵"} {instrument} · {startingNote} · {scale.replace(/_/g, " ")} · {genre}{bpmAvg ? ` · ~${Math.round(bpmAvg)} BPM` : ""}</span>
        {!loaded && <span className="ml-auto text-wave/70 animate-pulse">{instrument === "piano" ? "Loading piano…" : "Loading…"}</span>}
      </div>
    </div>
  )
}
