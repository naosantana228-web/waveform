import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ThumbsUp, ThumbsDown, Info, ListMusic, Sparkles, Play, Compass, Trash2, ExternalLink, AlertTriangle, Shuffle, Search, X, Loader2 } from "lucide-react";
import CollectionPlayer from "@/components/CollectionPlayer";
import { genres, getTracksByGenre, getLikedTracks, getDiscoveryQueue, likeTrack, dislikeTrack, markBroken, unlikeTrack, resetDiscovery, allTracks } from "@/data";
import type { Track } from "@/data";
import { getAIRecommendations, searchYouTubeId, getGeminiApiKey } from "@/services/gemini";

const genreColors: Record<string, string> = {
  techno: '#00d4aa',
  afrobeats: '#ff6b6b',
  reggae: '#ffa726',
  reggaeton: '#e040fb',
  hiphop: '#ffb300',
  infantil: '#ff69b4',
};

const genreBgImages: Record<string, string> = {
  techno: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663364052012/USZRj6GFcBYAcRBgUCrhq2/genre-techno-bg-EMNEBANm5cVqPUot2cNtgF.webp',
  afrobeats: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663364052012/USZRj6GFcBYAcRBgUCrhq2/genre-afrobeats-bg-nmBknr9ioZNHMHmDYC53mj.webp',
  reggae: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663364052012/USZRj6GFcBYAcRBgUCrhq2/genre-reggae-bg-mmE3RXfLEHq7MNESJj7jRK.webp',
  reggaeton: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663364052012/USZRj6GFcBYAcRBgUCrhq2/genre-reggaeton-bg-LEQLoscEzwZqxdHcFRp4yg.webp',
  hiphop: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663364052012/USZRj6GFcBYAcRBgUCrhq2/genre-hiphop-bg-CqtKYRJAz2VCSEiFraDyHD.webp',
  infantil: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663364052012/USZRj6GFcBYAcRBgUCrhq2/genre-infantil-bg-nJNJWMrTbqKSRRkgYUvdVs.webp',
};

// --- Track List Item Component ---
function TrackListItem({ track, genreColor, onRemove }: {
  track: Track;
  genreColor: string;
  onRemove: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const attrs = track.attributes ? (typeof track.attributes === 'string' ? JSON.parse(track.attributes) : track.attributes) : { energy: 5, groove: 5, vocals: 5, darkness: 5, bpm: 120 };
  const facts = track.artistFacts ? (typeof track.artistFacts === 'string' ? JSON.parse(track.artistFacts) : track.artistFacts) : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="p-4 flex items-center gap-4 group">
        {track.youtubeId ? (
          <a
            href={`https://www.youtube.com/watch?v=${track.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
            style={{ backgroundColor: `${genreColor}15` }}
          >
            <Play className="w-5 h-5" style={{ color: genreColor }} />
          </a>
        ) : (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${genreColor}15` }}>
            <Play className="w-5 h-5 opacity-30" style={{ color: genreColor }} />
          </div>
        )}

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <h3 className="font-medium text-sm truncate">{track.title}</h3>
          <p className="text-xs text-[oklch(0.6_0.01_260)] truncate">{track.artist}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-[oklch(0.6_0.01_260)]">{attrs.bpm} BPM</span>
            {track.year && <span className="text-[10px] text-[oklch(0.6_0.01_260)]">· {track.year}</span>}
            {track.label && <span className="text-[10px] text-[oklch(0.6_0.01_260)] hidden sm:inline">· {track.label}</span>}
            {track.isAiRecommended === 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">AI</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <Info className="w-4 h-4 text-[oklch(0.6_0.01_260)]" />
          </button>
          {track.youtubeId && (
            <a href={`https://www.youtube.com/watch?v=${track.youtubeId}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <ExternalLink className="w-4 h-4 text-[oklch(0.6_0.01_260)]" />
            </a>
          )}
          <button onClick={() => onRemove(track.id)} className="p-2 rounded-full hover:bg-red-400/10 transition-colors">
            <Trash2 className="w-4 h-4 text-red-400/70" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-3">
              {track.youtubeId && (
                <div className="aspect-video w-full rounded-lg overflow-hidden mb-3 bg-black/50">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${track.youtubeId}?rel=0&modestbranding=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${track.artist} - ${track.title}`}
                  />
                </div>
              )}

              <div className="flex gap-2 flex-wrap mb-3">
                {[
                  { label: 'Energy', value: attrs.energy },
                  { label: 'Groove', value: attrs.groove },
                  { label: 'Vocals', value: attrs.vocals },
                  { label: 'Dark', value: attrs.darkness },
                ].map(attr => (
                  <div key={attr.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-xs">
                    <span className="text-[oklch(0.6_0.01_260)]">{attr.label}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: i < Math.round(attr.value / 2) ? genreColor : 'rgba(255,255,255,0.1)' }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {track.artistBio && <p className="text-sm text-[oklch(0.6_0.01_260)] mb-3">{track.artistBio}</p>}
              {facts.length > 0 && (
                <ul className="space-y-2">
                  {facts.map((fact: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[oklch(0.6_0.01_260)]">
                      <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: genreColor }} />
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// --- Discovery Mode Component ---
function DiscoveryMode({ genreKey, genreColor }: { genreKey: string; genreColor: string }) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const unseen = getDiscoveryQueue(genreKey);
    setQueue(unseen);
    setCurrentIndex(0);
    setCompleted(unseen.length === 0);
  }, [genreKey, refreshKey]);

  const handleLike = useCallback(() => {
    if (queue.length === 0) return;
    const track = queue[currentIndex];
    likeTrack(genreKey, track.id);
    setShowInfo(false);
    if (currentIndex + 1 >= queue.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [queue, currentIndex, genreKey]);

  const handleDislike = useCallback(() => {
    if (queue.length === 0) return;
    const track = queue[currentIndex];
    dislikeTrack(genreKey, track.id);
    setShowInfo(false);
    if (currentIndex + 1 >= queue.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [queue, currentIndex, genreKey]);

  const handleNotWorking = useCallback(() => {
    if (queue.length === 0) return;
    const track = queue[currentIndex];
    markBroken(genreKey, track.id);
    setShowInfo(false);
    if (currentIndex + 1 >= queue.length) {
      setCompleted(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [queue, currentIndex, genreKey]);

  const handleGetAIRecommendations = useCallback(async () => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setAiError('No API key. Go to Settings (gear icon on homepage) to add your free Gemini API key.');
      return;
    }
    setIsLoadingAI(true);
    setAiError(null);
    try {
      const genreTracks = getTracksByGenre(genreKey);
      const liked = getLikedTracks(genreKey);
      const existingList = genreTracks.map(t => ({ title: t.title, artist: t.artist }));
      const likedList = liked.map(t => ({ title: t.title, artist: t.artist }));

      const recommendations = await getAIRecommendations(genreKey, likedList, existingList, 5);

      if (recommendations.length === 0) {
        setAiError('No new recommendations found. Try again later.');
        return;
      }

      // Search YouTube for each recommendation
      const newTracks: Track[] = [];
      const maxId = Math.max(...allTracks.map(t => t.id), 10000);

      for (let i = 0; i < recommendations.length; i++) {
        const rec = recommendations[i];
        const youtubeId = await searchYouTubeId(rec.artist, rec.title);
        if (!youtubeId) continue;

        newTracks.push({
          id: maxId + i + 1,
          title: rec.title,
          artist: rec.artist,
          genre: genreKey,
          youtubeId,
          attributes: JSON.stringify(rec.attributes),
          artistBio: rec.artistBio,
          artistFacts: JSON.stringify(rec.artistFacts),
          label: rec.label,
          year: rec.year,
          isAiRecommended: 1,
        });
      }

      if (newTracks.length > 0) {
        // Add to queue for discovery
        setQueue(newTracks);
        setCurrentIndex(0);
        setCompleted(false);
      } else {
        setAiError('Could not find YouTube videos for the recommendations. Try again.');
      }
    } catch (e: any) {
      setAiError(e.message || 'Failed to get recommendations.');
    } finally {
      setIsLoadingAI(false);
    }
  }, [genreKey]);

  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${genreColor}20` }}>
          <Sparkles className="w-10 h-10" style={{ color: genreColor }} />
        </div>
        <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
        <p className="text-[oklch(0.6_0.01_260)] max-w-sm mb-6">
          You've gone through all available tracks. Want AI-powered recommendations based on your taste?
        </p>
        {aiError && (
          <p className="text-red-400 text-xs mb-4 max-w-sm">{aiError}</p>
        )}
        <button
          onClick={handleGetAIRecommendations}
          disabled={isLoadingAI}
          className="px-6 py-3 rounded-full font-medium text-sm transition-all hover:scale-105 flex items-center gap-2 disabled:opacity-50 mb-4"
          style={{ backgroundColor: genreColor, color: '#0d0d0d' }}
        >
          {isLoadingAI ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Finding new tracks...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Get AI Recommendations
            </>
          )}
        </button>
        <button
          onClick={() => {
            resetDiscovery(genreKey);
            setRefreshKey(prev => prev + 1);
          }}
          className="px-4 py-2 rounded-full text-xs text-[oklch(0.6_0.01_260)] border border-white/10 hover:border-white/30 transition-colors flex items-center gap-2"
        >
          Reset Discovery History
        </button>
      </motion.div>
    );
  }

  const currentTrack = queue[currentIndex];
  if (!currentTrack) return null;

  const attrs = currentTrack.attributes ? (typeof currentTrack.attributes === 'string' ? JSON.parse(currentTrack.attributes) : currentTrack.attributes) : { energy: 5, groove: 5, vocals: 5, darkness: 5, bpm: 120 };
  const facts = currentTrack.artistFacts ? (typeof currentTrack.artistFacts === 'string' ? JSON.parse(currentTrack.artistFacts) : currentTrack.artistFacts) : [];

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-4 px-2">
        <div className="flex items-center justify-between text-xs text-[oklch(0.6_0.01_260)] mb-2">
          <span>Discovering new tracks</span>
          <span>{currentIndex + 1} of {queue.length}</span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: genreColor }}
            animate={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Current Track Card */}
      <motion.div
        key={currentTrack.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        {/* YouTube Embed */}
        {currentTrack.youtubeId ? (
          <div className="aspect-video w-full bg-black/50">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${currentTrack.artist} - ${currentTrack.title}`}
            />
          </div>
        ) : (
          <div className="aspect-video w-full bg-black/50 flex flex-col items-center justify-center gap-3">
            <Play className="w-12 h-12 text-[oklch(0.6_0.01_260)]/50" />
            <p className="text-sm text-[oklch(0.6_0.01_260)]">Video not available</p>
          </div>
        )}

        {/* Track Info */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold">{currentTrack.title}</h2>
              <p className="text-[oklch(0.6_0.01_260)]">{currentTrack.artist}</p>
            </div>
            <button onClick={() => setShowInfo(!showInfo)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
              <Info className="w-5 h-5 text-[oklch(0.6_0.01_260)]" />
            </button>
          </div>

          {/* Attributes */}
          <div className="flex gap-2 flex-wrap mb-4">
            {[
              { label: 'Energy', value: attrs.energy },
              { label: 'Groove', value: attrs.groove },
              { label: 'Vocals', value: attrs.vocals },
              { label: 'Dark', value: attrs.darkness },
            ].map(attr => (
              <div key={attr.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-xs">
                <span className="text-[oklch(0.6_0.01_260)]">{attr.label}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: i < Math.round(attr.value / 2) ? genreColor : 'rgba(255,255,255,0.1)' }}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className="px-2.5 py-1 rounded-full bg-white/5 text-xs text-[oklch(0.6_0.01_260)]">
              {attrs.bpm} BPM
            </div>
          </div>

          {/* Artist Info Panel */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-white/10 pt-4 mb-4">
                  {currentTrack.artistBio && <p className="text-sm text-[oklch(0.6_0.01_260)] mb-3">{currentTrack.artistBio}</p>}
                  {facts.length > 0 && (
                    <ul className="space-y-2">
                      {facts.map((fact: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[oklch(0.6_0.01_260)]">
                          <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: genreColor }} />
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {currentTrack.label && (
                    <p className="text-xs text-[oklch(0.6_0.01_260)] mt-3">
                      Label: {currentTrack.label} {currentTrack.year && `· ${currentTrack.year}`}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleNotWorking}
              className="p-3 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
              title="Video not working"
            >
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </button>
            <button
              onClick={handleDislike}
              className="p-4 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-colors"
              title="Not for me"
            >
              <ThumbsDown className="w-6 h-6 text-red-400" />
            </button>
            <button
              onClick={handleLike}
              className="p-5 rounded-full transition-all hover:scale-105"
              style={{ backgroundColor: genreColor, color: '#0d0d0d' }}
              title="Add to collection"
            >
              <ThumbsUp className="w-7 h-7" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main Genre Page ---
export default function Genre() {
  const params = useParams<{ genre: string }>();
  const genreKey = params.genre || '';
  const genreInfo = genres.find(g => g.key === genreKey);
  const genreColor = genreColors[genreKey] || '#00d4aa';
  const bgImage = genreBgImages[genreKey] || '';

  const [mode, setMode] = useState<'collection' | 'discover'>('collection');
  const [likedList, setLikedList] = useState<Track[]>([]);
  const [showPlayer, setShowPlayer] = useState(false);
  const [artistFilter, setArtistFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLikedList(getLikedTracks(genreKey));
  }, [genreKey, refreshKey]);

  const filteredLikedTracks = useMemo(() => {
    if (!artistFilter.trim()) return likedList;
    const q = artistFilter.toLowerCase();
    return likedList.filter(t => t.artist.toLowerCase().includes(q) || t.title.toLowerCase().includes(q));
  }, [likedList, artistFilter]);

  const unseenCount = getDiscoveryQueue(genreKey).length;

  const handleRemove = (trackId: number) => {
    unlikeTrack(genreKey, trackId);
    setLikedList(getLikedTracks(genreKey));
  };

  if (!genreInfo) {
    return <div className="min-h-screen flex items-center justify-center text-[oklch(0.6_0.01_260)]">Genre not found</div>;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {bgImage && <img src={bgImage} alt="" className="w-full h-full object-cover opacity-15" />}
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.08_0.005_260)]/70 via-[oklch(0.08_0.005_260)]/90 to-[oklch(0.08_0.005_260)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 glass-card border-b border-white/5">
          <div className="flex items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-[oklch(0.6_0.01_260)] hover:text-[oklch(0.95_0.005_260)] transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm hidden sm:inline">Back</span>
            </Link>

            <div className="text-center">
              <h1 className="text-sm font-semibold" style={{ color: genreColor }}>{genreInfo.name}</h1>
              <p className="text-xs text-[oklch(0.6_0.01_260)]">
                {likedList.length} liked · {unseenCount} to discover
              </p>
            </div>

            <Link href="/playlist" className="flex items-center gap-2 text-[oklch(0.6_0.01_260)] hover:text-[oklch(0.95_0.005_260)] transition-colors">
              <ListMusic className="w-5 h-5" />
            </Link>
          </div>

          {/* Mode Tabs */}
          <div className="flex px-6 pb-3 gap-1">
            <button
              onClick={() => setMode('collection')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'collection' ? 'bg-white/10 text-[oklch(0.95_0.005_260)]' : 'text-[oklch(0.6_0.01_260)] hover:text-[oklch(0.95_0.005_260)] hover:bg-white/5'
              }`}
            >
              <ListMusic className="w-4 h-4" />
              My Collection ({likedList.length})
            </button>
            <button
              onClick={() => setMode('discover')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'discover' ? '' : 'text-[oklch(0.6_0.01_260)] hover:text-[oklch(0.95_0.005_260)] hover:bg-white/5'
              }`}
              style={mode === 'discover' ? { backgroundColor: `${genreColor}20`, color: genreColor } : {}}
            >
              <Compass className="w-4 h-4" />
              Discover ({unseenCount})
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 py-6">
          {mode === 'collection' ? (
            likedList.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <ListMusic className="w-8 h-8 text-[oklch(0.6_0.01_260)]" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No tracks yet</h2>
                <p className="text-[oklch(0.6_0.01_260)] mb-6 max-w-sm">
                  Switch to Discovery mode to listen to new tracks and build your collection.
                </p>
                <button
                  onClick={() => setMode('discover')}
                  className="px-6 py-3 rounded-full font-medium text-sm transition-all hover:scale-105"
                  style={{ backgroundColor: genreColor, color: '#0d0d0d' }}
                >
                  Start Discovering
                </button>
              </motion.div>
            ) : (
              <div className="space-y-3 max-w-2xl mx-auto">
                {/* Play All / Shuffle Controls */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <button
                    onClick={() => setShowPlayer(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-105"
                    style={{ backgroundColor: genreColor, color: '#0d0d0d' }}
                  >
                    <Shuffle className="w-4 h-4" />
                    Shuffle Play
                  </button>
                  <span className="text-xs text-[oklch(0.6_0.01_260)]">
                    {likedList.filter(t => t.youtubeId).length} playable tracks
                  </span>
                </div>
                {/* Artist/Track Search Filter */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.6_0.01_260)]" />
                  <input
                    type="text"
                    placeholder="Filter by artist or track..."
                    value={artistFilter}
                    onChange={(e) => setArtistFilter(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-[oklch(0.95_0.005_260)] placeholder:text-[oklch(0.6_0.01_260)] focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                  />
                  {artistFilter && (
                    <button
                      onClick={() => setArtistFilter('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[oklch(0.6_0.01_260)] hover:text-[oklch(0.95_0.005_260)]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {artistFilter && (
                  <p className="text-xs text-[oklch(0.6_0.01_260)] mb-2">
                    Showing {filteredLikedTracks.length} of {likedList.length} tracks
                  </p>
                )}
                <AnimatePresence>
                  {filteredLikedTracks.map((track) => (
                    <TrackListItem
                      key={track.id}
                      track={track}
                      genreColor={genreColor}
                      onRemove={handleRemove}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )
          ) : (
            <DiscoveryMode genreKey={genreKey} genreColor={genreColor} />
          )}
        </main>
      </div>

      {/* Collection Player Overlay */}
      <AnimatePresence>
        {showPlayer && likedList.length > 0 && (
          <CollectionPlayer
            tracks={likedList}
            genreColor={genreColor}
            onClose={() => setShowPlayer(false)}
            onRemove={(trackId) => handleRemove(trackId)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
