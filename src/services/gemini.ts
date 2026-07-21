// AI Recommendations Service using Groq (free tier)
// Uses OpenAI GPT-OSS 120B on Groq - fast and free
// User provides their API key from console.groq.com/keys
//
// Strategy: 
// 1. Ask AI for track recommendations (no YouTube IDs)
// 2. Use waveform.manus.space YouTube search proxy to get real video IDs
// This gives 100% working YouTube embeds.

const STORAGE_KEY_API = 'waveform_groq_key';
const STORAGE_KEY_API_LEGACY = 'waveform_gemini_key';

// The Manus server provides a public YouTube search endpoint
const YOUTUBE_SEARCH_PROXY = 'https://waveform.manus.space/api/public/youtube-search';

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

/**
 * Search YouTube via the Manus server proxy to get a real video ID
 */
async function searchYouTube(artist: string, title: string): Promise<string> {
  try {
    const query = `${artist} ${title}`;
    const resp = await fetch(
      `${YOUTUBE_SEARCH_PROXY}?q=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!resp.ok) return '';
    const data = await resp.json();
    if (data.videos && data.videos.length > 0) {
      return data.videos[0].videoId;
    }
    return '';
  } catch (e) {
    console.warn(`[YouTube Search] Failed for "${artist} - ${title}":`, e);
    return '';
  }
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
  const genreName = genreDesc.split(' - ')[0];

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

  // Build disliked context (up to 15)
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

  // Analyze the user's taste profile
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
Match these attribute ranges closely.`;
    }
  }

  // Top artists
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
${dislikedContext}` : ''}

## Already in library (DO NOT recommend these): 
${existingList}

---

Recommend exactly ${limit + 3} tracks from the "${genreName}" genre that:
1. MATCH the user's taste profile and preferred attributes
2. Are from artists SIMILAR to their top artists but NOT the same artists they already have
3. AVOID the style/mood of disliked tracks
4. Each track should be from a DIFFERENT artist
5. ALL tracks MUST authentically belong to the "${genreName}" genre
6. Recommend REAL tracks by REAL artists that actually exist
7. Prefer well-known tracks that have official YouTube videos

DO NOT include youtubeId in your response.

For EACH track provide a JSON object with: title (string), artist (string), year (integer), label (string), artistBio (1-2 sentences about the artist), artistFacts (array of 3 interesting facts), attributes (object with energy 1-10, groove 1-10, vocals 1-10, darkness 1-10, bpm integer).

Respond ONLY with a JSON object: { "tracks": [...] }`;

  const systemPrompt = `You are an expert music curator specializing EXCLUSIVELY in the "${genreName}" genre.

CRITICAL RULES:
1. EVERY track MUST be from the "${genreName}" genre. No exceptions.
2. NEVER recommend generic pop hits or meme songs. Only authentic ${genreName} tracks.
3. NEVER recommend tracks already in the user's library.
4. Only recommend REAL tracks that actually exist — real artist names, real song titles, real release years.
5. Always respond with valid JSON only, no markdown, no code blocks.
6. For the infantil genre, all songs MUST be in Spanish.
7. Do NOT include any youtubeId field.`;

  // Call Groq API
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
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

  let tracks: any[];
  try {
    const parsed = JSON.parse(text);
    tracks = parsed.tracks || [];
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      tracks = parsed.tracks || [];
    } else {
      throw new Error('Failed to parse AI response. Try again.');
    }
  }

  if (tracks.length === 0) {
    throw new Error('No recommendations generated. Try again.');
  }

  console.log(`[AI Recs] Got ${tracks.length} recommendations for "${genreName}", resolving YouTube IDs...`);

  // Step 2: Resolve real YouTube video IDs via the Manus server proxy
  const results: RecommendedTrack[] = [];

  // Process tracks in parallel (batch of up to 8)
  const searchPromises = tracks.slice(0, limit + 3).map(async (track: any) => {
    if (!track.title || !track.artist) return null;
    const videoId = await searchYouTube(track.artist, track.title);
    return { track, videoId };
  });

  const resolved = await Promise.all(searchPromises);

  for (const item of resolved) {
    if (results.length >= limit) break;
    if (!item || !item.track.title || !item.track.artist) continue;

    // Only include tracks where we found a real YouTube video
    if (!item.videoId) {
      console.log(`[AI Recs] No YouTube video found for "${item.track.artist} - ${item.track.title}", skipping`);
      continue;
    }

    console.log(`[AI Recs] ✓ ${item.track.artist} - ${item.track.title} → ${item.videoId}`);

    results.push({
      title: item.track.title,
      artist: item.track.artist,
      year: item.track.year || 2020,
      label: item.track.label || 'Independent',
      youtubeId: item.videoId,
      artistBio: item.track.artistBio || '',
      artistFacts: item.track.artistFacts || [],
      attributes: item.track.attributes || { energy: 5, groove: 5, vocals: 5, darkness: 5, bpm: 120 },
    });
  }

  if (results.length === 0) {
    throw new Error('Could not find YouTube videos for recommendations. The search service may be temporarily unavailable. Please try again.');
  }

  console.log(`[AI Recs] Returning ${results.length} tracks with verified YouTube IDs.`);
  return results;
}
