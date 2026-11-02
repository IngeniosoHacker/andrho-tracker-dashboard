// Text analysis for SEO suggestions: turns the page text the tracker already
// stores (pageviews.content_text, titles, h1) into candidate key phrases per
// page (TF-IDF over 1-3 word n-grams, Spanish + English stopwords), and
// measures how well a keyword matches a page. No network, no dependencies.
'use strict';

const STOPWORDS = new Set((
  // es
  'a al algo algunas algunos ante antes aquel aquella aqui así asi aun aunque bajo bien cada casi como con contra cual cuales cuando cuanto de del desde donde dos el ella ellas ellos en entre era eran es esa esas ese eso esos esta estas este esto estos estar fue fueron ha han hasta hay la las le les lo los mas más me mi mis mucho muy nada ni no nos nosotros nuestra nuestro nuestras nuestros o otra otro otras otros para pero poco por porque que qué quien quienes se sea según segun ser si sí sin sino sobre solo sólo son su sus tal también tambien tan tanto te tener tiene tienen todo todos toda todas tu tus un una unas uno unos usted ustedes y ya yo él puede pueden hace hacer cómo cuál dónde está están sea vez veces aquí allí hoy ahora así cual ' +
  // en
  'the a an and or of to in on for with is are was were be been by at as it its this that these those from your you we our us not no can will more most about into than then them they their there here what which who how all any'
).split(/\s+/));

// Lower-case, accents kept (they matter in Spanish search), punctuation out.
function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^-+|-+$/g, ''))
    .filter((t) => t.length > 1 && !/^\d+$/.test(t));
}

// Accent-folded form, for matching only ("autenticación" ~ "autenticacion").
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

// 1-3 word n-grams that neither start nor end with a stopword.
function ngrams(tokens, maxN = 3) {
  const out = [];
  for (let n = 1; n <= maxN; n++) {
    for (let i = 0; i + n <= tokens.length; i++) {
      const g = tokens.slice(i, i + n);
      if (STOPWORDS.has(g[0]) || STOPWORDS.has(g[n - 1])) continue;
      if (n === 1 && g[0].length < 4) continue;
      out.push(g.join(' '));
    }
  }
  return out;
}

/**
 * pages: [{ path, title, h1, text }]. Returns per-page top phrases with
 * TF-IDF scores and a site-wide ranking. Titles and h1 count triple, since
 * that's what the page says it's about.
 */
function keyPhrases(pages, perPage = 12) {
  const docs = pages.map((p) => {
    const head = `${p.title || ''} . ${p.h1 || ''}`;
    const grams = [...ngrams(tokenize(head)), ...ngrams(tokenize(head)), ...ngrams(tokenize(head)), ...ngrams(tokenize(p.text))];
    const tf = new Map();
    grams.forEach((g) => tf.set(g, (tf.get(g) || 0) + 1));
    return { path: p.path, tf, total: grams.length || 1 };
  });
  const df = new Map();
  docs.forEach((d) => d.tf.forEach((_, g) => df.set(g, (df.get(g) || 0) + 1)));
  const N = docs.length;

  const site = new Map();
  const byPage = docs.map((d) => {
    const scored = [];
    d.tf.forEach((count, g) => {
      if (count < 2) return; // once is noise
      const words = g.split(' ').length;
      // Longer phrases are rarer and more specific: favor them a bit.
      const s = (count / d.total) * Math.log(1 + N / df.get(g)) * (1 + 0.35 * (words - 1));
      scored.push({ phrase: g, score: s, count });
    });
    scored.sort((a, b) => b.score - a.score);
    const top = dropContained(scored).slice(0, perPage);
    top.forEach((t) => site.set(t.phrase, (site.get(t.phrase) || 0) + t.score));
    return { path: d.path, phrases: top };
  });
  const siteTop = [...site.entries()].sort((a, b) => b[1] - a[1]).map(([phrase, score]) => ({ phrase, score }));
  return { byPage, site: siteTop };
}

// "software restaurantes" makes "restaurantes" redundant when it scores close.
function dropContained(sorted) {
  const kept = [];
  for (const s of sorted) {
    const dup = kept.find((k) => (k.phrase.includes(s.phrase) || s.phrase.includes(k.phrase)) && k.score >= s.score * 0.6);
    if (!dup) kept.push(s);
  }
  return kept;
}

// Share of the keyword's content words present in `text` (accent-folded).
function coverage(keyword, text) {
  const words = tokenize(keyword).filter((w) => !STOPWORDS.has(w)).map(fold);
  if (!words.length) return 0;
  const hay = new Set(tokenize(text).map(fold));
  return words.filter((w) => hay.has(w) || hay.has(w.replace(/s$/, '')) || hay.has(w + 's')).length / words.length;
}

// Does `text` contain the keyword as a phrase (accent-folded)?
function containsPhrase(keyword, text) {
  const k = fold(tokenize(keyword).join(' '));
  return Boolean(k) && fold(tokenize(text).join(' ')).includes(k);
}

module.exports = { tokenize, ngrams, keyPhrases, coverage, containsPhrase, fold, STOPWORDS };
