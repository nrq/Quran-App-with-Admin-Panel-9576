// Offline Quran data parsed from quran-uthmani.xml
// This provides complete offline access to all Quran verses

// Surah information with English names and metadata
export const surahsInfo = [
  { id: 1, name_simple: "Al-Fatihah", name_arabic: "الفاتحة", translated_name: { name: "The Opening" }, revelation_place: "makkah", verses_count: 7 },
  { id: 2, name_simple: "Al-Baqarah", name_arabic: "البقرة", translated_name: { name: "The Cow" }, revelation_place: "madinah", verses_count: 286 },
  { id: 3, name_simple: "Ali 'Imran", name_arabic: "آل عمران", translated_name: { name: "Family of Imran" }, revelation_place: "madinah", verses_count: 200 },
  { id: 4, name_simple: "An-Nisa", name_arabic: "النساء", translated_name: { name: "The Women" }, revelation_place: "madinah", verses_count: 176 },
  { id: 5, name_simple: "Al-Ma'idah", name_arabic: "المائدة", translated_name: { name: "The Table Spread" }, revelation_place: "madinah", verses_count: 120 },
  { id: 6, name_simple: "Al-An'am", name_arabic: "الأنعام", translated_name: { name: "The Cattle" }, revelation_place: "makkah", verses_count: 165 },
  { id: 7, name_simple: "Al-A'raf", name_arabic: "الأعراف", translated_name: { name: "The Heights" }, revelation_place: "makkah", verses_count: 206 },
  { id: 8, name_simple: "Al-Anfal", name_arabic: "الأنفال", translated_name: { name: "The Spoils of War" }, revelation_place: "madinah", verses_count: 75 },
  { id: 9, name_simple: "At-Tawbah", name_arabic: "التوبة", translated_name: { name: "The Repentance" }, revelation_place: "madinah", verses_count: 129 },
  { id: 10, name_simple: "Yunus", name_arabic: "يونس", translated_name: { name: "Jonah" }, revelation_place: "makkah", verses_count: 109 },
  { id: 11, name_simple: "Hud", name_arabic: "هود", translated_name: { name: "Hud" }, revelation_place: "makkah", verses_count: 123 },
  { id: 12, name_simple: "Yusuf", name_arabic: "يوسف", translated_name: { name: "Joseph" }, revelation_place: "makkah", verses_count: 111 },
  { id: 13, name_simple: "Ar-Ra'd", name_arabic: "الرعد", translated_name: { name: "The Thunder" }, revelation_place: "madinah", verses_count: 43 },
  { id: 14, name_simple: "Ibrahim", name_arabic: "ابراهيم", translated_name: { name: "Abraham" }, revelation_place: "makkah", verses_count: 52 },
  { id: 15, name_simple: "Al-Hijr", name_arabic: "الحجر", translated_name: { name: "The Rocky Tract" }, revelation_place: "makkah", verses_count: 99 },
  { id: 16, name_simple: "An-Nahl", name_arabic: "النحل", translated_name: { name: "The Bee" }, revelation_place: "makkah", verses_count: 128 },
  { id: 17, name_simple: "Al-Isra", name_arabic: "الإسراء", translated_name: { name: "The Night Journey" }, revelation_place: "makkah", verses_count: 111 },
  { id: 18, name_simple: "Al-Kahf", name_arabic: "الكهف", translated_name: { name: "The Cave" }, revelation_place: "makkah", verses_count: 110 },
  { id: 19, name_simple: "Maryam", name_arabic: "مريم", translated_name: { name: "Mary" }, revelation_place: "makkah", verses_count: 98 },
  { id: 20, name_simple: "Taha", name_arabic: "طه", translated_name: { name: "Ta-Ha" }, revelation_place: "makkah", verses_count: 135 },
  { id: 21, name_simple: "Al-Anbya", name_arabic: "الأنبياء", translated_name: { name: "The Prophets" }, revelation_place: "makkah", verses_count: 112 },
  { id: 22, name_simple: "Al-Hajj", name_arabic: "الحج", translated_name: { name: "The Pilgrimage" }, revelation_place: "madinah", verses_count: 78 },
  { id: 23, name_simple: "Al-Mu'minun", name_arabic: "المؤمنون", translated_name: { name: "The Believers" }, revelation_place: "makkah", verses_count: 118 },
  { id: 24, name_simple: "An-Nur", name_arabic: "النور", translated_name: { name: "The Light" }, revelation_place: "madinah", verses_count: 64 },
  { id: 25, name_simple: "Al-Furqan", name_arabic: "الفرقان", translated_name: { name: "The Criterion" }, revelation_place: "makkah", verses_count: 77 },
  { id: 26, name_simple: "Ash-Shu'ara", name_arabic: "الشعراء", translated_name: { name: "The Poets" }, revelation_place: "makkah", verses_count: 227 },
  { id: 27, name_simple: "An-Naml", name_arabic: "النمل", translated_name: { name: "The Ant" }, revelation_place: "makkah", verses_count: 93 },
  { id: 28, name_simple: "Al-Qasas", name_arabic: "القصص", translated_name: { name: "The Stories" }, revelation_place: "makkah", verses_count: 88 },
  { id: 29, name_simple: "Al-'Ankabut", name_arabic: "العنكبوت", translated_name: { name: "The Spider" }, revelation_place: "makkah", verses_count: 69 },
  { id: 30, name_simple: "Ar-Rum", name_arabic: "الروم", translated_name: { name: "The Romans" }, revelation_place: "makkah", verses_count: 60 },
  { id: 31, name_simple: "Luqman", name_arabic: "لقمان", translated_name: { name: "Luqman" }, revelation_place: "makkah", verses_count: 34 },
  { id: 32, name_simple: "As-Sajdah", name_arabic: "السجدة", translated_name: { name: "The Prostration" }, revelation_place: "makkah", verses_count: 30 },
  { id: 33, name_simple: "Al-Ahzab", name_arabic: "الأحزاب", translated_name: { name: "The Clans" }, revelation_place: "madinah", verses_count: 73 },
  { id: 34, name_simple: "Saba", name_arabic: "سبأ", translated_name: { name: "Sheba" }, revelation_place: "makkah", verses_count: 54 },
  { id: 35, name_simple: "Fatir", name_arabic: "فاطر", translated_name: { name: "Originator" }, revelation_place: "makkah", verses_count: 45 },
  { id: 36, name_simple: "Ya-Sin", name_arabic: "يس", translated_name: { name: "Ya Sin" }, revelation_place: "makkah", verses_count: 83 },
  { id: 37, name_simple: "As-Saffat", name_arabic: "الصافات", translated_name: { name: "Those who set the Ranks" }, revelation_place: "makkah", verses_count: 182 },
  { id: 38, name_simple: "Sad", name_arabic: "ص", translated_name: { name: "The Letter \"Saad\"" }, revelation_place: "makkah", verses_count: 88 },
  { id: 39, name_simple: "Az-Zumar", name_arabic: "الزمر", translated_name: { name: "The Troops" }, revelation_place: "makkah", verses_count: 75 },
  { id: 40, name_simple: "Ghafir", name_arabic: "غافر", translated_name: { name: "The Forgiver" }, revelation_place: "makkah", verses_count: 85 },
  { id: 41, name_simple: "Fussilat", name_arabic: "فصلت", translated_name: { name: "Explained in Detail" }, revelation_place: "makkah", verses_count: 54 },
  { id: 42, name_simple: "Ash-Shuraa", name_arabic: "الشورى", translated_name: { name: "The Consultation" }, revelation_place: "makkah", verses_count: 53 },
  { id: 43, name_simple: "Az-Zukhruf", name_arabic: "الزخرف", translated_name: { name: "The Ornaments of Gold" }, revelation_place: "makkah", verses_count: 89 },
  { id: 44, name_simple: "Ad-Dukhan", name_arabic: "الدخان", translated_name: { name: "The Smoke" }, revelation_place: "makkah", verses_count: 59 },
  { id: 45, name_simple: "Al-Jathiyah", name_arabic: "الجاثية", translated_name: { name: "The Crouching" }, revelation_place: "makkah", verses_count: 37 },
  { id: 46, name_simple: "Al-Ahqaf", name_arabic: "الأحقاف", translated_name: { name: "The Wind-Curved Sandhills" }, revelation_place: "makkah", verses_count: 35 },
  { id: 47, name_simple: "Muhammad", name_arabic: "محمد", translated_name: { name: "Muhammad" }, revelation_place: "madinah", verses_count: 38 },
  { id: 48, name_simple: "Al-Fath", name_arabic: "الفتح", translated_name: { name: "The Victory" }, revelation_place: "madinah", verses_count: 29 },
  { id: 49, name_simple: "Al-Hujurat", name_arabic: "الحجرات", translated_name: { name: "The Rooms" }, revelation_place: "madinah", verses_count: 18 },
  { id: 50, name_simple: "Qaf", name_arabic: "ق", translated_name: { name: "The Letter \"Qaf\"" }, revelation_place: "makkah", verses_count: 45 },
  { id: 51, name_simple: "Adh-Dhariyat", name_arabic: "الذاريات", translated_name: { name: "The Winnowing Winds" }, revelation_place: "makkah", verses_count: 60 },
  { id: 52, name_simple: "At-Tur", name_arabic: "الطور", translated_name: { name: "The Mount" }, revelation_place: "makkah", verses_count: 49 },
  { id: 53, name_simple: "An-Najm", name_arabic: "النجم", translated_name: { name: "The Star" }, revelation_place: "makkah", verses_count: 62 },
  { id: 54, name_simple: "Al-Qamar", name_arabic: "القمر", translated_name: { name: "The Moon" }, revelation_place: "makkah", verses_count: 55 },
  { id: 55, name_simple: "Ar-Rahman", name_arabic: "الرحمن", translated_name: { name: "The Beneficent" }, revelation_place: "madinah", verses_count: 78 },
  { id: 56, name_simple: "Al-Waqi'ah", name_arabic: "الواقعة", translated_name: { name: "The Inevitable" }, revelation_place: "makkah", verses_count: 96 },
  { id: 57, name_simple: "Al-Hadid", name_arabic: "الحديد", translated_name: { name: "The Iron" }, revelation_place: "madinah", verses_count: 29 },
  { id: 58, name_simple: "Al-Mujadila", name_arabic: "المجادلة", translated_name: { name: "The Pleading Woman" }, revelation_place: "madinah", verses_count: 22 },
  { id: 59, name_simple: "Al-Hashr", name_arabic: "الحشر", translated_name: { name: "The Exile" }, revelation_place: "madinah", verses_count: 24 },
  { id: 60, name_simple: "Al-Mumtahanah", name_arabic: "الممتحنة", translated_name: { name: "She that is to be examined" }, revelation_place: "madinah", verses_count: 13 },
  { id: 61, name_simple: "As-Saf", name_arabic: "الصف", translated_name: { name: "The Ranks" }, revelation_place: "madinah", verses_count: 14 },
  { id: 62, name_simple: "Al-Jumu'ah", name_arabic: "الجمعة", translated_name: { name: "The Congregation, Friday" }, revelation_place: "madinah", verses_count: 11 },
  { id: 63, name_simple: "Al-Munafiqun", name_arabic: "المنافقون", translated_name: { name: "The Hypocrites" }, revelation_place: "madinah", verses_count: 11 },
  { id: 64, name_simple: "At-Taghabun", name_arabic: "التغابن", translated_name: { name: "The Mutual Disillusion" }, revelation_place: "madinah", verses_count: 18 },
  { id: 65, name_simple: "At-Talaq", name_arabic: "الطلاق", translated_name: { name: "The Divorce" }, revelation_place: "madinah", verses_count: 12 },
  { id: 66, name_simple: "At-Tahrim", name_arabic: "التحريم", translated_name: { name: "The Prohibition" }, revelation_place: "madinah", verses_count: 12 },
  { id: 67, name_simple: "Al-Mulk", name_arabic: "الملك", translated_name: { name: "The Sovereignty" }, revelation_place: "makkah", verses_count: 30 },
  { id: 68, name_simple: "Al-Qalam", name_arabic: "القلم", translated_name: { name: "The Pen" }, revelation_place: "makkah", verses_count: 52 },
  { id: 69, name_simple: "Al-Haqqah", name_arabic: "الحاقة", translated_name: { name: "The Reality" }, revelation_place: "makkah", verses_count: 52 },
  { id: 70, name_simple: "Al-Ma'arij", name_arabic: "المعارج", translated_name: { name: "The Ascending Stairways" }, revelation_place: "makkah", verses_count: 44 },
  { id: 71, name_simple: "Nuh", name_arabic: "نوح", translated_name: { name: "Noah" }, revelation_place: "makkah", verses_count: 28 },
  { id: 72, name_simple: "Al-Jinn", name_arabic: "الجن", translated_name: { name: "The Jinn" }, revelation_place: "makkah", verses_count: 28 },
  { id: 73, name_simple: "Al-Muzzammil", name_arabic: "المزمل", translated_name: { name: "The Enshrouded One" }, revelation_place: "makkah", verses_count: 20 },
  { id: 74, name_simple: "Al-Muddaththir", name_arabic: "المدثر", translated_name: { name: "The Cloaked One" }, revelation_place: "makkah", verses_count: 56 },
  { id: 75, name_simple: "Al-Qiyamah", name_arabic: "القيامة", translated_name: { name: "The Resurrection" }, revelation_place: "makkah", verses_count: 40 },
  { id: 76, name_simple: "Al-Insan", name_arabic: "الإنسان", translated_name: { name: "The Man" }, revelation_place: "madinah", verses_count: 31 },
  { id: 77, name_simple: "Al-Mursalat", name_arabic: "المرسلات", translated_name: { name: "The Emissaries" }, revelation_place: "makkah", verses_count: 50 },
  { id: 78, name_simple: "An-Naba", name_arabic: "النبأ", translated_name: { name: "The Tidings" }, revelation_place: "makkah", verses_count: 40 },
  { id: 79, name_simple: "An-Nazi'at", name_arabic: "النازعات", translated_name: { name: "Those who drag forth" }, revelation_place: "makkah", verses_count: 46 },
  { id: 80, name_simple: "'Abasa", name_arabic: "عبس", translated_name: { name: "He Frowned" }, revelation_place: "makkah", verses_count: 42 },
  { id: 81, name_simple: "At-Takwir", name_arabic: "التكوير", translated_name: { name: "The Overthrowing" }, revelation_place: "makkah", verses_count: 29 },
  { id: 82, name_simple: "Al-Infitar", name_arabic: "الإنفطار", translated_name: { name: "The Cleaving" }, revelation_place: "makkah", verses_count: 19 },
  { id: 83, name_simple: "Al-Mutaffifin", name_arabic: "المطففين", translated_name: { name: "The Defrauding" }, revelation_place: "makkah", verses_count: 36 },
  { id: 84, name_simple: "Al-Inshiqaq", name_arabic: "الإنشقاق", translated_name: { name: "The Splitting Open" }, revelation_place: "makkah", verses_count: 25 },
  { id: 85, name_simple: "Al-Buruj", name_arabic: "البروج", translated_name: { name: "The Mansions of the Stars" }, revelation_place: "makkah", verses_count: 22 },
  { id: 86, name_simple: "At-Tariq", name_arabic: "الطارق", translated_name: { name: "The Morning Star" }, revelation_place: "makkah", verses_count: 17 },
  { id: 87, name_simple: "Al-A'la", name_arabic: "الأعلى", translated_name: { name: "The Most High" }, revelation_place: "makkah", verses_count: 19 },
  { id: 88, name_simple: "Al-Ghashiyah", name_arabic: "الغاشية", translated_name: { name: "The Overwhelming" }, revelation_place: "makkah", verses_count: 26 },
  { id: 89, name_simple: "Al-Fajr", name_arabic: "الفجر", translated_name: { name: "The Dawn" }, revelation_place: "makkah", verses_count: 30 },
  { id: 90, name_simple: "Al-Balad", name_arabic: "البلد", translated_name: { name: "The City" }, revelation_place: "makkah", verses_count: 20 },
  { id: 91, name_simple: "Ash-Shams", name_arabic: "الشمس", translated_name: { name: "The Sun" }, revelation_place: "makkah", verses_count: 15 },
  { id: 92, name_simple: "Al-Layl", name_arabic: "الليل", translated_name: { name: "The Night" }, revelation_place: "makkah", verses_count: 21 },
  { id: 93, name_simple: "Ad-Duhaa", name_arabic: "الضحى", translated_name: { name: "The Morning Hours" }, revelation_place: "makkah", verses_count: 11 },
  { id: 94, name_simple: "Ash-Sharh", name_arabic: "الشرح", translated_name: { name: "The Relief" }, revelation_place: "makkah", verses_count: 8 },
  { id: 95, name_simple: "At-Tin", name_arabic: "التين", translated_name: { name: "The Fig" }, revelation_place: "makkah", verses_count: 8 },
  { id: 96, name_simple: "Al-'Alaq", name_arabic: "العلق", translated_name: { name: "The Clot" }, revelation_place: "makkah", verses_count: 19 },
  { id: 97, name_simple: "Al-Qadr", name_arabic: "القدر", translated_name: { name: "The Power, Fate" }, revelation_place: "makkah", verses_count: 5 },
  { id: 98, name_simple: "Al-Bayyinah", name_arabic: "البينة", translated_name: { name: "The Evidence" }, revelation_place: "madinah", verses_count: 8 },
  { id: 99, name_simple: "Az-Zalzalah", name_arabic: "الزلزلة", translated_name: { name: "The Earthquake" }, revelation_place: "madinah", verses_count: 8 },
  { id: 100, name_simple: "Al-'Adiyat", name_arabic: "العاديات", translated_name: { name: "The Courser" }, revelation_place: "makkah", verses_count: 11 },
  { id: 101, name_simple: "Al-Qari'ah", name_arabic: "القارعة", translated_name: { name: "The Calamity" }, revelation_place: "makkah", verses_count: 11 },
  { id: 102, name_simple: "At-Takathur", name_arabic: "التكاثر", translated_name: { name: "The Rivalry in world increase" }, revelation_place: "makkah", verses_count: 8 },
  { id: 103, name_simple: "Al-'Asr", name_arabic: "العصر", translated_name: { name: "The Declining Day, Epoch" }, revelation_place: "makkah", verses_count: 3 },
  { id: 104, name_simple: "Al-Humazah", name_arabic: "الهمزة", translated_name: { name: "The Traducer" }, revelation_place: "makkah", verses_count: 9 },
  { id: 105, name_simple: "Al-Fil", name_arabic: "الفيل", translated_name: { name: "The Elephant" }, revelation_place: "makkah", verses_count: 5 },
  { id: 106, name_simple: "Quraysh", name_arabic: "قريش", translated_name: { name: "Quraysh" }, revelation_place: "makkah", verses_count: 4 },
  { id: 107, name_simple: "Al-Ma'un", name_arabic: "الماعون", translated_name: { name: "The Small kindnesses" }, revelation_place: "makkah", verses_count: 7 },
  { id: 108, name_simple: "Al-Kawthar", name_arabic: "الكوثر", translated_name: { name: "The Abundance" }, revelation_place: "makkah", verses_count: 3 },
  { id: 109, name_simple: "Al-Kafirun", name_arabic: "الكافرون", translated_name: { name: "The Disbelievers" }, revelation_place: "makkah", verses_count: 6 },
  { id: 110, name_simple: "An-Nasr", name_arabic: "النصر", translated_name: { name: "The Divine Support" }, revelation_place: "madinah", verses_count: 3 },
  { id: 111, name_simple: "Al-Masad", name_arabic: "المسد", translated_name: { name: "The Palm Fibre" }, revelation_place: "makkah", verses_count: 5 },
  { id: 112, name_simple: "Al-Ikhlas", name_arabic: "الإخلاص", translated_name: { name: "The Sincerity" }, revelation_place: "makkah", verses_count: 4 },
  { id: 113, name_simple: "Al-Falaq", name_arabic: "الفلق", translated_name: { name: "The Daybreak" }, revelation_place: "makkah", verses_count: 5 },
  { id: 114, name_simple: "An-Nas", name_arabic: "الناس", translated_name: { name: "Mankind" }, revelation_place: "makkah", verses_count: 6 }
];

// Helper function to get all surahs info
export const getAllSurahsInfo = () => {
  return surahsInfo;
};

// Helper function to get surah info by ID
export const getSurahInfo = (surahNumber) => {
  return surahsInfo.find(surah => surah.id === parseInt(surahNumber));
};

// Import the pre-parsed Quran verses data
// Note: We'll load this dynamically to avoid large bundle size

// Cache for loaded Quran data
let quranVersesData = null;

// Helper function to load Quran data
const loadQuranData = async () => {
  if (!quranVersesData) {
    try {
      const response = await fetch('/data/quran-verses.json');
      quranVersesData = await response.json();
    } catch (error) {
      console.error('Error loading Quran data:', error);
      return null;
    }
  }
  return quranVersesData;
};

// Helper function to get verses for a specific surah (now offline)
export const getSurahVerses = async (surahNumber) => {
  const data = await loadQuranData();
  if (!data) return [];
  
  const surah = data[parseInt(surahNumber)];
  if (!surah) return [];
  
  // Return verses in the expected format
  return surah.verses.map(verse => ({
    ...verse,
    // Add any additional formatting if needed
    translations: verse.translations || []
  }));
};

// Helper function to get all Quran data
export const getAllQuranData = async () => {
  return await loadQuranData();
};

// Helper function to get total verses count
export const getTotalVersesCount = async () => {
  const data = await loadQuranData();
  if (!data) return 0;
  return Object.values(data).reduce((total, surah) => total + surah.verses.length, 0);
};