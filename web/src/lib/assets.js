// Centralized, stable public paths for brand assets. Components import from
// here instead of hardcoding strings, so dropping a new file into
// public/images/... (same standardized name) makes it appear on the site
// with zero component changes.
const ILLUSTRATIONS_DIR = '/images/illustrations'

export const illustrations = {
  alienWave: `${ILLUSTRATIONS_DIR}/alien-wave.svg`,
  alienThinking: `${ILLUSTRATIONS_DIR}/alien-thinking.svg`,
  alienHello: `${ILLUSTRATIONS_DIR}/alien-hello.svg`,
  alienWorking: `${ILLUSTRATIONS_DIR}/alien-working.svg`,
  ufo: `${ILLUSTRATIONS_DIR}/ufo.svg`,
  ufoSmall: `${ILLUSTRATIONS_DIR}/ufo-small.svg`,
  satellite: `${ILLUSTRATIONS_DIR}/satellite.svg`,
  astronaut: `${ILLUSTRATIONS_DIR}/astronaut.svg`,
  planet: `${ILLUSTRATIONS_DIR}/planet.svg`,
  rocket: `${ILLUSTRATIONS_DIR}/rocket.svg`,
  spaceDoodle: `${ILLUSTRATIONS_DIR}/space-doodle.svg`,
}

export const logo = {
  mark: '/images/logo/andrho-mark.png',
}
