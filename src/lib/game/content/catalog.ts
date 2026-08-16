/**
 * Content Catalog (§7, §8, §9, §10)
 * ----------------------------------
 * Pure data. Adding a category or word requires NO change to game engine, UI,
 * role engine, voting, or score engine.
 *
 * Quality criteria (§9):
 * - Words must be understandable & playable for 3-12 players
 * - Words should invite discussion / different interpretations
 * - Multiple words may share a hint (semantic grouping, §10)
 *
 * Initial catalog: ~25 categories × 5 words each. Architecture supports 100+.
 */

import type { Category } from '../models'

export const CATALOG: Category[] = [
  {
    id: 'alltag',
    displayName: 'Alltag',
    icon: '☕',
    words: [
      { text: 'Zahnbürste', hint: 'Morgens' },
      { text: 'Schlüsselbund', hint: 'Morgens' },
      { text: 'Kaffeemaschine', hint: 'Morgens' },
      { text: 'Einkaufszettel', hint: 'Morgens' },
      { text: 'Wecker', hint: 'Morgens' },
    ],
  },
  {
    id: 'essen',
    displayName: 'Essen',
    icon: '🍕',
    words: [
      { text: 'Pizza', hint: 'Fast Food' },
      { text: 'Burger', hint: 'Fast Food' },
      { text: 'Döner', hint: 'Fast Food' },
      { text: 'Sushi', hint: 'Asiatisch' },
      { text: 'Pommes', hint: 'Fast Food' },
    ],
  },
  {
    id: 'schule',
    displayName: 'Schule',
    icon: '📚',
    words: [
      { text: 'Pausenbrot', hint: 'Schulalltag' },
      { text: 'Tafel', hint: 'Schulalltag' },
      { text: 'Füller', hint: 'Schulalltag' },
      { text: 'Zeugnis', hint: 'Prüfung' },
      { text: 'Hausaufgabe', hint: 'Prüfung' },
    ],
  },
  {
    id: 'tiere',
    displayName: 'Tiere',
    icon: '🦊',
    words: [
      { text: 'Hund', hint: 'Haustier' },
      { text: 'Katze', hint: 'Haustier' },
      { text: 'Pinguin', hint: 'Wildtier' },
      { text: 'Känguru', hint: 'Wildtier' },
      { text: 'Goldfisch', hint: 'Haustier' },
    ],
  },
  {
    id: 'orte',
    displayName: 'Orte',
    icon: '📍',
    words: [
      { text: 'Bibliothek', hint: 'Ruhiger Ort' },
      { text: 'Stadion', hint: 'Lauter Ort' },
      { text: 'Bahnhof', hint: 'Lauter Ort' },
      { text: 'Park', hint: 'Ruhiger Ort' },
      { text: 'Krankenhaus', hint: 'Lauter Ort' },
    ],
  },
  {
    id: 'berufe',
    displayName: 'Berufe',
    icon: '💼',
    words: [
      { text: 'Feuerwehrmann', hint: 'Retter' },
      { text: 'Sanitäter', hint: 'Retter' },
      { text: 'Bäcker', hint: 'Handwerk' },
      { text: 'Anwalt', hint: 'Büro' },
      { text: 'Pilot', hint: 'Draußen' },
    ],
  },
  {
    id: 'sport',
    displayName: 'Sport',
    icon: '⚽',
    words: [
      { text: 'Fußball', hint: 'Mannschaft' },
      { text: 'Volleyball', hint: 'Mannschaft' },
      { text: 'Tennis', hint: 'Einzelsport' },
      { text: 'Boxen', hint: 'Einzelsport' },
      { text: 'Schach', hint: 'Einzelsport' },
    ],
  },
  {
    id: 'videospiele',
    displayName: 'Videospiele',
    icon: '🎮',
    words: [
      { text: 'Minecraft', hint: 'Sandbox' },
      { text: 'Fortnite', hint: 'Battle Royale' },
      { text: 'Mario Kart', hint: 'Rennspiel' },
      { text: 'Among Us', hint: 'Sozial' },
      { text: 'FIFA', hint: 'Simulation' },
    ],
  },
  {
    id: 'filme',
    displayName: 'Filme',
    icon: '🎬',
    words: [
      { text: 'Titanic', hint: 'Drama' },
      { text: 'Harry Potter', hint: 'Fantasy' },
      { text: 'Avengers', hint: 'Action' },
      { text: 'Frozen', hint: 'Animation' },
      { text: 'Joker', hint: 'Drama' },
    ],
  },
  {
    id: 'serien',
    displayName: 'Serien',
    icon: '📺',
    words: [
      { text: 'Stranger Things', hint: 'Mystery' },
      { text: 'Breaking Bad', hint: 'Drama' },
      { text: 'Friends', hint: 'Comedy' },
      { text: 'Witcher', hint: 'Fantasy' },
      { text: 'Money Heist', hint: 'Thriller' },
    ],
  },
  {
    id: 'anime',
    displayName: 'Anime',
    icon: '🌸',
    words: [
      { text: 'Naruto', hint: 'Shounen' },
      { text: 'One Piece', hint: 'Shounen' },
      { text: 'Death Note', hint: 'Thriller' },
      { text: 'Demon Slayer', hint: 'Shounen' },
      { text: 'Attack on Titan', hint: 'Action' },
    ],
  },
  {
    id: 'musik',
    displayName: 'Musik',
    icon: '🎵',
    words: [
      { text: 'Taylor Swift', hint: 'Pop' },
      { text: 'Travis Scott', hint: 'Hip Hop' },
      { text: 'Ed Sheeran', hint: 'Pop' },
      { text: 'Billie Eilish', hint: 'Pop' },
      { text: 'Drake', hint: 'Hip Hop' },
    ],
  },
  {
    id: 'promis',
    displayName: 'Promis',
    icon: '⭐',
    words: [
      { text: 'Elon Musk', hint: 'Tech' },
      { text: 'MrBeast', hint: 'YouTuber' },
      { text: 'Ronaldo', hint: 'Sportler' },
      { text: 'Kim Kardashian', hint: 'Reality' },
      { text: 'PewDiePie', hint: 'YouTuber' },
    ],
  },
  {
    id: 'internet',
    displayName: 'Internet',
    icon: '🌐',
    words: [
      { text: 'TikTok', hint: 'Social Media' },
      { text: 'Discord', hint: 'Chat' },
      { text: 'Reddit', hint: 'Forum' },
      { text: 'Wikipedia', hint: 'Information' },
      { text: 'Twitch', hint: 'Streaming' },
    ],
  },
  {
    id: 'technik',
    displayName: 'Technik',
    icon: '📱',
    words: [
      { text: 'Smartphone', hint: 'Alltag' },
      { text: 'Kopfhörer', hint: 'Alltag' },
      { text: 'Smartwatch', hint: 'Wearable' },
      { text: 'Laptop', hint: 'Arbeit' },
      { text: 'Powerbank', hint: 'Zubehör' },
    ],
  },
  {
    id: 'fahrzeuge',
    displayName: 'Fahrzeuge',
    icon: '🚗',
    words: [
      { text: 'Tesla', hint: 'Modern' },
      { text: 'Roller', hint: 'Zwei-Rad' },
      { text: 'Traktor', hint: 'Arbeit' },
      { text: 'Lieferwagen', hint: 'Arbeit' },
      { text: 'Hoverboard', hint: 'Modern' },
    ],
  },
  {
    id: 'reisen',
    displayName: 'Reisen',
    icon: '✈️',
    words: [
      { text: 'Tokio', hint: 'Asien' },
      { text: 'Paris', hint: 'Europa' },
      { text: 'Dubai', hint: 'Luxus' },
      { text: 'Bali', hint: 'Insel' },
      { text: 'New York', hint: 'Nordamerika' },
    ],
  },
  {
    id: 'natur',
    displayName: 'Natur',
    icon: '🌿',
    words: [
      { text: 'Wasserfall', hint: 'Wasser' },
      { text: 'Vulkan', hint: 'Gefährlich' },
      { text: 'Regenbogen', hint: 'Himmel' },
      { text: 'Schneesturm', hint: 'Gefährlich' },
      { text: 'Wüste', hint: 'Trocken' },
    ],
  },
  {
    id: 'fantasy',
    displayName: 'Fantasy',
    icon: '🐉',
    words: [
      { text: 'Drache', hint: 'Mythologisch' },
      { text: 'Einhorn', hint: 'Mythologisch' },
      { text: 'Zauberer', hint: 'Magisch' },
      { text: 'Elf', hint: 'Wesen' },
      { text: 'Phönix', hint: 'Mythologisch' },
    ],
  },
  {
    id: 'gegenstaende',
    displayName: 'Gegenstände',
    icon: '🎒',
    words: [
      { text: 'Schere', hint: 'Werkzeug' },
      { text: 'Klebeband', hint: 'Werkzeug' },
      { text: 'Lupe', hint: 'Werkzeug' },
      { text: 'Kerze', hint: 'Dekoration' },
      { text: 'Spiegel', hint: 'Dekoration' },
    ],
  },
  {
    id: 'aktivitaeten',
    displayName: 'Aktivitäten',
    icon: '🎯',
    words: [
      { text: 'Bouldern', hint: 'Sport' },
      { text: 'Zeltlager', hint: 'Draußen' },
      { text: 'Escape Room', hint: 'Drinnen' },
      { text: 'Picknick', hint: 'Draußen' },
      { text: 'Karaoke', hint: 'Drinnen' },
    ],
  },
  {
    id: 'meme',
    displayName: 'Meme / Internet',
    icon: '😂',
    words: [
      { text: 'Doge', hint: 'Tier-Meme' },
      { text: 'Rickroll', hint: 'Song-Meme' },
      { text: 'Pedro Pedro Pedro', hint: 'Tier-Meme' },
      { text: 'Skibidi Toilet', hint: 'Gen Z' },
      { text: 'Gigachad', hint: 'Mann-Meme' },
    ],
  },
  {
    id: 'luxus',
    displayName: 'Luxus',
    icon: '💎',
    words: [
      { text: 'Rolex', hint: 'Uhr' },
      { text: 'Ferrari', hint: 'Auto' },
      { text: 'Champagner', hint: 'Getränk' },
      { text: 'Yacht', hint: 'Wasser' },
      { text: 'Caviar', hint: 'Essen' },
    ],
  },
  {
    id: 'spicy',
    displayName: 'Spicy 👀',
    icon: '🔥',
    words: [
      { text: 'Trennung per SMS', hint: 'Cringe' },
      { text: 'Lachen im Sekretär-Unterricht', hint: 'Cringe' },
      { text: 'Ex per Swipe gefunden', hint: 'Cringe' },
      { text: 'Verschwendeter Schulsamstag', hint: 'Cringe' },
      { text: 'Vergessener Geburtstag', hint: 'Cringe' },
    ],
  },
  {
    id: 'freaky',
    displayName: 'Freaky 👀',
    icon: '👁️',
    words: [
      { text: 'Mit Geistern reden', hint: 'Übersinnlich' },
      { text: 'Träume, die wahr werden', hint: 'Übersinnlich' },
      { text: 'Deja-vu', hint: 'Übersinnlich' },
      { text: 'Schwarze Katze', hint: 'Aberglaube' },
      { text: 'Spiegel um Mitternacht', hint: 'Aberglaube' },
    ],
  },
]

/**
 * Get a category by ID. Throws if not found — the catalog is the source of truth.
 */
export function getCategoryById(id: string): Category {
  const cat = CATALOG.find(c => c.id === id)
  if (!cat) throw new Error(`Unknown category: ${id}`)
  return cat
}

/**
 * Get all categories except the one with the given ID.
 * Used by Jester word selection (§12: must come from a different category).
 */
export function getOtherCategories(currentId: string): Category[] {
  return CATALOG.filter(c => c.id !== currentId)
}
