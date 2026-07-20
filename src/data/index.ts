import tracksJson from "./tracks.json";

export interface Track {
  id: number;
  title: string;
  artist: string;
  genre: string;
  youtubeId: string;
  attributes: string | null;
  artistBio: string | null;
  artistFacts: string | null;
  label: string | null;
  year: number | null;
  isAiRecommended: number | null;
}

export const allTracks: Track[] = tracksJson as Track[];

export const genres = [
  { key: "techno", name: "Deep & Groovy House", subtitle: "Warm, soulful deep house and lo-fi grooves", color: "accent-techno" },
  { key: "afrobeats", name: "Afrobeats & Melancholic R&B", subtitle: "Introspective, emotional Afrobeats", color: "accent-afrobeats" },
  { key: "reggae", name: "Roots Reggae", subtitle: "Pure roots reggae — spiritual, conscious", color: "accent-reggae" },
  { key: "reggaeton", name: "Reggaetón Moderno", subtitle: "Modern reggaetón — Bad Bunny, Feid, Mora", color: "accent-reggaeton" },
  { key: "hiphop", name: "Hip-Hop & R&B Blends", subtitle: "Hip-Hop/R&B crossover — smooth and soulful", color: "accent-hiphop" },
  { key: "infantil", name: "Canciones Infantiles", subtitle: "Canciones divertidas para cantar y bailar — Frozen, CantaJuego", color: "accent-infantil" },
] as const;

export function getTracksByGenre(genre: string): Track[] {
  return allTracks.filter((t) => t.genre === genre);
}

// localStorage helpers
const STORAGE_KEY = "waveform_state";
const INITIALIZED_KEY = "waveform_initialized_v2";

interface AppState {
  liked: Record<string, number[]>; // genre -> track ids
  disliked: Record<string, number[]>;
  broken: Record<string, number[]>;
}

function getState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { liked: {}, disliked: {}, broken: {} };
}

function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// Pre-populate all tracks as liked on first visit
export function initializeState() {
  const initialized = localStorage.getItem(INITIALIZED_KEY);
  if (initialized) return;

  const state: AppState = { liked: {}, disliked: {}, broken: {} };
  for (const track of allTracks) {
    if (!state.liked[track.genre]) state.liked[track.genre] = [];
    state.liked[track.genre].push(track.id);
  }
  saveState(state);
  localStorage.setItem(INITIALIZED_KEY, "true");
}

export function getLikedTracks(genre: string): Track[] {
  const state = getState();
  const ids = state.liked[genre] || [];
  return allTracks.filter((t) => ids.includes(t.id));
}

export function getAllLikedTracks(): Track[] {
  const state = getState();
  const allIds = Object.values(state.liked).flat();
  return allTracks.filter((t) => allIds.includes(t.id));
}

export function getDiscoveryQueue(genre: string): Track[] {
  const state = getState();
  const seen = [
    ...(state.liked[genre] || []),
    ...(state.disliked[genre] || []),
    ...(state.broken[genre] || []),
  ];
  return getTracksByGenre(genre).filter((t) => !seen.includes(t.id));
}

export function likeTrack(genre: string, trackId: number) {
  const state = getState();
  if (!state.liked[genre]) state.liked[genre] = [];
  if (!state.liked[genre].includes(trackId)) state.liked[genre].push(trackId);
  saveState(state);
}

export function dislikeTrack(genre: string, trackId: number) {
  const state = getState();
  if (!state.disliked[genre]) state.disliked[genre] = [];
  if (!state.disliked[genre].includes(trackId)) state.disliked[genre].push(trackId);
  // Also remove from liked if it was there
  if (state.liked[genre]) {
    state.liked[genre] = state.liked[genre].filter((id) => id !== trackId);
  }
  saveState(state);
}

export function markBroken(genre: string, trackId: number) {
  const state = getState();
  if (!state.broken[genre]) state.broken[genre] = [];
  if (!state.broken[genre].includes(trackId)) state.broken[genre].push(trackId);
  // Also remove from liked if it was there
  if (state.liked[genre]) {
    state.liked[genre] = state.liked[genre].filter((id) => id !== trackId);
  }
  saveState(state);
}

export function unlikeTrack(genre: string, trackId: number) {
  const state = getState();
  if (state.liked[genre]) {
    state.liked[genre] = state.liked[genre].filter((id) => id !== trackId);
  }
  saveState(state);
}

export function resetDiscovery(genre: string) {
  const state = getState();
  // Move disliked and broken back to available (they won't be in liked)
  state.disliked[genre] = [];
  state.broken[genre] = [];
  saveState(state);
}

export function resetAll() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(INITIALIZED_KEY);
  initializeState();
}
