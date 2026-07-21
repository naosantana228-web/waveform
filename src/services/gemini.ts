// AI Recommendations Service using Groq (free tier)
// Groq uses OpenAI GPT-OSS 120B - fast and free
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

/**
 * Verify a YouTube video exists using YouTube's oEmbed endpoint (most reliable, CORS-friendly)
 * Returns true if video exists, false if definitely doesn't exist, true on network errors (benefit of the doubt)
 */
async function verifyYouTubeId(videoId: string): Promise<boolean> {
  if (!videoId || videoId.length !== 11) return false;
  try {
    const resp = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    // 200 = video exists, 401/403 = embedding disabled but video exists, 404 = doesn't exist
    if (resp.status === 200 || resp.status === 401 || resp.status === 403) return true;
    if (resp.status === 404) return false;
    // Any other status - give benefit of the doubt
    return true;
  } catch {
    // Network error / timeout - give benefit of the doubt
    return true;
  }
}

/**
 * Search for a YouTube video by artist + title using YouTube's oEmbed
 * This is a lightweight check - we can't actually search, but we can verify
 */
async function searchYouTubeAlternative(artist: string, title: string): Promise<string | null> {
  // Try Piped API instances (more reliable than Invidious in 2026)
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.projectsegfau.lt',
    'https://pipedapi.in.projectsegfau.lt',
  ];

  const query = `${artist} ${title}`;

  for (const instance of pipedInstances) {
    try {
      const resp = await fetch(
        `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!resp.ok) continue;
      const data = await resp.json();
      const items = data.items || [];
      if (items.length > 0 && items[0].url) {
        // Extract video ID from /watch?v=XXXXXXXXXXX
        const match = items[0].url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (match) return match[1];
        // Or from /shorts/XXXXXXXXXXX
        const shortsMatch = items[0].url.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (shortsMatch) return shortsMatch[1];
      }
    } catch {
      continue;
    }
  }
  return null;
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

  // Request MORE tracks than needed (10 instead of 5) to account for verification failures
  const requestLimit = limit + 5;

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

Recommend exactly ${requestLimit} tracks from the "${genreName}" genre that:
1. MATCH the user's taste profile and preferred attributes closely
2. Are from artists SIMILAR to their top artists but NOT the same artists they already have
3. AVOID the style/mood/tempo of disliked tracks
4. Are WELL-KNOWN tracks that definitely have official YouTube videos (official uploads, VEVO, or official artist channels)
5. Prioritize deep cuts and lesser-known releases, but they MUST have YouTube videos
6. Each track should be from a DIFFERENT artist for variety
7. ALL tracks MUST be from the "${genreName}" genre — do NOT include tracks from other genres

CRITICAL: Do NOT recommend generic pop hits, meme songs, or tracks unrelated to ${genreName}. Every single track must authentically belong to this genre.

For EACH track provide a JSON object with: title, artist, year (integer), label, youtubeId (the exact 11-character YouTube video ID — MUST be a real video you are certain exists), artistBio (1-2 sentences), artistFacts (array of 3 interesting facts), attributes (object with energy 1-10, groove 1-10, vocals 1-10, darkness 1-10, bpm integer).

Respond ONLY with a JSON object: { "tracks": [...] }`;

  const systemPrompt = `You are an expert music curator specializing EXCLUSIVELY in the "${genreName}" genre. You have deep knowledge of this specific genre, its sub-genres, key labels, and underground scene.

YOUR ONLY JOB: Recommend tracks from the "${genreName}" genre. Nothing else.

CRITICAL RULES:
1. EVERY track MUST be from the "${genreName}" genre. Do NOT recommend tracks from other genres under any circumstances.
2. NEVER recommend generic pop hits, meme songs (like "Never Gonna Give You Up"), or mainstream tracks unrelated to this genre.
3. NEVER recommend tracks already in the user's library.
4. NEVER recommend tracks from artists the user disliked.
5. YouTube IDs MUST be real 11-character IDs from actual YouTube videos. Only include tracks you are confident have official YouTube uploads.
6. Match the user's attribute preferences closely.
7. Always respond with valid JSON only, no markdown, no code blocks, no explanation text.
8. For the infantil genre, all songs MUST be in Spanish.
9. Each recommendation must genuinely belong to the "${genreName}" genre.
10. If you cannot think of enough genre-appropriate tracks, return fewer tracks rather than padding with unrelated music.`;

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

  // Step 2: Verify YouTube IDs — but be lenient
  // If verification services are down, accept tracks anyway
  console.log(`[AI Recs] Processing ${tracks.length} tracks, verifying YouTube IDs...`);
  
  const verifiedTracks: RecommendedTrack[] = [];
  let verificationWorking = true;
  
  // First, test if verification is working at all with a known good ID
  try {
    const testResult = await verifyYouTubeId('dQw4w9WgXcQ'); // Rick Astley - known to exist
    verificationWorking = testResult; // If this returns false, verification is broken
  } catch {
    verificationWorking = false;
  }

  for (const track of tracks) {
    if (verifiedTracks.length >= limit) break;
    
    // Validate basic track data
    if (!track.title || !track.artist) continue;
    
    let finalYoutubeId = track.youtubeId || '';
    
    // Only verify if the service is working
    if (verificationWorking && finalYoutubeId && finalYoutubeId.length === 11) {
      const isValid = await verifyYouTubeId(finalYoutubeId);
      
      if (!isValid) {
        console.log(`[AI Recs] Invalid ID for "${track.artist} - ${track.title}", searching alternative...`);
        // Try to find the real video
        const searchedId = await searchYouTubeAlternative(track.artist, track.title);
        if (searchedId) {
          finalYoutubeId = searchedId;
          console.log(`[AI Recs] Found alternative: ${searchedId}`);
        } else {
          // Accept the track anyway with the AI-provided ID
          // It might work — the user can skip if it doesn't
          console.log(`[AI Recs] Keeping AI-provided ID (may not work): ${finalYoutubeId}`);
        }
      } else {
        console.log(`[AI Recs] Verified: "${track.artist} - ${track.title}"`);
      }
    } else if (!verificationWorking) {
      // Verification service is down — accept all tracks as-is
      console.log(`[AI Recs] Verification unavailable, accepting: "${track.artist} - ${track.title}"`);
    }
    
    verifiedTracks.push({
      title: track.title,
      artist: track.artist,
      year: track.year || 2020,
      label: track.label || 'Independent',
      youtubeId: finalYoutubeId,
      artistBio: track.artistBio || '',
      artistFacts: track.artistFacts || [],
      attributes: track.attributes || { energy: 5, groove: 5, vocals: 5, darkness: 5, bpm: 120 },
    });
  }

  if (verifiedTracks.length === 0) {
    throw new Error('No valid recommendations could be generated. Please try again.');
  }

  console.log(`[AI Recs] Returning ${verifiedTracks.length} tracks (verification ${verificationWorking ? 'active' : 'bypassed'}).`);
  return verifiedTracks;
}
