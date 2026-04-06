import type { NoteEvent } from "./gps-processor"
import type { GenreName, InstrumentName } from "./scales"

export interface StyleAnalysis {
  dominantGenre: GenreName
  personaName: string
  tags: string[]
  bpm: number
}

const PERSONA_MAP: Record<string, Record<string, string>> = {
  blues:      { slow: "Midnight Wanderer",   fast: "Delta Sprinter"    },
  classical:  { slow: "Andante Pilgrim",     fast: "Allegro Runner"    },
  jazz:       { slow: "Bebop Stroller",      fast: "Bebop Rambler"     },
  ambient:    { slow: "Horizon Drifter",     fast: "Sonic Pilgrim"     },
  electronic: { slow: "Pulse Walker",        fast: "Drop Chaser"       },
}

const INSTRUMENT_TAGS: Record<InstrumentName, string> = {
  piano:  "sampled",
  violin: "acoustic",
  synth:  "synthetic",
  drums:  "percussive",
}

export function computeStyleAnalysis(
  events: NoteEvent[],
  genre: GenreName,
  bpm: number,
  totalActivities: number,
  instrument: InstrumentName = "piano"
): StyleAnalysis {
  const pace = bpm < 90 ? "slow" : "fast"
  const personaName = PERSONA_MAP[genre]?.[pace] ?? "Free Spirit"

  const tags: string[] = [genre]

  if (bpm > 130) tags.push("high-tempo")
  if (bpm < 75)  tags.push("contemplative")

  const uniqueNotes = new Set(events.map((e) => e.note)).size
  if (uniqueNotes > 20) tags.push("melodic explorer")
  if (uniqueNotes < 8)  tags.push("minimalist")

  if (totalActivities >= 5)  tags.push("consistent")
  if (totalActivities >= 15) tags.push("dedicated")
  if (totalActivities >= 30) tags.push("legend")

  const instrumentTag = INSTRUMENT_TAGS[instrument]
  if (instrumentTag) tags.push(instrumentTag)

  return { dominantGenre: genre, personaName, tags, bpm }
}
