import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, X, ListMusic, Volume2, Trash2 } from "lucide-react";
import type { Track } from "@/data";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Props {
  tracks: Track[];
  genreColor: string;
  onClose: () => void;
  onRemove?: (trackId: number) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function CollectionPlayer({ tracks, genreColor, onClose, onRemove }: Props) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(true);
  const [isRepeat, setIsRepeat] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showQueue, setShowQueue] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const playerInstanceRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleNextRef = useRef<() => void>(() => {});

  // Initialize queue (shuffled by default)
  useEffect(() => {
    const playable = tracks.filter(t => t.youtubeId);
    if (playable.length === 0) return;
    setQueue(shuffleArray(playable));
    setCurrentIndex(0);
    setIsPlaying(true);
  }, [tracks]);

  const currentTrack = queue[currentIndex];

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    if (currentIndex + 1 >= queue.length) {
      if (isRepeat) {
        if (isShuffled) setQueue(shuffleArray(queue));
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [queue, currentIndex, isRepeat, isShuffled]);

  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  const handlePrev = useCallback(() => {
    if (queue.length === 0) return;
    setCurrentIndex(prev => prev === 0 ? queue.length - 1 : prev - 1);
  }, [queue]);

  const toggleShuffle = useCallback(() => {
    if (!isShuffled) {
      const current = queue[currentIndex];
      const rest = queue.filter((_, i) => i !== currentIndex);
      setQueue([current, ...shuffleArray(rest)]);
      setCurrentIndex(0);
    } else {
      const playable = tracks.filter(t => t.youtubeId);
      const current = queue[currentIndex];
      const newIndex = playable.findIndex(t => t.id === current.id);
      setQueue(playable);
      setCurrentIndex(newIndex >= 0 ? newIndex : 0);
    }
    setIsShuffled(!isShuffled);
  }, [isShuffled, queue, currentIndex, tracks]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) { setPlayerReady(true); return; }
    const existing = document.getElementById('youtube-iframe-api');
    if (existing) {
      const check = setInterval(() => { if (window.YT && window.YT.Player) { setPlayerReady(true); clearInterval(check); } }, 100);
      return () => clearInterval(check);
    }
    const script = document.createElement('script');
    script.id = 'youtube-iframe-api';
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
    window.onYouTubeIframeAPIReady = () => setPlayerReady(true);
  }, []);

  // Determine if current track uses search-based embed or direct video ID
  const isSearchEmbed = currentTrack?.youtubeId?.startsWith('SEARCH:');
  const searchQuery = isSearchEmbed ? currentTrack.youtubeId.slice(7) : '';

  // Create/update YouTube player
  useEffect(() => {
    if (!playerReady || !currentTrack?.youtubeId) return;

    const ytId = currentTrack.youtubeId;
    const isSearch = ytId.startsWith('SEARCH:');

    if (isSearch) {
      // For search-based tracks, destroy the YT player and use iframe instead
      if (playerInstanceRef.current) {
        try { playerInstanceRef.current.destroy(); } catch {}
        playerInstanceRef.current = null;
      }
      // The iframe will be rendered in JSX below
      return;
    }

    // Direct video ID - use YT Player API
    if (playerInstanceRef.current) {
      playerInstanceRef.current.loadVideoById(ytId);
      return;
    }
    playerInstanceRef.current = new window.YT.Player('yt-player-container', {
      host: 'https://www.youtube-nocookie.com',
      videoId: ytId,
      playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, fs: 0 },
      events: {
        onReady: (event: any) => { if (isPlaying) event.target.playVideo(); },
        onStateChange: (event: any) => { if (event.data === 0) handleNextRef.current(); },
      },
    });
  }, [playerReady, currentTrack?.youtubeId]);

  // Cleanup
  useEffect(() => {
    return () => { try { playerInstanceRef.current?.destroy(); } catch {} playerInstanceRef.current = null; };
  }, []);

  // Play/pause
  useEffect(() => {
    if (!playerInstanceRef.current) return;
    try { isPlaying ? playerInstanceRef.current.playVideo() : playerInstanceRef.current.pauseVideo(); } catch {}
  }, [isPlaying]);

  if (!currentTrack || queue.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[100] flex flex-col bg-[oklch(0.08_0.005_260)] backdrop-blur-xl"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4" style={{ color: genreColor }} />
          <span className="text-sm font-medium">Now Playing</span>
          <span className="text-xs text-[oklch(0.6_0.01_260)]">{currentIndex + 1} / {queue.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowQueue(!showQueue)} className={`p-2 rounded-full transition-colors ${showQueue ? 'bg-white/10' : 'hover:bg-white/5'}`}>
            <ListMusic className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Player Section */}
        <div className={`flex-1 flex flex-col items-center justify-center p-6 ${showQueue ? 'hidden lg:flex' : ''}`}>
          <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden shadow-2xl mb-8 bg-black/50" ref={containerRef}>
            {isSearchEmbed ? (
              <iframe
                key={currentTrack?.id}
                src={`https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(searchQuery)}&autoplay=1&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${currentTrack?.artist} - ${currentTrack?.title}`}
              />
            ) : (
              <div id="yt-player-container" className="w-full h-full" />
            )}
          </div>

          {/* Track Info */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-1">{currentTrack.title}</h2>
            <p className="text-[oklch(0.6_0.01_260)] text-lg">{currentTrack.artist}</p>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-6">
            <button onClick={toggleShuffle} className={`p-3 rounded-full transition-all ${isShuffled ? '' : 'opacity-40 hover:opacity-70'}`} style={isShuffled ? { color: genreColor } : {}}>
              <Shuffle className="w-5 h-5" />
            </button>
            <button onClick={handlePrev} className="p-3 rounded-full hover:bg-white/10 transition-colors">
              <SkipBack className="w-6 h-6" />
            </button>
            <button onClick={() => setIsPlaying(!isPlaying)} className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-105" style={{ backgroundColor: genreColor, color: '#0d0d0d' }}>
              {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
            </button>
            <button onClick={handleNext} className="p-3 rounded-full hover:bg-white/10 transition-colors">
              <SkipForward className="w-6 h-6" />
            </button>
            <button onClick={() => setIsRepeat(!isRepeat)} className={`p-3 rounded-full transition-all ${isRepeat ? '' : 'opacity-40 hover:opacity-70'}`} style={isRepeat ? { color: genreColor } : {}}>
              <Repeat className="w-5 h-5" />
            </button>
            {onRemove && (
              <button
                onClick={() => {
                  if (!currentTrack) return;
                  const removedId = currentTrack.id;
                  const newQueue = queue.filter(t => t.id !== removedId);
                  if (newQueue.length === 0) { onClose(); } else {
                    const newIdx = currentIndex >= newQueue.length ? 0 : currentIndex;
                    setQueue(newQueue);
                    setCurrentIndex(newIdx);
                  }
                  onRemove(removedId);
                }}
                className="p-3 rounded-full hover:bg-red-500/20 transition-colors text-[oklch(0.6_0.01_260)] hover:text-red-400"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Progress indicator */}
          <div className="w-full max-w-md mt-6">
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: genreColor }} animate={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Queue Panel */}
        <AnimatePresence>
          {showQueue && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="w-full lg:w-96 border-l border-white/5 overflow-y-auto bg-[oklch(0.08_0.005_260)]/50">
              <div className="p-4 border-b border-white/5 sticky top-0 bg-[oklch(0.08_0.005_260)]/80 backdrop-blur-sm z-10">
                <h3 className="font-semibold text-sm">Queue</h3>
                <p className="text-xs text-[oklch(0.6_0.01_260)]">{queue.length} tracks · {isShuffled ? 'Shuffled' : 'In order'}</p>
              </div>
              <div className="p-2">
                {queue.map((track, index) => (
                  <button
                    key={`${track.id}-${index}`}
                    onClick={() => { setCurrentIndex(index); setIsPlaying(true); setShowQueue(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${index === currentIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-xs font-medium" style={index === currentIndex ? { backgroundColor: `${genreColor}30`, color: genreColor } : { backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      {index === currentIndex ? <Volume2 className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${index === currentIndex ? 'font-medium' : ''}`} style={index === currentIndex ? { color: genreColor } : {}}>{track.title}</p>
                      <p className="text-xs text-[oklch(0.6_0.01_260)] truncate">{track.artist}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
