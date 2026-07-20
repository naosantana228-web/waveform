// AI Recommendations Service using Groq (free tier)
// Groq uses Llama 3.3 70B - fast and free (30 req/min)
// User provides their API key from console.groq.com/keys

const STORAGE_KEY_API = 'waveform_groq_key';
const STORAGE_KEY_API_LEGACY = 'waveform_gemini_key';

export function getGeminiApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY_API) || localStorage.getItem(STORAGE_KEY_API_LEGACY);
}

export function setGeminiApiKey(key: string) {
  localStorage.setItem(STORAGE_KEY_API, key);
  localStorage.removeItem(STORAGE_KEY_API_LEGACY);
}

export function removeGeminiApiKey() {
  localStorage.removeItem(STORAGE_KEY_API);
  localStorage.removeItem(STORAGE_KEY_API_LEGACY);
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

interface TrackInfo {
  title: string;
  artist: string;
  attributes?: string;
}

export async function getAIRecommendations(
  genre: string,
  likedTracks: TrackInfo[],
  existingTracks: TrackInfo[],
  dislikedTracks: TrackInfo[],
  limit: number = 5
): Promise<RecommendedTrack[]> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('No API key configured. Go to Settings to add your free Groq API key (console.groq.com/keys).');
  }

  const genreDesc = genreDescriptions[genre] || genre;

  // Build rich context from liked tracks (up to 30)
  const likedContext = likedTracks.slice(0, 30).map(t => {
    let entry = `${t.artist} - ${t.title}`;
    if (t.attributes) {
      try {
        const attrs = JSON.parse(t.attributes);
        entry += ` [energy:${attrs.energy}/10, groove:${attrs.groove}/10, vocals:${attrs.vocals}/10, darkness:${attrs.darkness}/10, bpm:${attrs.bpm}]`;
      } catch {}
    }
    return entry;
  }).join("\n");

  // Build disliked context (up to 15) - tells AI what to AVOID
  const dislikedContext = dislikedTracks.slice(0, 15).map(t => {
    let entry = `${t.artist} - ${t.title}`;
    if (t.attributes) {
      try {
        const attrs = JSON.parse(t.attributes);
        entry += ` [energy:${attrs.energy}/10, groove:${attrs.groove}/10, vocals:${attrs.vocals}/10, darkness:${attrs.darkness}/10, bpm:${attrs.bpm}]`;
      } catch {}
    }
    return entry;
  }).join("\n");

  // Analyze the user's taste profile from liked tracks
  let tasteProfile = '';
  if (likedTracks.length >= 5) {
    const attrs = likedTracks.slice(0, 30)
      .map(t => { try { return JSON.parse(t.attributes || '{}'); } catch { return null; } })
      .filter(Boolean);
    if (attrs.length > 3) {
      const avg = (key: string) => Math.round(attrs.reduce((sum: number, a: any) => sum + (a[key] || 5), 0) / attrs.length * 10) / 10;
      tasteProfile = `\n\nUSER'S TASTE PROFILE (average from ${attrs.length} liked tracks):
- Energy: ${avg('energy')}/10
- Groove: ${avg('groove')}/10
- Vocals: ${avg('vocals')}/10
- Darkness: ${avg('darkness')}/10
- Average BPM: ${avg('bpm')}
Match these attribute ranges closely. The user prefers tracks within ±1.5 of these averages.`;
    }
  }

  // Analyze most common artists to understand preferences
  const artistCounts: Record<string, number> = {};
  likedTracks.forEach(t => {
    const artist = t.artist.split(' ft.')[0].split(' feat.')[0].split(' &')[0].trim();
    artistCounts[artist] = (artistCounts[artist] || 0) + 1;
  });
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => `${name} (${count} tracks)`)
    .join(', ');

  const existingList = existingTracks.slice(0, 80).map(t => `${t.artist} - ${t.title}`).join(", ");

  const userPrompt = `## Genre: ${genreDesc}

## User's Liked Tracks (${likedTracks.length} total, showing top ${Math.min(30, likedTracks.length)}):
${likedContext || 'None yet'}

## User's Most Played Artists: ${topArtists || 'None yet'}
${tasteProfile}

${dislikedContext ? `## Tracks the user DISLIKED (AVOID similar style/artists):
${dislikedContext}

Analyze WHY the user might have disliked these — maybe too mainstream, wrong tempo, wrong mood, or wrong sub-genre. Avoid recommending anything similar.` : ''}

## Already in library (DO NOT recommend these): 
${existingList}

---

Recommend exactly ${limit} tracks that:
1. MATCH the user's taste profile and preferred attributes closely
2. Are from artists SIMILAR to their top artists but NOT the same artists they already have
3. AVOID the style/mood/tempo of disliked tracks
4. Are real tracks with VERIFIED YouTube videos (you must be confident the YouTube ID is correct)
5. Prioritize deep cuts, B-sides, and lesser-known releases over obvious hits
6. Each track should be from a DIFFERENT artist for variety

For EACH track provide a JSON object with: title, artist, year (integer), label, youtubeId (the exact 11-character YouTube video ID from youtube.com/watch?v=XXXXXXXXXXX), artistBio (1-2 sentences), artistFacts (array of 3 interesting facts), attributes (object with energy 1-10, groove 1-10, vocals 1-10, darkness 1-10, bpm integer — these MUST be close to the user's taste profile).

Respond ONLY with a JSON object: { "tracks": [...] }`;

  const systemPrompt = `You are an expert music curator and crate-digger with encyclopedic knowledge of underground music, independent labels, and deep cuts across all genres. Your recommendations are highly personalized based on the user's listening patterns.

CRITICAL RULES:
1. NEVER recommend tracks already in the user's library
2. NEVER recommend tracks from artists the user disliked
3. YouTube IDs must be REAL and VERIFIED — only include tracks you are 100% certain have a YouTube video. The ID is the 11-character code after "watch?v=" in a YouTube URL.
4. Match the user's attribute preferences (energy, groove, vocals, darkness, bpm) as closely as possible
5. Always respond with valid JSON only, no markdown formatting, no code blocks
6. For the infantil genre, all songs MUST be in Spanish
7. Prioritize quality over obscurity — the track should be genuinely good AND match their taste`;

  // Call Groq API (OpenAI-compatible)
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7, // Lower temperature for more accurate/focused recommendations
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 401) {
      throw new Error('Invalid API key. Get a free key at console.groq.com/keys');
    }
    if (response.status === 429) {
      throw new Error('Rate limited. Wait a moment and try again (Groq free tier: 30 req/min).');
    }
    throw new Error(`API error (${response.status}): ${err.slice(0, 150)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Empty response from AI. Try again.');
  }

  try {
    const parsed = JSON.parse(text);
    const tracks = parsed.tracks || [];
    const valid = tracks.filter((t: any) => t.youtubeId && t.youtubeId.length === 11);
    if (valid.length > 0) return valid;
    if (tracks.length > 0) return tracks;
    throw new Error('No recommendations generated. Try again.');
  } catch (parseErr: any) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const tracks = parsed.tracks || [];
      if (tracks.length > 0) return tracks;
    }
    throw new Error('Failed to parse AI response. Try again.');
  }
}
