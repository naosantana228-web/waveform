import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, ThumbsUp, ThumbsDown, AlertTriangle, Play, Shuffle, Search, RotateCcw, Trash2 } from "lucide-react";
import { genres, getDiscoveryQueue, getLikedTracks, likeTrack, dislikeTrack, markBroken, unlikeTrack, resetDiscovery } from "@/data";
import CollectionPlayer from "@/components/CollectionPlayer";

export default function Genre() {
  const params = useParams<{ genre: string }>();
  const genreKey = params.genre || "techno";
  const genreInfo = genres.find((g) => g.key === genreKey);

  const [mode, setMode] = useState<"discover" | "collection">("collection");
  const [discoveryQueue, setDiscoveryQueue] = useState(() => getDiscoveryQueue(genreKey));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [likedList, setLikedList] = useState(() => getLikedTracks(genreKey));
  const [showPlayer, setShowPlayer] = useState(false);
  const [artistFilter, setArtistFilter] = useState("");

  const currentTrack = discoveryQueue[currentIdx];

  const filteredLiked = useMemo(() => {
    if (!artistFilter.trim()) return likedList;
    const q = artistFilter.toLowerCase();
    return likedList.filter(
      (t) => t.artist.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
    );
  }, [likedList, artistFilter]);

  const handleLike = () => {
    if (!currentTrack) return;
    likeTrack(genreKey, currentTrack.id);
    setLikedList(getLikedTracks(genreKey));
    setCurrentIdx((i) => i + 1);
  };

  const handleDislike = () => {
    if (!currentTrack) return;
    dislikeTrack(genreKey, currentTrack.id);
    setCurrentIdx((i) => i + 1);
  };

  const handleBroken = () => {
    if (!currentTrack) return;
    markBroken(genreKey, currentTrack.id);
    setCurrentIdx((i) => i + 1);
  };

  const handleRemove = (trackId: number) => {
    unlikeTrack(genreKey, trackId);
    setLikedList(getLikedTracks(genreKey));
  };

  const handleReset = () => {
    resetDiscovery(genreKey);
    setDiscoveryQueue(getDiscoveryQueue(genreKey));
    setCurrentIdx(0);
  };

  if (!genreInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Genre not found</p>
      </div>
    );
  }

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
          <h1 className="font-display font-bold text-xl">{genreInfo.name}</h1>
          <p className="text-text-muted text-sm">{genreInfo.subtitle}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 px-6 mb-6">
        <button
          onClick={() => setMode("collection")}
          className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            mode === "collection" ? "bg-surface text-text" : "text-text-muted hover:text-text"
          }`}
        >
          My Collection ({likedList.length})
        </button>
        <button
          onClick={() => setMode("discover")}
          className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            mode === "discover" ? "bg-surface text-text" : "text-text-muted hover:text-text"
          }`}
        >
          Discover ({discoveryQueue.length - currentIdx} left)
        </button>
      </div>

      {/* Content */}
      <div className="px-6 pb-20">
        {mode === "discover" ? (
          <div className="max-w-2xl mx-auto">
            {currentTrack ? (
              <>
                {/* YouTube Embed */}
                <div className="aspect-video rounded-xl overflow-hidden bg-black mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=1&rel=0`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>

                {/* Track Info */}
                <div className="mb-4">
                  <h2 className="font-display font-bold text-lg">{currentTrack.title}</h2>
                  <p className="text-text-muted">{currentTrack.artist}</p>
                  {currentTrack.artistBio && (
                    <p className="text-text-muted text-sm mt-2">{currentTrack.artistBio}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleDislike}
                    className="p-4 rounded-full glass glass-hover cursor-pointer text-red-400 hover:text-red-300"
                  >
                    <ThumbsDown className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleBroken}
                    className="p-3 rounded-full glass glass-hover cursor-pointer text-yellow-400 hover:text-yellow-300"
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleLike}
                    className="p-4 rounded-full bg-accent-techno/20 hover:bg-accent-techno/30 cursor-pointer text-accent-techno"
                  >
                    <ThumbsUp className="w-6 h-6" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-text-muted text-lg mb-4">All caught up! No more tracks to discover.</p>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg glass glass-hover cursor-pointer inline-flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Discovery
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {/* Shuffle Play + Filter */}
            {likedList.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button
                  onClick={() => setShowPlayer(true)}
                  className="px-4 py-2 rounded-lg bg-accent-techno/20 hover:bg-accent-techno/30 text-accent-techno font-medium text-sm cursor-pointer inline-flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle Play
                </button>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Filter by artist or track..."
                    value={artistFilter}
                    onChange={(e) => setArtistFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface border border-border text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent-techno"
                  />
                </div>
              </div>
            )}

            {/* Track List */}
            {filteredLiked.length > 0 ? (
              <div className="space-y-1">
                {filteredLiked.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{track.title}</p>
                      <p className="text-text-muted text-xs truncate">{track.artist}</p>
                    </div>
                    <button
                      onClick={() => handleRemove(track.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 cursor-pointer transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : likedList.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-text-muted">No tracks in your collection yet.</p>
                <p className="text-text-muted text-sm mt-1">Switch to Discover to find tracks you love.</p>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-text-muted">No tracks match "{artistFilter}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Player Overlay */}
      {showPlayer && likedList.length > 0 && (
        <CollectionPlayer
          tracks={likedList}
          shuffled={true}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </div>
  );
}
