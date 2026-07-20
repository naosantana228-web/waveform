// Gemini Flash AI Recommendations Service
// Uses Google AI Studio free tier (Gemini 3.5 Flash)
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
  artistBio: string;
  artistFacts: string[];
  attributes: { energy: number; groove: number; vocals: number; darkness: number; bpm: number };
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
  const existingList = existingTracks.map(t => `${t.artist} - ${t.title}`).join(", ");
  const likedList = likedTracks.slice(0, 20).map(t => `${t.artist} - ${t.title}`).join(", ");

  const prompt = likedTracks.length > 0
    ? `Based on these liked tracks in the "${genreDesc}" genre: ${likedList}

Recommend ${limit} NEW and DIFFERENT tracks that match this taste but EXPAND the selection. Dig deeper — suggest tracks from lesser-known artists, B-sides, deep cuts, and underground releases. Prioritize variety and discovery.

IMPORTANT: Do NOT recommend ANY of these (already in library): ${existingList}

For each track provide a JSON object with: title, artist, year (integer), label, artistBio (1-2 sentences), artistFacts (array of 3 strings), attributes (object with energy 1-10, groove 1-10, vocals 1-10, darkness 1-10, bpm integer).

Respond ONLY with a JSON object: { "tracks": [...] }`
    : `Recommend ${limit} essential but UNDERGROUND tracks in the "${genreDesc}" genre. Avoid mainstream choices.

IMPORTANT: Do NOT recommend ANY of these (already in library): ${existingList}

For each track provide a JSON object with: title, artist, year (integer), label, artistBio (1-2 sentences), artistFacts (array of 3 strings), attributes (object with energy 1-10, groove 1-10, vocals 1-10, darkness 1-10, bpm integer).

Respond ONLY with a JSON object: { "tracks": [...] }`;

  const requestBody = JSON.stringify({
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    systemInstruction: {
      parts: [{
        text: "You are a crate-digging music expert and record collector with deep knowledge of independent labels and underground music. You NEVER repeat tracks already in the user's library. Always respond with valid JSON only, no markdown formatting. For the infantil genre, all songs MUST be in Spanish."
      }]
    },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.9,
    }
  });

  // Try each model until one works
  let lastError = '';
  let responseData: any = null;

  for (const model of GEMINI_MODELS) {
    const url = `${BASE_URL}/${model}:generateContent?key=${apiKey}`;
    console.log(`Trying model: ${model}...`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });

      if (response.ok) {
        responseData = await response.json();
        console.log(`Success with model: ${model}`);
        break;
      }

      const err = await response.text();
      console.warn(`Model ${model} failed (${response.status}):`, err.slice(0, 100));

      if (response.status === 400 && err.includes('API_KEY_INVALID')) {
        throw new Error('Invalid API key. Check your key in Settings.');
      }
      if (response.status === 403) {
        throw new Error('API key not authorized. Make sure your key is valid and the Generative Language API is enabled in your Google Cloud project.');
      }
      if (response.status === 429) {
        throw new Error('Rate limited. Free tier allows ~15 requests/minute. Wait a moment and try again.');
      }

      // 404 = model not found, try next
      lastError = `${model}: ${response.status}`;
      continue;
    } catch (fetchErr: any) {
      // Re-throw auth/rate errors
      if (fetchErr.message.includes('API key') || fetchErr.message.includes('Rate limited') || fetchErr.message.includes('not authorized')) {
        throw fetchErr;
      }
      lastError = `${model}: ${fetchErr.message}`;
      continue;
    }
  }

  if (!responseData) {
    throw new Error(`No working model found. Last error: ${lastError}. Make sure your API key is from Google AI Studio (aistudio.google.com/apikey).`);
  }

  const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');

  try {
    const parsed = JSON.parse(text);
    return parsed.tracks || [];
  } catch {
    // Try to extract JSON from the response
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return parsed.tracks || [];
    }
    throw new Error('Failed to parse AI response');
  }
}

// Search YouTube for a track using multiple fallback methods
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://inv.tux.pizza',
  'https://invidious.privacyredirect.com',
  'https://yewtu.be',
];

export async function searchYouTubeId(artist: string, title: string): Promise<string | null> {
  const query = encodeURIComponent(`${artist} ${title}`);

  // Method 1: Try YouTube Data API v3 (uses the same Google API key)
  const apiKey = getGeminiApiKey();
  if (apiKey) {
    try {
      const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${apiKey}`;
      const response = await fetch(ytUrl, { signal: AbortSignal.timeout(8000) });
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          return data.items[0].id.videoId;
        }
      }
    } catch {
      // Fall through to Invidious
    }
  }

  // Method 2: Try multiple Invidious instances
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/search?q=${query}&type=video`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) continue;
      const results = await response.json();
      if (results && results.length > 0 && results[0].videoId) {
        return results[0].videoId;
      }
    } catch {
      continue;
    }
  }

  // Method 3: Ask Gemini to provide the YouTube ID directly
  if (apiKey) {
    try {
      const url = `${BASE_URL}/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `What is the YouTube video ID for "${title}" by ${artist}? Respond with ONLY the 11-character video ID, nothing else. If you don't know, respond with "UNKNOWN".` }] }],
          generationConfig: { temperature: 0 }
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const data = await response.json();
        const videoId = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (videoId && videoId.length === 11 && videoId !== 'UNKNOWN') {
          return videoId;
        }
      }
    } catch {
      // Give up
    }
  }

  return null;
}
