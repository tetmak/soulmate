-- Discovery Profiles: Dil bazlı eşleştirme
-- Kullanıcının seçili dili kaydedilir, eşleştirme aynı dildeki kullanıcılarla yapılır

-- language sütunu ekle (varsayılan 'tr')
ALTER TABLE discovery_profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'tr';

-- Mevcut profilleri 'tr' olarak güncelle (null olanlar)
UPDATE discovery_profiles SET language = 'tr' WHERE language IS NULL;

-- Performans için index
CREATE INDEX IF NOT EXISTS idx_discovery_lang ON discovery_profiles(language);

-- Composite index: dil + cinsiyet + discoverable (sık kullanılan sorgu)
CREATE INDEX IF NOT EXISTS idx_discovery_lang_gender ON discovery_profiles(language, gender, discoverable);
