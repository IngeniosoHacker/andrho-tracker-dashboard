// Alternative landing look, opened with ?v=glass: white navbar, and the
// section windows lose their frames — their content sits straight on one
// frosted-glass backdrop that covers the stage (Stage.jsx). Everything from
// the Creators timeline on is the same in both versions.
export const GLASS = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('v') === 'glass'
