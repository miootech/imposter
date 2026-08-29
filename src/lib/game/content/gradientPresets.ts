/**
 * Gradient Presets for Timer Background
 * --------------------------------------
 * Each preset defines a color pair for the animated gradient.
 * Users can pick one in Settings, or 'none' to disable.
 */

export interface GradientPreset {
  id: string
  name: string
  colors: [string, string]
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { id: 'none', name: 'Aus', colors: ['transparent', 'transparent'] },
  { id: 'sunset', name: 'Sunset', colors: ['#E07A5F', '#F4A261'] },
  { id: 'ocean', name: 'Ocean', colors: ['#457B9D', '#2A9D8F'] },
  { id: 'candy', name: 'Candy', colors: ['#9B5DE5', '#F15BB5'] },
  { id: 'forest', name: 'Forest', colors: ['#81B29A', '#2A9D8F'] },
  { id: 'fire', name: 'Fire', colors: ['#E63946', '#F77F00'] },
  { id: 'lavender', name: 'Lavender', colors: ['#B8C0EC', '#9B5DE5'] },
  { id: 'mint', name: 'Mint', colors: ['#A8DADC', '#81B29A'] },
  { id: 'neon', name: 'Neon', colors: ['#00BBF9', '#9B5DE5'] },
  { id: 'galaxy', name: 'Galaxy', colors: ['#2D1B69', '#E94560'] },
  { id: 'random', name: 'Zufall', colors: ['#RANDOM', '#RANDOM'] },
]

export function getPresetColors(presetId: string, round: number): [string, string] {
  const preset = GRADIENT_PRESETS.find(p => p.id === presetId)
  if (!preset || preset.id === 'none') return ['transparent', 'transparent']
  if (preset.id === 'random') {
    const palettes: [string, string][] = [
      ['#E07A5F', '#457B9D'], ['#81B29A', '#F2CC8F'], ['#9B5DE5', '#F15BB5'],
      ['#00BBF9', '#2A9D8F'], ['#F4A261', '#E76F51'], ['#A8DADC', '#B8C0EC'],
      ['#FFB4A2', '#E5989B'], ['#06AED5', '#086788'],
    ]
    return palettes[round % palettes.length]
  }
  return preset.colors
}
