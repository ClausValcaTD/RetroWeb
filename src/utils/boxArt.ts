/**
 * Utility for parsing ROM titles and mapping system names to Libretro Thumbnails CDN URLs.
 */

/**
 * Clean ROM filenames by stripping extension, region tags (e.g. "(USA)"),
 * dump/revision flags (e.g. "[!]", "[b1]"), and extra whitespace.
 *
 * Example: "Sonic Advance (USA) [!].gba" -> "Sonic Advance"
 */
export function cleanRomTitle(filename: string): string {
  // Strip extension
  let title = filename.replace(/\.[^/.]+$/, '');

  // Strip parenthetical region tags, dump brackets, and extra details recursively or iteratively
  title = title.replace(/\s*\([^)]*\)/g, ''); // Removes (USA), (En,Fr,De), etc.
  title = title.replace(/\s*\[[^\]]*\]/g, ''); // Removes [!], [b1], etc.

  // Normalize whitespace
  title = title.trim().replace(/\s+/g, ' ');

  return title;
}

/**
 * Maps RetroWeb core ID to Libretro Thumbnails system directory name.
 */
export function getSystemNameForCore(coreId: string): string {
  switch (coreId.toLowerCase()) {
    case 'mgba':
      return 'Nintendo - Game Boy Advance';
    case 'uzem':
      return 'Uzebox';
    case 'quasi88':
      return 'NEC - PC-8001 - PC-8801';
    default:
      return 'Uzebox';
  }
}

/**
 * Constructs CDN URL for Libretro box art thumbnail.
 * Format: https://thumbnails.libretro.com/${systemName}/Named_Boxarts/${encodeURIComponent(cleanTitle)}.png
 */
export function getBoxArtUrl(filenameOrTitle: string, coreId: string): string {
  const cleanTitle = cleanRomTitle(filenameOrTitle);
  const systemName = getSystemNameForCore(coreId);
  return `https://thumbnails.libretro.com/${systemName}/Named_Boxarts/${encodeURIComponent(cleanTitle)}.png`;
}

/**
 * Deterministic gradient background based on string for stylish poster fallback card.
 */
export function getFallbackGradient(title: string): string {
  const gradients = [
    'from-indigo-900 via-purple-900 to-slate-900',
    'from-cyan-900 via-teal-900 to-slate-900',
    'from-rose-900 via-red-900 to-zinc-900',
    'from-amber-900 via-orange-900 to-zinc-900',
    'from-emerald-900 via-teal-900 to-zinc-900',
    'from-blue-900 via-indigo-900 to-zinc-900',
    'from-fuchsia-900 via-pink-900 to-zinc-900',
  ];

  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}
