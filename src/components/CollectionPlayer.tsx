import { useState, useEffect, useRef, useCallback } from "react";
import { X, SkipBack, SkipForward, Play, Pause, Shuffle, Repeat, List } from "lucide-react";
import type { Track } from "@/data";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Props {
  tracks: Track[];
  startIndex?: number;
  shuffled?: boolean;
  onClose: () => void;
}

export default function CollectionPlayer({ tracks, startIndex = 0, shuffled = true, onClose }: Props) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showQueue, setShowQueue] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let q = [...tracks];
    if (shuffled) {
      for (let i = q.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [q[i], q[j]] = [q[j], q[i]];
      }
    }
    setQueue(q);
    setCurrentIdx(shuffled ? 0 : startIndex);
  }, [tracks, startIndex, shuffled]);

  useEffect(() => {
    if (queue.length === 0) return;

    const loadAPI = () => {
      if (window.YT && window.YT.Player) {
        initPlayer();
        return;
      }
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = initPlayer;
    };

    const initPlayer = () => {
      if (playerRef.current) {
        playerRef.current.loadVideoById(queue[currentIdx].youtubeId);
        return;
      }
      playerRef.current = new window.YT.Player("yt-player", {
        height: "100%",
        width: "100%",
        videoId: queue[currentIdx].youtubeId,
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === 0) handleNext();
            if (e.data === 1) setIsPlaying(true);
            if (e.data === 2) setIsPlaying(false);
          },
        },
      });
    };

    loadAPI();
  }, [queue]);

  useEffect(() => {
    if (playerRef.current && playerRef.current.loadVideoById && queue[currentIdx]) {
      playerRef.current.loadVideoById(queue[currentIdx].youtubeId);
    }
  }, [currentIdx]);

  const handleNext = useCallback(() => {
    setCurrentIdx((prev) => {
      if (prev >= queue.length - 1) return repeat ? 0 : prev;
      return prev + 1;
    });
  }, [queue.length, repeat]);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev <= 0 ? 0 : prev - 1));
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const currentTrack = queue[currentIdx];
  if (!currentTrack) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm text-text-muted">
          Now Playing {currentIdx + 1}/{queue.length}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowQueue(!showQueue)} className="p-2 rounded-lg hover:bg-surface cursor-pointer">
            <List className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Video */}
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl aspect-video rounded-xl overflow-hidden bg-black">
            <div id="yt-player" className="w-full h-full" />
          </div>
          <div className="mt-4 text-center">
            <h2 className="font-display font-bold text-xl">{currentTrack.title}</h2>
            <p className="text-text-muted">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Queue panel */}
        {showQueue && (
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border overflow-y-auto p-3">
            <h3 className="font-semibold text-sm mb-2 text-text-muted">Queue</h3>
            {queue.map((track, i) => (
              <button
                key={track.id}
                onClick={() => setCurrentIdx(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 cursor-pointer transition-colors ${
                  i === currentIdx ? "bg-accent-techno/20 text-accent-techno" : "hover:bg-surface"
                }`}
              >
                <span className="font-medium">{track.title}</span>
                <span className="text-text-muted ml-1">— {track.artist}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-4 border-t border-border">
        <button onClick={() => setRepeat(!repeat)} className={`p-2 rounded-lg cursor-pointer ${repeat ? "text-accent-techno" : "text-text-muted hover:text-text"}`}>
          <Repeat className="w-4 h-4" />
        </button>
        <button onClick={handlePrev} className="p-2 rounded-lg hover:bg-surface cursor-pointer">
          <SkipBack className="w-5 h-5" />
        </button>
        <button onClick={togglePlay} className="p-3 rounded-full bg-accent-techno text-background cursor-pointer">
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        <button onClick={handleNext} className="p-2 rounded-lg hover:bg-surface cursor-pointer">
          <SkipForward className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-accent-techno cursor-default">
          <Shuffle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
