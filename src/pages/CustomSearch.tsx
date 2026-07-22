import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, Plus, Play, Trash2, Shuffle, ListMusic, X, Loader2, ExternalLink } from "lucide-react";
import CollectionPlayer from "@/components/CollectionPlayer";
import { genres, getLikedTracks, addCustomTrack, getCustomTracks, removeCustomTrack, unlikeTrack } from "@/data";
import type { Track } from "@/data";
import { getYouTubeApiKey } from "@/services/gemini";

const genreColor = '#a3e635';

interface YouTubeResult {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

async function searchYouTube(query: string): Promise<YouTubeResult[]> {
  const apiKey = getYouTubeApiKey();
  if (!apiKey) return [];

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=8&key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.items || []).map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    }));
  } catch {
    return [];
  }
}

export default function CustomSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [myTracks, setMyTracks] = useState<Track[]>([]);
  const [showPlayer, setShowPlayer] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [targetGenre, setTargetGenre] = useState<string>('custom');

  useEffect(() => {
    refreshTracks();
  }, []);

  const refreshTracks = () => {
    // Get all custom tracks + liked custom tracks
    const customs = getCustomTracks().filter(t => t.genre === 'custom');
    const liked = getLikedTracks('custom');
    // Merge (custom tracks that are liked)
    const all = [...customs];
    // Also include any non-custom genre custom tracks
    const allCustoms = getCustomTracks();
    setMyTracks(allCustoms);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    const ytKey = getYouTubeApiKey();
    if (!ytKey) {
      alert('YouTube API key required. Go to Settings to add it.');
      return;
    }
    setSearching(true);
    const res = await searchYouTube(query);
    setResults(res);
    setSearching(false);
  };

  const handleAdd = (result: YouTubeResult) => {
    // Clean up the title (remove " - Official Video" etc)
    let title = result.title
      .replace(/\s*\(Official\s*(Music\s*)?Video\)/gi, '')
      .replace(/\s*\[Official\s*(Music\s*)?Video\]/gi, '')
      .replace(/\s*\(Official\s*Audio\)/gi, '')
      .replace(/\s*\[Official\s*Audio\]/gi, '')
      .replace(/\s*\(Lyrics?\)/gi, '')
      .replace(/\s*\[Lyrics?\]/gi, '')
      .replace(/\s*\(Visualizer\)/gi, '')
      .trim();

    // Try to split "Artist - Title" format
    let artist = result.channelTitle.replace(/\s*-\s*Topic$/, '').replace(/VEVO$/i, '').trim();
    if (title.includes(' - ')) {
      const parts = title.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    addCustomTrack({
      title,
      artist,
      genre: targetGenre,
      youtubeId: result.videoId,
      attributes: JSON.stringify({ energy: 5, groove: 5, vocals: 5, darkness: 5, bpm: 120 }),
      artistBio: null,
      artistFacts: null,
      label: null,
      year: new Date().getFullYear(),
      isAiRecommended: 0,
    });

    setAddedIds(prev => new Set([...prev, result.videoId]));
    refreshTracks();
  };

  const handleRemove = (track: Track) => {
    removeCustomTrack(track.id);
    unlikeTrack(track.genre, track.id);
    refreshTracks();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 glass-card border-b border-white/5">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-[oklch(0.6_0.01_260)] hover:text-[oklch(0.95_0.005_260)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm hidden sm:inline">Back</span>
          </Link>
          <div className="text-center">
            <h1 className="text-sm font-semibold" style={{ color: genreColor }}>Búsqueda Propia</h1>
            <p className="text-xs text-[oklch(0.6_0.01_260)]">
              {myTracks.length} tracks added
            </p>
          </div>
          <div className="flex items-center gap-2">
            {myTracks.length > 0 && (
              <button
                onClick={() => setShowPlayer(true)}
                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                title="Shuffle play"
              >
                <Shuffle className="w-5 h-5" style={{ color: genreColor }} />
              </button>
            )}
            <Link href="/playlist" className="flex items-center gap-2 text-[oklch(0.6_0.01_260)] hover:text-[oklch(0.95_0.005_260)] transition-colors">
              <ListMusic className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 max-w-2xl mx-auto w-full">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.6_0.01_260)]" />
              <input
                type="text"
                placeholder="Search YouTube for a song..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-[oklch(0.95_0.005_260)] placeholder:text-[oklch(0.6_0.01_260)] focus:outline-none focus:ring-2 transition-all"
                style={{ '--tw-ring-color': `${genreColor}40` } as any}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              className="px-5 py-3 rounded-xl font-medium text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{ backgroundColor: genreColor, color: '#0d0d0d' }}
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>

          {/* Target genre selector */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[oklch(0.6_0.01_260)]">Add to:</span>
            {genres.map(g => (
              <button
                key={g.key}
                onClick={() => setTargetGenre(g.key)}
                className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors ${
                  targetGenre === g.key ? 'text-[#0d0d0d]' : 'text-[oklch(0.6_0.01_260)] bg-white/5 hover:bg-white/10'
                }`}
                style={targetGenre === g.key ? { backgroundColor: genreColor } : {}}
              >
                {g.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-[oklch(0.6_0.01_260)] mb-3">Search Results</h2>
            <div className="space-y-2">
              {results.map((result) => (
                <motion.div
                  key={result.videoId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-xl p-3 flex items-center gap-3"
                >
                  {result.thumbnail && (
                    <img
                      src={result.thumbnail}
                      alt=""
                      className="w-16 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs truncate" dangerouslySetInnerHTML={{ __html: result.title }} />
                    <p className="text-[10px] text-[oklch(0.6_0.01_260)] truncate">{result.channelTitle}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={`https://www.youtube.com/watch?v=${result.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <Play className="w-4 h-4 text-[oklch(0.6_0.01_260)]" />
                    </a>
                    {addedIds.has(result.videoId) ? (
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/10" style={{ color: genreColor }}>Added</span>
                    ) : (
                      <button
                        onClick={() => handleAdd(result)}
                        className="p-2 rounded-full transition-colors hover:scale-110"
                        style={{ backgroundColor: `${genreColor}20`, color: genreColor }}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* My Custom Tracks */}
        {myTracks.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-[oklch(0.6_0.01_260)] mb-3">My Added Tracks ({myTracks.length})</h2>
            <div className="space-y-2">
              <AnimatePresence>
                {myTracks.map((track) => {
                  const tGenre = genres.find(g => g.key === track.genre);
                  return (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="glass-card rounded-xl p-3 flex items-center gap-3 group"
                    >
                      <a
                        href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${genreColor}15` }}
                      >
                        <Play className="w-4 h-4" style={{ color: genreColor }} />
                      </a>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-xs truncate">{track.title}</h3>
                        <p className="text-[10px] text-[oklch(0.6_0.01_260)] truncate">{track.artist}</p>
                        {track.genre !== 'custom' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[oklch(0.6_0.01_260)]">
                            {tGenre?.name.split(' ')[0] || track.genre}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(track)}
                        className="p-2 rounded-full hover:bg-red-400/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty state */}
        {myTracks.length === 0 && results.length === 0 && !searching && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-[oklch(0.6_0.01_260)]" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Search & Add</h2>
            <p className="text-[oklch(0.6_0.01_260)] mb-2 max-w-sm">
              Search for any song on YouTube and add it to your collection.
            </p>
            <p className="text-xs text-[oklch(0.6_0.01_260)] max-w-sm">
              You can choose which genre to add it to, or keep it in "Búsqueda Propia".
            </p>
          </motion.div>
        )}
      </main>

      {/* Collection Player */}
      <AnimatePresence>
        {showPlayer && myTracks.length > 0 && (
          <CollectionPlayer
            tracks={myTracks}
            genreColor={genreColor}
            onClose={() => setShowPlayer(false)}
            onRemove={(trackId) => handleRemove(myTracks.find(t => t.id === trackId)!)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
