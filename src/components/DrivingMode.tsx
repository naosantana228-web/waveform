import { motion } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, X, Car } from "lucide-react";

interface Props {
  isPlaying: boolean;
  currentTrack: { title: string; artist: string } | null;
  genreColor: string;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export default function DrivingMode({ isPlaying, currentTrack, genreColor, onPlayPause, onNext, onPrev, onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[oklch(0.05_0.005_260)]"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Close button - small, top right */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
      >
        <X className="w-6 h-6 text-[oklch(0.6_0.01_260)]" />
      </button>

      {/* Driving mode indicator */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <Car className="w-5 h-5" style={{ color: genreColor }} />
        <span className="text-sm font-medium" style={{ color: genreColor }}>Driving Mode</span>
      </div>

      {/* Track info - large and readable */}
      <div className="text-center mb-16 px-8">
        {currentTrack ? (
          <>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 line-clamp-2">{currentTrack.title}</h1>
            <p className="text-xl sm:text-2xl text-[oklch(0.6_0.01_260)]">{currentTrack.artist}</p>
          </>
        ) : (
          <p className="text-2xl text-[oklch(0.6_0.01_260)]">No track playing</p>
        )}
      </div>

      {/* Giant controls */}
      <div className="flex items-center gap-8 sm:gap-12">
        {/* Previous */}
        <button
          onClick={onPrev}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-white/5 active:bg-white/15 transition-all active:scale-95"
        >
          <SkipBack className="w-10 h-10 sm:w-12 sm:h-12" />
        </button>

        {/* Play/Pause - biggest button */}
        <button
          onClick={onPlayPause}
          className="w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl"
          style={{ backgroundColor: genreColor, color: '#0d0d0d' }}
        >
          {isPlaying ? (
            <Pause className="w-14 h-14 sm:w-16 sm:h-16" />
          ) : (
            <Play className="w-14 h-14 sm:w-16 sm:h-16 ml-2" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center bg-white/5 active:bg-white/15 transition-all active:scale-95"
        >
          <SkipForward className="w-10 h-10 sm:w-12 sm:h-12" />
        </button>
      </div>

      {/* Subtle progress */}
      <div className="absolute bottom-8 left-8 right-8">
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: genreColor, width: isPlaying ? '60%' : '0%' }} />
        </div>
      </div>
    </motion.div>
  );
}
