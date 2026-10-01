// Landing look. Glass is the default: white navbar, and the section windows
// lose their frames — their content sits straight on one clear frosted-glass
// backdrop that covers the stage (Stage.jsx). ?v=ventanas brings back the
// framed windows (the version live on the production repo, andrho).
// Everything from the Creators timeline on is the same in both.
export const GLASS = typeof window === 'undefined' || new URLSearchParams(window.location.search).get('v') !== 'ventanas'
