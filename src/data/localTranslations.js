const LOCAL_TRANSLATIONS = {
  'en.sahih': {
    path: '/data/en.sahih.txt',
    label: 'Saheeh International'
  },
  'ur.junagarhi': {
    path: '/data/ur.junagarhi.txt',
    label: 'Ahmed Ali (Junagarhi)'
  }
};

const translationDatasetCache = new Map();
const translationDatasetPromises = new Map();

const isValidEntry = (surah, ayah, text) => {
  return Number.isInteger(surah) && surah > 0 && Number.isInteger(ayah) && ayah > 0 && text.length > 0;
};

const parseTranslationFile = (raw = '') => {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const bySurah = new Map();

  for (const line of lines) {
    const [surahToken, ayahToken, ...textParts] = line.split('|');
    const surahNumber = Number.parseInt((surahToken || '').trim(), 10);
    const ayahNumber = Number.parseInt((ayahToken || '').trim(), 10);
    const text = textParts.join('|').trim();

    if (!isValidEntry(surahNumber, ayahNumber, text)) {
      continue;
    }

    if (!bySurah.has(surahNumber)) {
      bySurah.set(surahNumber, {});
    }

    const entries = bySurah.get(surahNumber);
    entries[ayahNumber] = text;
  }

  return Object.fromEntries(bySurah.entries());
};

const fetchTranslationDataset = async (edition) => {
  if (typeof fetch !== 'function') {
    return null;
  }

  if (!LOCAL_TRANSLATIONS[edition]) {
    return null;
  }

  if (translationDatasetCache.has(edition)) {
    return translationDatasetCache.get(edition);
  }

  if (!translationDatasetPromises.has(edition)) {
    const { path } = LOCAL_TRANSLATIONS[edition];

    translationDatasetPromises.set(
      edition,
      fetch(path)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load local translation asset: ${response.status}`);
          }
          return response.text();
        })
        .then((raw) => {
          const dataset = parseTranslationFile(raw);
          translationDatasetCache.set(edition, dataset);
          return dataset;
        })
        .finally(() => {
          translationDatasetPromises.delete(edition);
        })
    );
  }

  return translationDatasetPromises.get(edition);
};

export const hasLocalTranslation = (edition) => Boolean(LOCAL_TRANSLATIONS[edition]);

export const getLocalTranslationLabel = (edition) => LOCAL_TRANSLATIONS[edition]?.label || '';

export const loadLocalTranslationForSurah = async (edition, surahNumber) => {
  const dataset = await fetchTranslationDataset(edition);
  if (!dataset) {
    return null;
  }

  const entries = dataset[surahNumber];
  if (!entries) {
    return null;
  }

  return { entries: { ...entries } };
};
