import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Firestore Indexes Configuration', () => {
  let indexesConfig;

  it('should have valid firestore.indexes.json file', () => {
    const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
    expect(fs.existsSync(indexesPath)).toBe(true);
    
    const indexesContent = fs.readFileSync(indexesPath, 'utf8');
    expect(() => JSON.parse(indexesContent)).not.toThrow();
    
    indexesConfig = JSON.parse(indexesContent);
  });

  it('should have indexes array', () => {
    const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
    const indexesContent = fs.readFileSync(indexesPath, 'utf8');
    indexesConfig = JSON.parse(indexesContent);
    
    expect(indexesConfig).toHaveProperty('indexes');
    expect(Array.isArray(indexesConfig.indexes)).toBe(true);
  });

  it('should have fieldOverrides array', () => {
    const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
    const indexesContent = fs.readFileSync(indexesPath, 'utf8');
    indexesConfig = JSON.parse(indexesContent);
    
    expect(indexesConfig).toHaveProperty('fieldOverrides');
    expect(Array.isArray(indexesConfig.fieldOverrides)).toBe(true);
  });

  describe('Composite Indexes', () => {
    it('should have audio_mappings composite index for surah_number and ayah_number', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      const audioMappingsIndex = indexesConfig.indexes.find(
        index => index.collectionGroup === 'audio_mappings'
      );
      
      expect(audioMappingsIndex).toBeDefined();
      expect(audioMappingsIndex.queryScope).toBe('COLLECTION');
      expect(audioMappingsIndex.fields).toHaveLength(2);
      
      const surahField = audioMappingsIndex.fields.find(f => f.fieldPath === 'surah_number');
      const ayahField = audioMappingsIndex.fields.find(f => f.fieldPath === 'ayah_number');
      
      expect(surahField).toBeDefined();
      expect(surahField.order).toBe('ASCENDING');
      expect(ayahField).toBeDefined();
      expect(ayahField.order).toBe('ASCENDING');
    });

    it('should have tafseer_entries composite index for surah_number and ayah_number', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      const tafseerIndex = indexesConfig.indexes.find(
        index => index.collectionGroup === 'tafseer_entries'
      );
      
      expect(tafseerIndex).toBeDefined();
      expect(tafseerIndex.queryScope).toBe('COLLECTION');
      expect(tafseerIndex.fields).toHaveLength(2);
      
      const surahField = tafseerIndex.fields.find(f => f.fieldPath === 'surah_number');
      const ayahField = tafseerIndex.fields.find(f => f.fieldPath === 'ayah_number');
      
      expect(surahField).toBeDefined();
      expect(surahField.order).toBe('ASCENDING');
      expect(ayahField).toBeDefined();
      expect(ayahField.order).toBe('ASCENDING');
    });

    it('should have custom_urls index for created_at', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      const customUrlsIndex = indexesConfig.indexes.find(
        index => index.collectionGroup === 'custom_urls'
      );
      
      expect(customUrlsIndex).toBeDefined();
      expect(customUrlsIndex.queryScope).toBe('COLLECTION');
      expect(customUrlsIndex.fields).toHaveLength(1);
      expect(customUrlsIndex.fields[0].fieldPath).toBe('created_at');
      expect(customUrlsIndex.fields[0].order).toBe('DESCENDING');
    });
  });

  describe('Single-Field Indexes (Field Overrides)', () => {
    it('should have audio_mappings.custom_url_id field override', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      const customUrlIdOverride = indexesConfig.fieldOverrides.find(
        override => override.collectionGroup === 'audio_mappings' && 
                   override.fieldPath === 'custom_url_id'
      );
      
      expect(customUrlIdOverride).toBeDefined();
      expect(customUrlIdOverride.indexes).toHaveLength(1);
      expect(customUrlIdOverride.indexes[0].order).toBe('ASCENDING');
      expect(customUrlIdOverride.indexes[0].queryScope).toBe('COLLECTION');
    });

    it('should have audio_mappings.surah_number field override', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      const surahNumberOverride = indexesConfig.fieldOverrides.find(
        override => override.collectionGroup === 'audio_mappings' && 
                   override.fieldPath === 'surah_number'
      );
      
      expect(surahNumberOverride).toBeDefined();
      expect(surahNumberOverride.indexes).toHaveLength(1);
      expect(surahNumberOverride.indexes[0].order).toBe('ASCENDING');
      expect(surahNumberOverride.indexes[0].queryScope).toBe('COLLECTION');
    });

    it('should have tafseer_entries.surah_number field override', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      const surahNumberOverride = indexesConfig.fieldOverrides.find(
        override => override.collectionGroup === 'tafseer_entries' && 
                   override.fieldPath === 'surah_number'
      );
      
      expect(surahNumberOverride).toBeDefined();
      expect(surahNumberOverride.indexes).toHaveLength(1);
      expect(surahNumberOverride.indexes[0].order).toBe('ASCENDING');
      expect(surahNumberOverride.indexes[0].queryScope).toBe('COLLECTION');
    });

    it('should have custom_urls.url field override', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      const urlOverride = indexesConfig.fieldOverrides.find(
        override => override.collectionGroup === 'custom_urls' && 
                   override.fieldPath === 'url'
      );
      
      expect(urlOverride).toBeDefined();
      expect(urlOverride.indexes).toHaveLength(1);
      expect(urlOverride.indexes[0].order).toBe('ASCENDING');
      expect(urlOverride.indexes[0].queryScope).toBe('COLLECTION');
    });
  });

  describe('Index Coverage for Query Patterns', () => {
    it('should cover verse lookup queries (surah_number + ayah_number)', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      // Check audio_mappings has composite index
      const audioIndex = indexesConfig.indexes.find(
        index => index.collectionGroup === 'audio_mappings'
      );
      expect(audioIndex).toBeDefined();
      
      // Check tafseer_entries has composite index
      const tafseerIndex = indexesConfig.indexes.find(
        index => index.collectionGroup === 'tafseer_entries'
      );
      expect(tafseerIndex).toBeDefined();
    });

    it('should cover URL relationship queries (custom_url_id)', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      const customUrlIdOverride = indexesConfig.fieldOverrides.find(
        override => override.collectionGroup === 'audio_mappings' && 
                   override.fieldPath === 'custom_url_id'
      );
      expect(customUrlIdOverride).toBeDefined();
    });

    it('should cover surah-level queries (surah_number)', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      // Check audio_mappings has surah_number override
      const audioSurahOverride = indexesConfig.fieldOverrides.find(
        override => override.collectionGroup === 'audio_mappings' && 
                   override.fieldPath === 'surah_number'
      );
      expect(audioSurahOverride).toBeDefined();
      
      // Check tafseer_entries has surah_number override
      const tafseerSurahOverride = indexesConfig.fieldOverrides.find(
        override => override.collectionGroup === 'tafseer_entries' && 
                   override.fieldPath === 'surah_number'
      );
      expect(tafseerSurahOverride).toBeDefined();
    });

    it('should cover URL uniqueness checks (url)', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      const urlOverride = indexesConfig.fieldOverrides.find(
        override => override.collectionGroup === 'custom_urls' && 
                   override.fieldPath === 'url'
      );
      expect(urlOverride).toBeDefined();
    });
  });

  describe('Index Configuration Validation', () => {
    it('should have valid queryScope values', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      indexesConfig.indexes.forEach(index => {
        expect(['COLLECTION', 'COLLECTION_GROUP']).toContain(index.queryScope);
      });
      
      indexesConfig.fieldOverrides.forEach(override => {
        override.indexes.forEach(index => {
          expect(['COLLECTION', 'COLLECTION_GROUP']).toContain(index.queryScope);
        });
      });
    });

    it('should have valid order values', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      indexesConfig.indexes.forEach(index => {
        index.fields.forEach(field => {
          expect(['ASCENDING', 'DESCENDING']).toContain(field.order);
        });
      });
      
      indexesConfig.fieldOverrides.forEach(override => {
        override.indexes.forEach(index => {
          expect(['ASCENDING', 'DESCENDING']).toContain(index.order);
        });
      });
    });

    it('should have required fields for composite indexes', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      indexesConfig.indexes.forEach(index => {
        expect(index).toHaveProperty('collectionGroup');
        expect(index).toHaveProperty('queryScope');
        expect(index).toHaveProperty('fields');
        expect(Array.isArray(index.fields)).toBe(true);
        expect(index.fields.length).toBeGreaterThan(0);
      });
    });

    it('should have required fields for field overrides', () => {
      const indexesPath = path.join(process.cwd(), 'firestore.indexes.json');
      const indexesContent = fs.readFileSync(indexesPath, 'utf8');
      indexesConfig = JSON.parse(indexesContent);
      
      indexesConfig.fieldOverrides.forEach(override => {
        expect(override).toHaveProperty('collectionGroup');
        expect(override).toHaveProperty('fieldPath');
        expect(override).toHaveProperty('indexes');
        expect(Array.isArray(override.indexes)).toBe(true);
        expect(override.indexes.length).toBeGreaterThan(0);
      });
    });
  });
});
