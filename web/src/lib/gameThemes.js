// Color themes for the asteroid mini-game (see AsteroidGame.jsx). This list
// IS the experiment: each theme is a genuinely different UI treatment
// (hue, brightness, light-vs-dark, monochrome-vs-multicolor), not a cosmetic
// reskin, so per-theme game results are meaningful input for the ANOVA
// analysis in analysis/anova.py.
export const GAME_THEMES = [
  {
    id: 'nebula',
    label: 'Nébula',
    isLight: false,
    background: '#0b0a1a',
    panel: '#14112a',
    border: 'rgba(245, 242, 255, 0.16)',
    text: '#f5f2ff',
    mist: '#9a93c2',
    ship: '#FFC745',
    bullet: '#6EE7FF',
    meteor: '#FF2162',
    line: 'rgba(255, 33, 98, 0.55)',
  },
  {
    id: 'solar-flare',
    label: 'Llamarada solar',
    isLight: false,
    background: '#1a0f05',
    panel: '#241708',
    border: 'rgba(255, 210, 130, 0.2)',
    text: '#FFEFD6',
    mist: '#C9A06B',
    ship: '#FFD23F',
    bullet: '#FF8A3D',
    meteor: '#FF4D4D',
    line: 'rgba(255, 77, 77, 0.55)',
  },
  {
    id: 'deep-ocean',
    label: 'Océano profundo',
    isLight: false,
    background: '#051520',
    panel: '#082230',
    border: 'rgba(79, 168, 255, 0.2)',
    text: '#E4FBFF',
    mist: '#5C93A8',
    ship: '#4FA8FF',
    bullet: '#2FE6C8',
    meteor: '#FF6B6B',
    line: 'rgba(255, 107, 107, 0.55)',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    isLight: false,
    background: '#071612',
    panel: '#0d221b',
    border: 'rgba(61, 255, 176, 0.2)',
    text: '#E6FFF4',
    mist: '#6FA98F',
    ship: '#3DFFB0',
    bullet: '#B98BFF',
    meteor: '#FF6EC7',
    line: 'rgba(255, 110, 199, 0.55)',
  },
  {
    id: 'light-frost',
    label: 'Escarcha',
    isLight: true,
    background: '#F4F6FB',
    panel: '#FFFFFF',
    border: 'rgba(24, 26, 46, 0.14)',
    text: '#181A2E',
    mist: '#5B5F7A',
    ship: '#3654FF',
    bullet: '#00B8A9',
    meteor: '#FF3D6E',
    line: 'rgba(255, 61, 110, 0.5)',
  },
  {
    id: 'mono-terminal',
    label: 'Terminal',
    isLight: false,
    background: '#000000',
    panel: '#050505',
    border: 'rgba(57, 255, 20, 0.3)',
    text: '#39FF14',
    mist: '#1E8F0C',
    ship: '#39FF14',
    bullet: '#39FF14',
    meteor: '#39FF14',
    line: 'rgba(57, 255, 20, 0.45)',
  },
]

// Returns the 6 themes reordered to start at `startIndex`, so the player's
// chosen theme plays first while every theme still gets equal rotation time
// over the course of one session.
export function rotationFrom(startIndex) {
  return [...GAME_THEMES.slice(startIndex), ...GAME_THEMES.slice(0, startIndex)]
}
