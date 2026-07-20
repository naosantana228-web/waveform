import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ArrowLeft, Shuffle, Search, Trash2 } from "lucide-react";
import { genres, getAllLikedTracks, unlikeTrack } from "@/data";
import CollectionPlayer from "@/components/CollectionPlayer";
import type { Track } from "@/data";

export default function Playlist() {
  const [likedTracks, setLikedTracks] = useState(() => getAllLikedTracks());
  const [filter, setFilter] = useState("");
  const [showPlayer, setShowPlayer] = useState(false);

  const filtered = useMemo(() => {
    if (!filter.trim()) return likedTracks;
    const q = filter.toLowerCase();
    return likedTracks.filter(
      (t) => t.artist.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.genre.toLowerCase().includes(q)
    );
  }, [likedTracks, filter]);

  const groupedByGenre = useMemo(() => {
    const groups: Record<string, Track[]> = {};
    filtered.forEach((t) => {
      if (!groups[t.genre]) groups[t.genre] = [];
      groups[t.genre].push(t);
    });
    return groups;
  }, [filtered]);

  const handleRemove = (track: Track) => {
    unlikeTrack(track.genre, track.id);
    setLikedTracks(getAllLikedTracks());
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4">
        <Link href="/">
          <button className="p-2 rounded-lg hover:bg-surface cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="font-display font-bold text-xl">My Playlist</h1>
          <p className="text-text-muted text-sm">{likedTracks.length} tracks across all genres</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 pb-20">
        {/* Controls */}
        {likedTracks.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={() => setShowPlayer(true)}
              className="px-4 py-2 rounded-lg bg-accent-techno/20 hover:bg-accent-techno/30 text-accent-techno font-medium text-sm cursor-pointer inline-flex items-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle All
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Filter by artist, track, or genre..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent-techno"
              />
            </div>
          </div>
        )}

        {/* Grouped tracks */}
        {Object.keys(groupedByGenre).length > 0 ? (
          Object.entries(groupedByGenre).map(([genreKey, tracks]) => {
            const genreInfo = genres.find((g) => g.key === genreKey);
            return (
              <div key={genreKey} className="mb-6">
                <h2 className="font-display font-semibold text-sm text-text-muted mb-2">
                  {genreInfo?.name || genreKey} ({tracks.length})
                </h2>
                <div className="space-y-1">
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{track.title}</p>
                        <p className="text-text-muted text-xs truncate">{track.artist}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(track)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 cursor-pointer transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : likedTracks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-text-muted text-lg">Your playlist is empty.</p>
            <p className="text-text-muted text-sm mt-1">Go to a genre and discover tracks to build your collection.</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-text-muted">No tracks match "{filter}"</p>
          </div>
        )}
      </div>

      {/* Player */}
      {showPlayer && likedTracks.length > 0 && (
        <CollectionPlayer
          tracks={likedTracks}
          shuffled={true}
          onClose={() => setShowPlayer(false)}
          onRemove={(trackId) => {
            const track = likedTracks.find(t => t.id === trackId);
            if (track) handleRemove(track);
          }}
        />
      )}
    </div>
  );
}
