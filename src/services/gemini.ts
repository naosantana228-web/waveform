// Gemini Flash AI Recommendations Service
// Uses Google AI Studio free tier
// User must provide their own API key via the Settings page

// Try multiple models in order - some may not be available depending on the API key
const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-1.5-flash',
  'gemini-pro',
];

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const STORAGE_KEY_API = 'waveform_gemini_key';
const STORAGE_KEY_MODEL = 'waveform_working_model';

export function getGeminiApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY_API);
}

export function setGeminiApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY_API, key);
  // Clear cached model when key changes
  localStorage.removeItem(STORAGE_KEY_MODEL);
}

export function removeGeminiApiKey() {
  localStorage.removeItem(STORAGE_KEY_API);
  localStorage.removeItem(STORAGE_KEY_MODEL);
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

// Helper: call Gemini with model fallback (single call, caches working model)
async function callGemini(apiKey: string, prompt: string, systemPrompt: string): Promise<string> {
  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.9,
    }
  });

  // Try cached working model first
  const cachedModel = localStorage.getItem(STORAGE_KEY_MODEL);
  const modelsToTry = cachedModel
    ? [cachedModel, ...GEMINI_MODELS.filter(m => m !== cachedModel)]
    : GEMINI_MODELS;

  let lastError = '';

  for (const model of modelsToTry) {
    const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
    console.log(`Trying model: ${model}...`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          // Cache the working model for future calls
          localStorage.setItem(STORAGE_KEY_MODEL, model);
          console.log(`Success with model: ${model}`);
          return text;
        }
        lastError = `${model}: empty response`;
        continue;
      }

      const err = await response.text();
      console.warn(`Model ${model} failed (${response.status}):`, err.slice(0, 150));

      if (response.status === 400 && err.includes('API_KEY_INVALID')) {
        throw new Error('Invalid API key. Check your key in Settings.');
      }
      if (response.status === 403) {
        throw new Error('API key not authorized. Make sure your key is valid and the Generative Language API is enabled in your Google Cloud project.');
      }
      if (response.status === 429) {
        throw new Error('Rate limited. Wait 60 seconds and try again. The free tier allows ~15 requests/minute.');
      }

      lastError = `${model}: ${response.status}`;
      continue;
    } catch (fetchErr: any) {
      if (fetchErr.message.includes('API key') || fetchErr.message.includes('Rate limited') || fetchErr.message.includes('not authorized')) {
        throw fetchErr;
      }
      lastError = `${model}: ${fetchErr.message}`;
      continue;
    }
  }

  throw new Error(`No working model found. Last error: ${lastError}. Make sure your API key is from Google AI Studio (aistudio.google.com/apikey).`);
}

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

  const text = await callGemini(apiKey, prompt, systemPrompt);

  try {
    const parsed = JSON.parse(text);
    const tracks = parsed.tracks || [];
    // Filter out tracks without valid-looking YouTube IDs
    return tracks.filter((t: any) => t.youtubeId && t.youtubeId.length === 11);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const tracks = parsed.tracks || [];
      return tracks.filter((t: any) => t.youtubeId && t.youtubeId.length === 11);
    }
    throw new Error('Failed to parse AI response');
  }
}
