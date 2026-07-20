// Gemini Flash AI Recommendations Service
// Uses Google AI Studio free tier with @google/genai SDK
// The SDK supports the new AQ. format authorization keys

import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY_API = 'waveform_gemini_key';

export function getGeminiApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY_API);
}

export function setGeminiApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY_API, key);
}

export function removeGeminiApiKey() {
  localStorage.removeItem(STORAGE_KEY_API);
}

const genreDescriptions: Record<string, string> = {
  techno: "Deep & Groovy House - warm, soulful, jazzy deep house and lo-fi house with organic grooves. Key artists: Chaos In The CBD, Harrison BDP, DJ Boring, Folamour, Leo Pol, Marc Brauner, HNNY, Kolter, Sweely, Demuja, Mall Grab, Subjoi, Logic1000, Peggy Gou, DJ Koze, Hunee, DJ Seinfeld. Style: deep grooves, jazzy chords, warm pads, lo-fi textures, raw house, organic percussion, soulful samples. NO dark industrial techno, NO mainstream EDM.",
  afrobeats: "Afrobeats & Melancholic R&B - introspective, emotional Afrobeats/Afro-fusion. Artists like Omah Lay, Burna Boy, Wizkid, Tems. Melancholic, soulful, with deep lyrics.",
  reggae: "Roots Reggae - pure roots reggae, spiritual, conscious. Artists like Burning Spear, Peter Tosh, Bob Marley, Steel Pulse, Black Uhuru. No pop, no dancehall.",
  reggaeton: "Reggaetón Moderno - modern reggaeton. Artists like Bad Bunny, Feid, Karol G, Myke Towers, Rauw Alejandro. Perreo, dembow beats, urban Latin.",
  hiphop: "Hip-Hop & R&B Blends - ONLY hip-hop/R&B crossover. Artists like Ja Rule ft. Ashanti, Nelly, 50 Cent, Lauryn Hill, Aaliyah, TLC, Usher, Craig David. Late 90s/early 2000s era. MUST have R&B elements.",
  infantil: "Canciones Infantiles en Español - canciones divertidas para cantar y bailar con niños. CantaJuego, Toy Cantando, Dúo Tiempo de Sol, El Reino Infantil. Canciones como Soy una Taza, La Vaca Lola, Chu Chu Ua. MUST be in Spanish.",
};

export interface RecommendedTrack {
  title: string;
  artist: string;
  year: number;
  label: string;
  youtubeId: string;
  artistBio: string;
  artistFacts: string[];
  attributes: { energy: number; groove: number; vocals: number; darkness: number; bpm: number };
}

// Models to try in order of preference (cheapest/fastest first)
const MODELS_TO_TRY = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-pro',
];

export async function getAIRecommendations(
  genre: string,
  likedTracks: { title: string; artist: string }[],
  existingTracks: { title: string; artist: string }[],
  limit: number = 5
): Promise<RecommendedTrack[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Go to Settings to add your free Gemini API key.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const genreDesc = genreDescriptions[genre] || genre;
  const existingList = existingTracks.slice(0, 50).map(t => `${t.artist} - ${t.title}`).join(", ");
  const likedList = likedTracks.slice(0, 15).map(t => `${t.artist} - ${t.title}`).join(", ");

  const prompt = likedTracks.length > 0
    ? `Based on these liked tracks in the "${genreDesc}" genre: ${likedList}

Recommend ${limit} NEW and DIFFERENT tracks that match this taste but EXPAND the selection. Dig deeper — suggest tracks from lesser-known artists, B-sides, deep cuts, and underground releases. Prioritize variety and discovery.

IMPORTANT: Do NOT recommend ANY of these (already in library): ${existingList}

For EACH track you MUST include the exact YouTube video ID (the 11-character code from youtube.com/watch?v=XXXXXXXXXXX). Only recommend tracks that you are confident have a YouTube video available.

For each track provide a JSON object with: title, artist, year (integer), label, youtubeId (the 11-character YouTube video ID), artistBio (1-2 sentences), artistFacts (array of 3 strings), attributes (object with energy 1-10, groove 1-10, vocals 1-10, darkness 1-10, bpm integer).

Respond ONLY with a JSON object: { "tracks": [...] }`
    : `Recommend ${limit} essential but UNDERGROUND tracks in the "${genreDesc}" genre. Avoid mainstream choices.

IMPORTANT: Do NOT recommend ANY of these (already in library): ${existingList}

For EACH track you MUST include the exact YouTube video ID (the 11-character code from youtube.com/watch?v=XXXXXXXXXXX). Only recommend tracks that you are confident have a YouTube video available.

For each track provide a JSON object with: title, artist, year (integer), label, youtubeId (the 11-character YouTube video ID), artistBio (1-2 sentences), artistFacts (array of 3 strings), attributes (object with energy 1-10, groove 1-10, vocals 1-10, darkness 1-10, bpm integer).

Respond ONLY with a JSON object: { "tracks": [...] }`;

  const systemPrompt = "You are a crate-digging music expert and record collector with deep knowledge of independent labels and underground music. You NEVER repeat tracks already in the user's library. You always include accurate YouTube video IDs for every recommendation. Always respond with valid JSON only, no markdown formatting. For the infantil genre, all songs MUST be in Spanish.";

  // Try models in order until one works
  let lastError = '';
  for (const model of MODELS_TO_TRY) {
    try {
      console.log(`Trying model: ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.9,
        },
      });

      const text = response.text;
      if (!text) {
        lastError = `${model}: empty response`;
        continue;
      }

      console.log(`Success with model: ${model}`);

      // Parse the JSON response
      try {
        const parsed = JSON.parse(text);
        const tracks = parsed.tracks || [];
        const valid = tracks.filter((t: any) => t.youtubeId && t.youtubeId.length === 11);
        if (valid.length > 0) return valid;
        lastError = `${model}: no valid tracks in response`;
        continue;
      } catch {
        // Try to extract JSON from the response
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          const tracks = parsed.tracks || [];
          const valid = tracks.filter((t: any) => t.youtubeId && t.youtubeId.length === 11);
          if (valid.length > 0) return valid;
        }
        lastError = `${model}: failed to parse response`;
        continue;
      }
    } catch (err: any) {
      const msg = err.message || String(err);
      console.warn(`Model ${model} failed:`, msg.slice(0, 200));

      // If it's a clear auth/key error, throw immediately
      if (msg.includes('API_KEY_INVALID') || msg.includes('invalid')) {
        throw new Error('Invalid API key. Check your key in Settings.');
      }
      if (msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
        throw new Error('API key not authorized. Make sure the Generative Language API is enabled in your Google Cloud project.');
      }
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('quota')) {
        throw new Error('Rate limited. Wait 60 seconds and try again.');
      }

      lastError = `${model}: ${msg.slice(0, 100)}`;
      continue;
    }
  }

  throw new Error(`Could not generate recommendations. ${lastError}`);
}
