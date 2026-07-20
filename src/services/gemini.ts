// Gemini Flash AI Recommendations Service
// Uses Google AI Studio free tier (Gemini 3.5 Flash)
// User must provide their own API key via the Settings page

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Gemini API error:', response.status, err);
    if (response.status === 429) {
      throw new Error('Rate limited. Free tier allows ~15 requests/minute. Wait a moment and try again.');
    }
    if (response.status === 400 && err.includes('API_KEY_INVALID')) {
      throw new Error('Invalid API key. Check your key in Settings.');
    }
    if (response.status === 403) {
      throw new Error('API key not authorized. Make sure your key is valid and the Generative Language API is enabled in your Google Cloud project.');
    }
    if (response.status === 404) {
      throw new Error('Model not found. The API may have been updated.');
    }
    // Try to extract a useful message
    try {
      const errJson = JSON.parse(err);
      const msg = errJson?.error?.message || `API error ${response.status}`;
      throw new Error(msg);
    } catch (parseErr) {
      throw new Error(`Gemini API error: ${response.status} - ${err.slice(0, 200)}`);
    }
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
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

// Search YouTube for a track (using YouTube's oEmbed - no API key needed)
export async function searchYouTubeId(artist: string, title: string): Promise<string | null> {
  try {
    // Use YouTube's search page via a CORS proxy approach
    // Since we're client-side only, we'll use the invidious API (public, no key needed)
    const query = encodeURIComponent(`${artist} ${title} official audio`);
    const response = await fetch(`https://inv.nadeko.net/api/v1/search?q=${query}&type=video`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const results = await response.json();
    if (results && results.length > 0 && results[0].videoId) {
      return results[0].videoId;
    }
    return null;
  } catch {
    return null;
  }
}
