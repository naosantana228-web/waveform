import json

# Best music from the 60s, 70s, 80s, 90s — iconic tracks with real YouTube IDs
classics_tracks = [
    # 60s
    {"title": "Bohemian Rhapsody", "artist": "Queen", "youtubeId": "fJ9rUzIMcZQ", "year": 1975, "label": "EMI", "bpm": 72, "energy": 8, "groove": 6, "vocals": 10, "darkness": 4},
    {"title": "Hey Jude", "artist": "The Beatles", "youtubeId": "A_MjCqQoLLA", "year": 1968, "label": "Apple Records", "bpm": 74, "energy": 6, "groove": 5, "vocals": 9, "darkness": 2},
    {"title": "Respect", "artist": "Aretha Franklin", "youtubeId": "6FOUqQt3Kg0", "year": 1967, "label": "Atlantic", "bpm": 115, "energy": 8, "groove": 8, "vocals": 10, "darkness": 2},
    {"title": "What's Going On", "artist": "Marvin Gaye", "youtubeId": "H-kA3UtBj4M", "year": 1971, "label": "Tamla", "bpm": 98, "energy": 5, "groove": 7, "vocals": 9, "darkness": 3},
    {"title": "(Sittin' On) The Dock of the Bay", "artist": "Otis Redding", "youtubeId": "rTVjnBo96Ug", "year": 1968, "label": "Volt", "bpm": 104, "energy": 4, "groove": 6, "vocals": 9, "darkness": 3},
    # 70s
    {"title": "Stayin' Alive", "artist": "Bee Gees", "youtubeId": "fNFzfwLM72c", "year": 1977, "label": "RSO", "bpm": 104, "energy": 8, "groove": 9, "vocals": 8, "darkness": 2},
    {"title": "Hotel California", "artist": "Eagles", "youtubeId": "BciS5krYL80", "year": 1977, "label": "Asylum", "bpm": 74, "energy": 6, "groove": 6, "vocals": 8, "darkness": 5},
    {"title": "Superstition", "artist": "Stevie Wonder", "youtubeId": "0CFuCYNx-1g", "year": 1972, "label": "Tamla", "bpm": 101, "energy": 9, "groove": 10, "vocals": 9, "darkness": 3},
    {"title": "Stairway to Heaven", "artist": "Led Zeppelin", "youtubeId": "QkF3oxziUI4", "year": 1971, "label": "Atlantic", "bpm": 82, "energy": 7, "groove": 5, "vocals": 8, "darkness": 4},
    {"title": "Dancing Queen", "artist": "ABBA", "youtubeId": "xFrGuyw1V8s", "year": 1976, "label": "Polar", "bpm": 100, "energy": 8, "groove": 9, "vocals": 9, "darkness": 1},
    # 80s
    {"title": "Billie Jean", "artist": "Michael Jackson", "youtubeId": "Zi_XLOBDo_Y", "year": 1982, "label": "Epic", "bpm": 117, "energy": 8, "groove": 10, "vocals": 9, "darkness": 4},
    {"title": "Sweet Child O' Mine", "artist": "Guns N' Roses", "youtubeId": "1w7OgIMMRc4", "year": 1987, "label": "Geffen", "bpm": 126, "energy": 9, "groove": 7, "vocals": 8, "darkness": 3},
    {"title": "Take On Me", "artist": "a-ha", "youtubeId": "djV11Xbc914", "year": 1985, "label": "Warner Bros.", "bpm": 169, "energy": 8, "groove": 7, "vocals": 9, "darkness": 2},
    {"title": "Every Breath You Take", "artist": "The Police", "youtubeId": "OMOGaugKpzs", "year": 1983, "label": "A&M", "bpm": 117, "energy": 5, "groove": 6, "vocals": 8, "darkness": 5},
    {"title": "Like a Prayer", "artist": "Madonna", "youtubeId": "79fzeNUqQbQ", "year": 1989, "label": "Sire", "bpm": 112, "energy": 8, "groove": 8, "vocals": 9, "darkness": 3},
    {"title": "Don't Stop Believin'", "artist": "Journey", "youtubeId": "1k8craCGpgs", "year": 1981, "label": "Columbia", "bpm": 119, "energy": 8, "groove": 7, "vocals": 9, "darkness": 2},
    {"title": "Under Pressure", "artist": "Queen & David Bowie", "youtubeId": "a01QQZyl-_I", "year": 1981, "label": "EMI", "bpm": 114, "energy": 7, "groove": 8, "vocals": 10, "darkness": 4},
    # 90s
    {"title": "Smells Like Teen Spirit", "artist": "Nirvana", "youtubeId": "hTWKbfoikeg", "year": 1991, "label": "DGC", "bpm": 117, "energy": 10, "groove": 7, "vocals": 8, "darkness": 7},
    {"title": "Wonderwall", "artist": "Oasis", "youtubeId": "bx1Bh8ZvH84", "year": 1995, "label": "Creation", "bpm": 87, "energy": 6, "groove": 5, "vocals": 8, "darkness": 3},
    {"title": "No Diggity", "artist": "Blackstreet ft. Dr. Dre", "youtubeId": "3KL9mRus19o", "year": 1996, "label": "Interscope", "bpm": 85, "energy": 7, "groove": 9, "vocals": 8, "darkness": 4},
    {"title": "Killing Me Softly", "artist": "Fugees", "youtubeId": "oKOtzIo-uYw", "year": 1996, "label": "Ruffhouse", "bpm": 93, "energy": 5, "groove": 7, "vocals": 10, "darkness": 3},
    {"title": "Creep", "artist": "Radiohead", "youtubeId": "XFkzRNyygfk", "year": 1993, "label": "Parlophone", "bpm": 92, "energy": 6, "groove": 4, "vocals": 9, "darkness": 7},
    {"title": "Waterfalls", "artist": "TLC", "youtubeId": "8WEtxJ4-sh4", "year": 1995, "label": "LaFace", "bpm": 86, "energy": 5, "groove": 7, "vocals": 9, "darkness": 3},
    {"title": "Bitter Sweet Symphony", "artist": "The Verve", "youtubeId": "1lyu1KKwC74", "year": 1997, "label": "Hut", "bpm": 86, "energy": 7, "groove": 6, "vocals": 8, "darkness": 4},
    {"title": "I Want It That Way", "artist": "Backstreet Boys", "youtubeId": "4fndeDfaWCg", "year": 1999, "label": "Jive", "bpm": 100, "energy": 6, "groove": 6, "vocals": 9, "darkness": 2},
]

# Load existing tracks
with open('src/data/tracks.json') as f:
    tracks = json.load(f)

max_id = max(t['id'] for t in tracks)
start_id = max_id + 1

for i, t in enumerate(classics_tracks):
    track = {
        "id": start_id + i,
        "title": t["title"],
        "artist": t["artist"],
        "genre": "classics",
        "youtubeId": t["youtubeId"],
        "attributes": json.dumps({
            "energy": t["energy"],
            "groove": t["groove"],
            "vocals": t["vocals"],
            "darkness": t["darkness"],
            "bpm": t["bpm"]
        }),
        "artistBio": None,
        "artistFacts": None,
        "label": t["label"],
        "year": t["year"],
        "isAiRecommended": 0
    }
    tracks.append(track)

with open('src/data/tracks.json', 'w') as f:
    json.dump(tracks, f, indent=2)

print(f"Added {len(classics_tracks)} classics tracks (IDs {start_id} to {start_id + len(classics_tracks) - 1})")
print(f"Total tracks now: {len(tracks)}")
