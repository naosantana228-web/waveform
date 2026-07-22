import tracksJson from "./tracks.json";
import { scheduleSync } from "@/services/gistSync";

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
  { key: "popdance", name: "Pop & Dance", subtitle: "Dua Lipa, Harry Styles, Benny Benassi — upbeat pop-dance hits", color: "accent-popdance" },
  { key: "relax", name: "Relajación & Lectura", subtitle: "Ambient, piano, neo-classical — para leer y relajarse", color: "accent-relax" },
  { key: "salon", name: "Salón de Uñas", subtitle: "Pop hits perfectos para el salón — Taylor, Sabrina, Doja Cat", color: "accent-salon" },
  { key: "custom", name: "Búsqueda Propia", subtitle: "Busca canciones en YouTube y crea tu propia colección", color: "accent-custom" },
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
  // Auto-sync to GitHub Gist (debounced)
  scheduleSync();
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
  const fromJson = allTracks.filter((t) => ids.includes(t.id));
  const customs = getCustomTracks().filter(t => t.genre === genre && ids.includes(t.id));
  return [...fromJson, ...customs];
}

export function getAllLikedTracks(): Track[] {
  const state = getState();
  const allIds = Object.values(state.liked).flat();
  const fromJson = allTracks.filter((t) => allIds.includes(t.id));
  const customs = getCustomTracks().filter(t => allIds.includes(t.id));
  return [...fromJson, ...customs];
}

export function getDislikedTracks(genre: string): Track[] {
  const state = getState();
  const ids = state.disliked[genre] || [];
  return allTracks.filter((t) => ids.includes(t.id));
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

// Custom tracks (user-added via YouTube search)
const CUSTOM_TRACKS_KEY = "waveform_custom_tracks";

export function getCustomTracks(): Track[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TRACKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function addCustomTrack(track: Omit<Track, 'id'>): Track {
  const customs = getCustomTracks();
  const id = 9000000 + customs.length + 1 + Math.floor(Math.random() * 1000);
  const newTrack: Track = { ...track, id } as Track;
  customs.push(newTrack);
  localStorage.setItem(CUSTOM_TRACKS_KEY, JSON.stringify(customs));
  // Auto-like the custom track
  likeTrack(track.genre, id);
  return newTrack;
}

export function removeCustomTrack(trackId: number) {
  const customs = getCustomTracks().filter(t => t.id !== trackId);
  localStorage.setItem(CUSTOM_TRACKS_KEY, JSON.stringify(customs));
}

export function getAllTracksIncludingCustom(): Track[] {
  return [...allTracks, ...getCustomTracks()];
}
