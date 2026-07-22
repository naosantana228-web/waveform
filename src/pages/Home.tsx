import { Link } from "wouter";
import { motion } from "framer-motion";
import { Music, Headphones, Radio, Disc3, Mic, Baby, ListMusic, Settings, Sparkles, BookOpen, Palette, Search } from "lucide-react";
import { genres, getTracksByGenre } from "@/data";

const genreIcons: Record<string, any> = {
  techno: Headphones,
  afrobeats: Music,
  reggae: Radio,
  reggaeton: Disc3,
  hiphop: Mic,
  infantil: Baby,
  popdance: Sparkles,
  relax: BookOpen,
  salon: Palette,
  custom: Search,
};

const genreColors: Record<string, string> = {
  techno: '#00d4aa',
  afrobeats: '#ff6b6b',
  reggae: '#ffa726',
  reggaeton: '#e040fb',
  hiphop: '#ffb300',
  infantil: '#ff69b4',
  popdance: '#7c3aed',
  relax: '#06b6d4',
  salon: '#f472b6',
  custom: '#a3e635',
};

const genreGlows: Record<string, string> = {
  techno: 'genre-glow-techno',
  afrobeats: 'genre-glow-afrobeats',
  reggae: 'genre-glow-reggae',
  reggaeton: 'genre-glow-reggaeton',
  hiphop: 'genre-glow-hiphop',
  infantil: 'genre-glow-infantil',
  popdance: 'genre-glow-popdance',
  relax: 'genre-glow-relax',
  salon: 'genre-glow-salon',
  custom: 'genre-glow-custom',
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663364052012/USZRj6GFcBYAcRBgUCrhq2/hero-dark-waves-oGpTSz7bzq3VAzJDTBSLxY.webp"
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.08_0.005_260)]/60 via-[oklch(0.08_0.005_260)]/80 to-[oklch(0.08_0.005_260)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-[#00d4aa]/20 flex items-center justify-center">
              <Music className="w-4 h-4 text-[#00d4aa]" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Waveform</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <Link href="/playlist" className="flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:bg-white/5 transition-colors">
              <ListMusic className="w-4 h-4 text-[oklch(0.6_0.01_260)]" />
              <span className="text-sm text-[oklch(0.6_0.01_260)]">My Playlist</span>
            </Link>
            <Link href="/settings" className="p-2 rounded-full glass-card hover:bg-white/5 transition-colors">
              <Settings className="w-4 h-4 text-[oklch(0.6_0.01_260)]" />
            </Link>
          </motion.div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center mb-16 max-w-2xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
              Discover Your
              <br />
              <span className="bg-gradient-to-r from-[#00d4aa] via-[#ff6b6b] via-[#ffa726] via-[#e040fb] to-[#ffb300] bg-clip-text text-transparent">
                Sound
              </span>
            </h1>
            <p className="text-lg text-[oklch(0.6_0.01_260)] max-w-md mx-auto leading-relaxed">
              Browse your collection, discover new tracks, and explore six curated genres.
            </p>
          </motion.div>

          {/* Genre Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-5xl">
            {genres.map((genre, index) => {
              const Icon = genreIcons[genre.key] || Music;
              const color = genreColors[genre.key] || '#00d4aa';
              const glowClass = genreGlows[genre.key] || '';
              const count = getTracksByGenre(genre.key).length;

              return (
                <motion.div
                  key={genre.key}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                >
                  <Link href={`/genre/${genre.key}`}>
                    <div className={`glass-card rounded-2xl p-6 hover:bg-white/5 transition-all duration-300 group ${glowClass} cursor-pointer`}>
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon className="w-6 h-6" style={{ color }} />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">{genre.name}</h3>
                      <p className="text-sm text-[oklch(0.6_0.01_260)] mb-3 line-clamp-2">{genre.subtitle}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs text-[oklch(0.6_0.01_260)]">{count} tracks</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </main>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center pb-8"
        >
          <p className="text-xs text-[oklch(0.6_0.01_260)]/60">
            Like tracks to build your collection. Discover mode learns your taste.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
