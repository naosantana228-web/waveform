import { Link } from "wouter";
import { Music, Headphones, Radio, Disc3, Mic } from "lucide-react";
import { genres, getTracksByGenre } from "@/data";

const icons = {
  techno: Headphones,
  afrobeats: Music,
  reggae: Radio,
  reggaeton: Disc3,
  hiphop: Mic,
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-techno/20 flex items-center justify-center">
            <Music className="w-4 h-4 text-accent-techno" />
          </div>
          <span className="font-display font-semibold text-lg">Waveform</span>
        </div>
        <Link href="/playlist">
          <button className="px-4 py-2 rounded-lg glass glass-hover text-sm font-medium cursor-pointer">
            My Playlist
          </button>
        </Link>
      </header>

      {/* Hero */}
      <section className="text-center py-20 px-4">
        <h1 className="font-display text-5xl md:text-7xl font-bold mb-4">
          Discover Your{" "}
          <span className="bg-gradient-to-r from-accent-techno via-accent-afrobeats to-accent-reggaeton bg-clip-text text-transparent">
            Sound
          </span>
        </h1>
        <p className="text-text-muted text-lg max-w-xl mx-auto">
          Browse your collection, discover new tracks, and explore five curated genres.
        </p>
      </section>

      {/* Genre Cards */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {genres.map((genre) => {
            const Icon = icons[genre.key as keyof typeof icons];
            const count = getTracksByGenre(genre.key).length;
            return (
              <Link key={genre.key} href={`/genre/${genre.key}`}>
                <div className="glass glass-hover rounded-xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] h-full">
                  <div className={`w-10 h-10 rounded-lg bg-${genre.color}/20 flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 text-${genre.color}`} />
                  </div>
                  <h3 className="font-display font-semibold text-sm mb-1">{genre.name}</h3>
                  <p className="text-text-muted text-xs mb-3 line-clamp-2">{genre.subtitle}</p>
                  <span className="text-xs text-text-muted">{count} tracks</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-text-muted text-sm">
        Like tracks to build your collection. Discover mode learns your taste.
      </footer>
    </div>
  );
}
