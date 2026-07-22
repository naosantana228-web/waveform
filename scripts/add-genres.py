#!/usr/bin/env python3
"""Add 3 new genres with curated tracks to tracks.json"""
import json

# New genres with curated tracks (real YouTube IDs verified)
new_tracks = []

# Starting ID: 3000000 for pop/dance, 3100000 for relax, 3200000 for salon
# ============ POP/DANCE (Dua Lipa, Harry Styles, Benny Benassi style) ============
pop_tracks = [
    {"title": "Levitating", "artist": "Dua Lipa", "youtubeId": "TUVcZfQe-Kw", "bpm": 103, "energy": 8, "groove": 9, "vocals": 8, "darkness": 2, "year": 2020, "label": "Warner Records", "bio": "Dua Lipa is a British-Albanian pop superstar known for her retro-disco influenced dance-pop anthems."},
    {"title": "Don't Start Now", "artist": "Dua Lipa", "youtubeId": "oygrmJFKYZY", "bpm": 124, "energy": 8, "groove": 9, "vocals": 8, "darkness": 2, "year": 2019, "label": "Warner Records", "bio": ""},
    {"title": "Physical", "artist": "Dua Lipa", "youtubeId": "9HDEHj2yzew", "bpm": 148, "energy": 9, "groove": 8, "vocals": 7, "darkness": 3, "year": 2020, "label": "Warner Records", "bio": ""},
    {"title": "New Rules", "artist": "Dua Lipa", "youtubeId": "k2qgadSvNyU", "bpm": 116, "energy": 7, "groove": 8, "vocals": 8, "darkness": 2, "year": 2017, "label": "Warner Records", "bio": ""},
    {"title": "Houdini", "artist": "Dua Lipa", "youtubeId": "suAR1PYFNYA", "bpm": 128, "energy": 8, "groove": 9, "vocals": 8, "darkness": 2, "year": 2023, "label": "Warner Records", "bio": ""},
    {"title": "As It Was", "artist": "Harry Styles", "youtubeId": "H5v3kku4y6Q", "bpm": 174, "energy": 7, "groove": 7, "vocals": 8, "darkness": 4, "year": 2022, "label": "Columbia Records", "bio": "Harry Styles is a British singer-songwriter known for his genre-blending pop-rock sound and charismatic stage presence."},
    {"title": "Watermelon Sugar", "artist": "Harry Styles", "youtubeId": "E07s5ZYadZA", "bpm": 95, "energy": 7, "groove": 8, "vocals": 7, "darkness": 2, "year": 2020, "label": "Columbia Records", "bio": ""},
    {"title": "Late Night Talking", "artist": "Harry Styles", "youtubeId": "jjt9Eo4mbIo", "bpm": 107, "energy": 7, "groove": 8, "vocals": 8, "darkness": 2, "year": 2022, "label": "Columbia Records", "bio": ""},
    {"title": "Satisfaction", "artist": "Benny Benassi", "youtubeId": "a0fkNdPiIL4", "bpm": 130, "energy": 9, "groove": 9, "vocals": 3, "darkness": 3, "year": 2002, "label": "Ultra Records", "bio": "Benny Benassi is an Italian DJ and producer, a pioneer of electro house known for his minimalist, bass-heavy productions."},
    {"title": "Cinema", "artist": "Benny Benassi ft. Gary Go", "youtubeId": "2GKHFPEbVJQ", "bpm": 128, "energy": 8, "groove": 8, "vocals": 7, "darkness": 3, "year": 2011, "label": "Ultra Records", "bio": ""},
    {"title": "Blinding Lights", "artist": "The Weeknd", "youtubeId": "4NRXx6U8ABQ", "bpm": 171, "energy": 8, "groove": 9, "vocals": 8, "darkness": 4, "year": 2020, "label": "XO/Republic", "bio": "The Weeknd is a Canadian artist known for his dark, atmospheric R&B-pop and cinematic productions."},
    {"title": "Save Your Tears", "artist": "The Weeknd", "youtubeId": "XXYlFuWEuKI", "bpm": 118, "energy": 7, "groove": 8, "vocals": 8, "darkness": 3, "year": 2020, "label": "XO/Republic", "bio": ""},
    {"title": "Flowers", "artist": "Miley Cyrus", "youtubeId": "G7KNmW9a75Y", "bpm": 118, "energy": 7, "groove": 8, "vocals": 8, "darkness": 2, "year": 2023, "label": "Columbia Records", "bio": "Miley Cyrus is an American singer known for her powerful vocals and genre-spanning pop anthems."},
    {"title": "About Damn Time", "artist": "Lizzo", "youtubeId": "IXXxciRUMzE", "bpm": 109, "energy": 9, "groove": 9, "vocals": 8, "darkness": 1, "year": 2022, "label": "Atlantic Records", "bio": "Lizzo is an American singer and rapper known for her empowering, feel-good pop-funk anthems."},
    {"title": "Uptown Funk", "artist": "Bruno Mars", "youtubeId": "OPf0YbXqDm0", "bpm": 115, "energy": 9, "groove": 10, "vocals": 8, "darkness": 1, "year": 2014, "label": "Atlantic Records", "bio": "Bruno Mars is an American singer-songwriter known for his retro-funk pop and electrifying live performances."},
    {"title": "24K Magic", "artist": "Bruno Mars", "youtubeId": "UqyT8IEBkvY", "bpm": 107, "energy": 8, "groove": 9, "vocals": 8, "darkness": 2, "year": 2016, "label": "Atlantic Records", "bio": ""},
    {"title": "Dance The Night", "artist": "Dua Lipa", "youtubeId": "OiC1rgCPmUQ", "bpm": 110, "energy": 8, "groove": 9, "vocals": 8, "darkness": 2, "year": 2023, "label": "Warner Records", "bio": ""},
    {"title": "Titanium", "artist": "David Guetta ft. Sia", "youtubeId": "JRfuAukYTKg", "bpm": 126, "energy": 9, "groove": 7, "vocals": 9, "darkness": 3, "year": 2011, "label": "Virgin Records", "bio": "David Guetta is a French DJ and producer who helped bring EDM into mainstream pop."},
    {"title": "Hey Brother", "artist": "Avicii", "youtubeId": "6Cp6mKbRTQY", "bpm": 125, "energy": 8, "groove": 7, "vocals": 8, "darkness": 3, "year": 2013, "label": "PRMD Music", "bio": "Avicii was a Swedish DJ and producer whose melodic EDM defined a generation of dance music."},
    {"title": "Shut Up and Dance", "artist": "Walk the Moon", "youtubeId": "6JCLY0Rlx6Q", "bpm": 128, "energy": 9, "groove": 8, "vocals": 8, "darkness": 1, "year": 2014, "label": "RCA Records", "bio": "Walk the Moon is an American indie pop band known for their energetic, synth-driven anthems."},
]

# ============ RELAJACIÓN / LECTURA ============
relax_tracks = [
    {"title": "Weightless", "artist": "Marconi Union", "youtubeId": "UfcAVejslrU", "bpm": 60, "energy": 1, "groove": 3, "vocals": 0, "darkness": 3, "year": 2011, "label": "Just Music", "bio": "Marconi Union is a British ambient trio known for creating scientifically-designed relaxation music."},
    {"title": "Clair de Lune", "artist": "Debussy", "youtubeId": "CvFH_6DNRCY", "bpm": 72, "energy": 2, "groove": 2, "vocals": 0, "darkness": 3, "year": 1905, "label": "Classical", "bio": "Claude Debussy was a French impressionist composer whose piano works evoke dreamy, atmospheric landscapes."},
    {"title": "Gymnopédie No. 1", "artist": "Erik Satie", "youtubeId": "S-Xm7s9eGxU", "bpm": 66, "energy": 1, "groove": 2, "vocals": 0, "darkness": 3, "year": 1888, "label": "Classical", "bio": "Erik Satie was a French composer known for his minimalist, meditative piano compositions."},
    {"title": "River Flows in You", "artist": "Yiruma", "youtubeId": "7maJOI3QMu0", "bpm": 70, "energy": 3, "groove": 3, "vocals": 0, "darkness": 2, "year": 2001, "label": "Stomp Music", "bio": "Yiruma is a South Korean pianist known for his gentle, emotionally evocative neo-classical compositions."},
    {"title": "Experience", "artist": "Ludovico Einaudi", "youtubeId": "hN_q-_nGv4U", "bpm": 75, "energy": 4, "groove": 3, "vocals": 0, "darkness": 4, "year": 2013, "label": "Decca Records", "bio": "Ludovico Einaudi is an Italian pianist and composer known for his minimalist, emotionally rich compositions."},
    {"title": "Nuvole Bianche", "artist": "Ludovico Einaudi", "youtubeId": "4VR-6AS0-l4", "bpm": 68, "energy": 3, "groove": 2, "vocals": 0, "darkness": 3, "year": 2004, "label": "Decca Records", "bio": ""},
    {"title": "Comptine d'un autre été", "artist": "Yann Tiersen", "youtubeId": "NvryolGa19A", "bpm": 100, "energy": 4, "groove": 4, "vocals": 0, "darkness": 3, "year": 2001, "label": "EMI", "bio": "Yann Tiersen is a French musician known for his delicate piano compositions, especially the Amélie soundtrack."},
    {"title": "Arrival of the Birds", "artist": "The Cinematic Orchestra", "youtubeId": "MqoANESQ4cQ", "bpm": 60, "energy": 3, "groove": 2, "vocals": 0, "darkness": 2, "year": 2007, "label": "Ninja Tune", "bio": "The Cinematic Orchestra is a British group blending jazz, electronic, and orchestral music."},
    {"title": "Snowfall", "artist": "Øneheart & Reidenshi", "youtubeId": "2u1mLSMB9IA", "bpm": 85, "energy": 2, "groove": 4, "vocals": 0, "darkness": 3, "year": 2022, "label": "Independent", "bio": "Øneheart is an ambient electronic producer known for atmospheric, lo-fi soundscapes."},
    {"title": "Intro", "artist": "The xx", "youtubeId": "xMV6l2y67rk", "bpm": 110, "energy": 3, "groove": 5, "vocals": 0, "darkness": 4, "year": 2009, "label": "Young", "bio": "The xx are a British indie band known for their minimal, intimate electronic-pop sound."},
    {"title": "Saturn", "artist": "Sleeping At Last", "youtubeId": "h3lWwMHFhnA", "bpm": 70, "energy": 4, "groove": 2, "vocals": 7, "darkness": 3, "year": 2014, "label": "Independent", "bio": "Sleeping At Last is the solo project of Ryan O'Neal, creating cinematic, orchestral indie folk."},
    {"title": "Bloom", "artist": "The Paper Kites", "youtubeId": "8inJtTG_DuU", "bpm": 78, "energy": 3, "groove": 4, "vocals": 7, "darkness": 2, "year": 2013, "label": "Wonderlick", "bio": "The Paper Kites are an Australian indie folk band known for their gentle, romantic songwriting."},
    {"title": "Holocene", "artist": "Bon Iver", "youtubeId": "TWcyIpul8OE", "bpm": 108, "energy": 4, "groove": 3, "vocals": 7, "darkness": 4, "year": 2011, "label": "Jagjaguwar", "bio": "Bon Iver is the project of Justin Vernon, blending folk, electronic, and experimental sounds."},
    {"title": "Re: Stacks", "artist": "Bon Iver", "youtubeId": "GhDnyPsQBSA", "bpm": 80, "energy": 2, "groove": 3, "vocals": 7, "darkness": 4, "year": 2007, "label": "Jagjaguwar", "bio": ""},
    {"title": "Opus 23", "artist": "Dustin O'Halloran", "youtubeId": "MNxHMjGmBDc", "bpm": 65, "energy": 2, "groove": 2, "vocals": 0, "darkness": 3, "year": 2006, "label": "FatCat Records", "bio": "Dustin O'Halloran is an American pianist and composer known for his delicate neo-classical works."},
]

# ============ SALÓN DE UÑAS ============
salon_tracks = [
    {"title": "Cruel Summer", "artist": "Taylor Swift", "youtubeId": "ic8j13piAhQ", "bpm": 170, "energy": 8, "groove": 8, "vocals": 9, "darkness": 2, "year": 2019, "label": "Republic Records", "bio": "Taylor Swift is an American singer-songwriter who transitioned from country to become one of pop's biggest artists."},
    {"title": "Shake It Off", "artist": "Taylor Swift", "youtubeId": "nfWlot6h_JM", "bpm": 160, "energy": 9, "groove": 8, "vocals": 8, "darkness": 1, "year": 2014, "label": "Republic Records", "bio": ""},
    {"title": "Anti-Hero", "artist": "Taylor Swift", "youtubeId": "b1kbLwvqugk", "bpm": 97, "energy": 7, "groove": 7, "vocals": 8, "darkness": 3, "year": 2022, "label": "Republic Records", "bio": ""},
    {"title": "Espresso", "artist": "Sabrina Carpenter", "youtubeId": "eVli-tstM5E", "bpm": 104, "energy": 7, "groove": 8, "vocals": 8, "darkness": 1, "year": 2024, "label": "Island Records", "bio": "Sabrina Carpenter is an American singer known for her catchy, playful pop with retro influences."},
    {"title": "Please Please Please", "artist": "Sabrina Carpenter", "youtubeId": "cF1Na4AIecM", "bpm": 107, "energy": 6, "groove": 7, "vocals": 8, "darkness": 2, "year": 2024, "label": "Island Records", "bio": ""},
    {"title": "Vampire", "artist": "Olivia Rodrigo", "youtubeId": "RlPNh_PBZb4", "bpm": 138, "energy": 8, "groove": 7, "vocals": 9, "darkness": 4, "year": 2023, "label": "Geffen Records", "bio": "Olivia Rodrigo is an American singer known for her emotionally raw pop-rock anthems."},
    {"title": "good 4 u", "artist": "Olivia Rodrigo", "youtubeId": "gNi_6U5Pm_o", "bpm": 166, "energy": 9, "groove": 8, "vocals": 9, "darkness": 3, "year": 2021, "label": "Geffen Records", "bio": ""},
    {"title": "Attention", "artist": "Charlie Puth", "youtubeId": "nfs8NYg7yQM", "bpm": 100, "energy": 7, "groove": 8, "vocals": 8, "darkness": 2, "year": 2017, "label": "Atlantic Records", "bio": "Charlie Puth is an American singer-songwriter known for his catchy, R&B-influenced pop productions."},
    {"title": "Señorita", "artist": "Shawn Mendes & Camila Cabello", "youtubeId": "Pkh8UtuejGw", "bpm": 117, "energy": 6, "groove": 8, "vocals": 8, "darkness": 2, "year": 2019, "label": "Island Records", "bio": "Shawn Mendes is a Canadian pop artist known for his romantic, guitar-driven hits."},
    {"title": "Peaches", "artist": "Justin Bieber ft. Daniel Caesar", "youtubeId": "tQ0yjYUFKAE", "bpm": 90, "energy": 6, "groove": 8, "vocals": 8, "darkness": 2, "year": 2021, "label": "Def Jam", "bio": "Justin Bieber is a Canadian pop superstar known for his smooth vocal delivery and R&B-pop crossovers."},
    {"title": "Kiss Me More", "artist": "Doja Cat ft. SZA", "youtubeId": "0EVVKs6DQLo", "bpm": 111, "energy": 7, "groove": 8, "vocals": 8, "darkness": 2, "year": 2021, "label": "Kemosabe/RCA", "bio": "Doja Cat is an American rapper and singer known for her genre-blending pop-rap with playful, catchy hooks."},
    {"title": "Say So", "artist": "Doja Cat", "youtubeId": "pok8H_KF1FA", "bpm": 111, "energy": 7, "groove": 9, "vocals": 8, "darkness": 2, "year": 2019, "label": "Kemosabe/RCA", "bio": ""},
    {"title": "Heat Waves", "artist": "Glass Animals", "youtubeId": "mRD0-GxDwss", "bpm": 81, "energy": 6, "groove": 7, "vocals": 7, "darkness": 3, "year": 2020, "label": "Polydor", "bio": "Glass Animals are a British indie-pop band known for their psychedelic, groove-driven productions."},
    {"title": "Positions", "artist": "Ariana Grande", "youtubeId": "tcYodQoapMg", "bpm": 144, "energy": 6, "groove": 8, "vocals": 9, "darkness": 2, "year": 2020, "label": "Republic Records", "bio": "Ariana Grande is an American singer known for her powerful vocals and R&B-pop fusion."},
    {"title": "7 rings", "artist": "Ariana Grande", "youtubeId": "QYh6mYIJG2Y", "bpm": 140, "energy": 8, "groove": 9, "vocals": 8, "darkness": 2, "year": 2019, "label": "Republic Records", "bio": ""},
    {"title": "Havana", "artist": "Camila Cabello", "youtubeId": "BQ0mxQXmLsk", "bpm": 105, "energy": 7, "groove": 8, "vocals": 8, "darkness": 2, "year": 2017, "label": "Syco/Epic", "bio": "Camila Cabello is a Cuban-American singer known for her Latin-pop crossover hits."},
    {"title": "Levitating (feat. DaBaby)", "artist": "Dua Lipa", "youtubeId": "WHuBW3qKm9g", "bpm": 103, "energy": 8, "groove": 9, "vocals": 8, "darkness": 2, "year": 2020, "label": "Warner Records", "bio": ""},
    {"title": "Butter", "artist": "BTS", "youtubeId": "WMweEpGlu_U", "bpm": 110, "energy": 8, "groove": 9, "vocals": 7, "darkness": 1, "year": 2021, "label": "BIGHIT MUSIC", "bio": "BTS is a South Korean boy band known for their catchy pop anthems and global cultural impact."},
]

# Build the track objects
base_id = 3000000
for i, t in enumerate(pop_tracks):
    new_tracks.append({
        "id": base_id + i + 1,
        "title": t["title"],
        "artist": t["artist"],
        "genre": "popdance",
        "youtubeId": t["youtubeId"],
        "attributes": {"bpm": t["bpm"], "darkness": t["darkness"], "energy": t["energy"], "groove": t["groove"], "vocals": t["vocals"]},
        "artistBio": t["bio"],
        "artistFacts": [],
        "label": t["label"],
        "year": t["year"],
        "isAiRecommended": 0,
    })

base_id = 3100000
for i, t in enumerate(relax_tracks):
    new_tracks.append({
        "id": base_id + i + 1,
        "title": t["title"],
        "artist": t["artist"],
        "genre": "relax",
        "youtubeId": t["youtubeId"],
        "attributes": {"bpm": t["bpm"], "darkness": t["darkness"], "energy": t["energy"], "groove": t["groove"], "vocals": t["vocals"]},
        "artistBio": t["bio"],
        "artistFacts": [],
        "label": t["label"],
        "year": t["year"],
        "isAiRecommended": 0,
    })

base_id = 3200000
for i, t in enumerate(salon_tracks):
    new_tracks.append({
        "id": base_id + i + 1,
        "title": t["title"],
        "artist": t["artist"],
        "genre": "salon",
        "youtubeId": t["youtubeId"],
        "attributes": {"bpm": t["bpm"], "darkness": t["darkness"], "energy": t["energy"], "groove": t["groove"], "vocals": t["vocals"]},
        "artistBio": t["bio"],
        "artistFacts": [],
        "label": t["label"],
        "year": t["year"],
        "isAiRecommended": 0,
    })

# Load existing tracks and append
with open('src/data/tracks.json', 'r') as f:
    existing = json.load(f)

existing.extend(new_tracks)

with open('src/data/tracks.json', 'w') as f:
    json.dump(existing, f, indent=2)

print(f"Added {len(new_tracks)} new tracks ({len(pop_tracks)} pop/dance + {len(relax_tracks)} relax + {len(salon_tracks)} salon)")
print(f"Total tracks now: {len(existing)}")
