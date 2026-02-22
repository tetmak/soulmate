-- ═══════════════════════════════════════════════════════════
-- NUMERAEL — Cosmic Match Tabloları
-- Bu SQL'i Supabase Dashboard → SQL Editor'de çalıştırın.
-- ═══════════════════════════════════════════════════════════

-- 0. Ana kullanıcı profilleri (isim, doğum tarihi vs.)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    birth_date DATE,
    birth_time TEXT,
    birth_place TEXT,
    gender TEXT DEFAULT 'male',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi profilini okuyup yazabilir
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

-- 1. Keşfedilebilir profiller (opt-in yapan kullanıcılar)
CREATE TABLE IF NOT EXISTS discovery_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    birth_date DATE,
    gender TEXT DEFAULT 'unknown',
    life_path INT,
    expression_num INT,
    soul_urge INT,
    personality_num INT,
    discoverable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Günlük eşleşmeler
CREATE TABLE IF NOT EXISTS daily_matches (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    match_score INT DEFAULT 0,
    match_date DATE NOT NULL DEFAULT CURRENT_DATE,
    revealed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_date)
);

-- 3. Kullanıcı streak'leri
CREATE TABLE IF NOT EXISTS user_streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_visit_date DATE,
    reveal_credits INT DEFAULT 0,
    total_reveals INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ RLS (Row Level Security) ═══════════════════════════════

ALTER TABLE discovery_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- discovery_profiles: herkes keşfedilebilir profilleri okuyabilir, sadece kendi profilini düzenleyebilir
CREATE POLICY "Anyone can read discoverable profiles"
    ON discovery_profiles FOR SELECT
    USING (discoverable = true);

CREATE POLICY "Users can read own profile"
    ON discovery_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON discovery_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON discovery_profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
    ON discovery_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- daily_matches: kullanıcı sadece kendi eşleşmelerini görebilir
CREATE POLICY "Users can read own matches"
    ON daily_matches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matches"
    ON daily_matches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matches"
    ON daily_matches FOR UPDATE
    USING (auth.uid() = user_id);

-- user_streaks: kullanıcı sadece kendi streak'ini yönetebilir
CREATE POLICY "Users can read own streak"
    ON user_streaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own streak"
    ON user_streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
    ON user_streaks FOR UPDATE
    USING (auth.uid() = user_id);

-- ═══ INDEX ═══════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_discovery_discoverable ON discovery_profiles(discoverable) WHERE discoverable = true;
CREATE INDEX IF NOT EXISTS idx_matches_user_date ON daily_matches(user_id, match_date);
-- Upsert desteği için unique constraint
ALTER TABLE daily_matches ADD CONSTRAINT daily_matches_user_date_unique UNIQUE (user_id, match_date);

-- ═══════════════════════════════════════════════════════════
-- NUMERAEL — Premium Abonelik Tablosu
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'monthly',  -- 'monthly' | 'yearly'
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'cancelled' | 'expired'
    amount INT DEFAULT 0,                 -- kuruş cinsinden (7999 = ₺79.99)
    currency TEXT DEFAULT 'TRY',
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    payment_provider TEXT,                -- 'stripe' | 'iyzico' | 'simulated'
    payment_ref TEXT,                     -- ödeme referans kodu
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own subscription"
    ON subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
    ON subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_subs_user_status ON subscriptions(user_id, status);

-- ═══════════════════════════════════════════════════════════════
-- GAMIFICATION TABLOLARI
-- ═══════════════════════════════════════════════════════════════

-- Kullanıcı gamification profili
CREATE TABLE IF NOT EXISTS user_gamification (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT DEFAULT '',
    nbp INT DEFAULT 0,
    total_xp INT DEFAULT 0,
    rank_id TEXT DEFAULT 'novice',
    quiz_correct INT DEFAULT 0,
    quiz_total INT DEFAULT 0,
    duel_wins INT DEFAULT 0,
    duel_losses INT DEFAULT 0,
    duel_win_streak INT DEFAULT 0,
    duel_best_streak INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    total_analyses INT DEFAULT 0,
    connections_count INT DEFAULT 0,
    reveals_count INT DEFAULT 0,
    premium_days_earned INT DEFAULT 0,
    bonus_reveals INT DEFAULT 0,
    unlocked_badges TEXT[] DEFAULT '{}',
    equipped_frame TEXT,
    league_tier INT DEFAULT 1,
    weekly_xp INT DEFAULT 0,
    week_start DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir (leaderboard için)
CREATE POLICY "Anyone can read gamification profiles"
    ON user_gamification FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own gamification"
    ON user_gamification FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification"
    ON user_gamification FOR UPDATE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_gam_nbp ON user_gamification(nbp DESC);
CREATE INDEX IF NOT EXISTS idx_gam_weekly ON user_gamification(league_tier, weekly_xp DESC);

-- Haftalık leaderboard snapshot (pazar gecesi cron ile doldurulur)
CREATE TABLE IF NOT EXISTS leaderboard_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    week_start DATE NOT NULL,
    weekly_xp INT DEFAULT 0,
    nbp INT DEFAULT 0,
    rank_id TEXT,
    league_tier INT DEFAULT 1,
    final_position INT,
    promoted BOOLEAN DEFAULT FALSE,
    demoted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leaderboard_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard history"
    ON leaderboard_history FOR SELECT
    USING (true);

CREATE POLICY "System can insert leaderboard"
    ON leaderboard_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lb_week ON leaderboard_history(week_start, league_tier, final_position);

-- Quiz geçmişi (isteğe bağlı analitik)
CREATE TABLE IF NOT EXISTS quiz_results (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT DEFAULT 'solo',   -- 'solo' | 'duel'
    correct_count INT DEFAULT 0,
    total_count INT DEFAULT 0,
    xp_earned INT DEFAULT 0,
    duel_won BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quiz results"
    ON quiz_results FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
    ON quiz_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Haftalık XP sıfırlama fonksiyonu (Supabase cron veya edge function ile çağrılır)
-- Her pazar 23:59'da:
-- 1. Mevcut haftayı leaderboard_history'ye kaydet
-- 2. Üst 3'ü terfi, alt 3'ü düşür
-- 3. weekly_xp'yi sıfırla
CREATE OR REPLACE FUNCTION reset_weekly_leaderboard()
RETURNS void AS $$
DECLARE
    current_week DATE := date_trunc('week', NOW())::DATE;
    r RECORD;
    pos INT;
    tier_users CURSOR (t INT) FOR
        SELECT user_id, display_name, weekly_xp, nbp, rank_id, league_tier
        FROM user_gamification
        WHERE league_tier = t AND weekly_xp > 0
        ORDER BY weekly_xp DESC;
BEGIN
    -- Her lig için
    FOR tier IN 1..5 LOOP
        pos := 0;
        FOR r IN tier_users(tier) LOOP
            pos := pos + 1;

            -- Geçmişe kaydet
            INSERT INTO leaderboard_history (user_id, display_name, week_start, weekly_xp, nbp, rank_id, league_tier, final_position, promoted, demoted)
            VALUES (r.user_id, r.display_name, current_week, r.weekly_xp, r.nbp, r.rank_id, tier, pos, pos <= 3 AND tier < 5, FALSE);

            -- Terfi (üst 3)
            IF pos <= 3 AND tier < 5 THEN
                UPDATE user_gamification SET league_tier = tier + 1 WHERE user_id = r.user_id;
            END IF;
        END LOOP;

        -- Düşürme (alt 3) — sadece 4+ kişi varsa
        IF pos >= 6 THEN
            UPDATE user_gamification SET league_tier = GREATEST(1, tier - 1)
            WHERE user_id IN (
                SELECT user_id FROM user_gamification
                WHERE league_tier = tier AND weekly_xp > 0
                ORDER BY weekly_xp ASC LIMIT 3
            );
            UPDATE leaderboard_history SET demoted = TRUE
            WHERE week_start = current_week AND league_tier = tier AND final_position > pos - 3;
        END IF;
    END LOOP;

    -- Weekly XP sıfırla
    UPDATE user_gamification SET weekly_xp = 0, week_start = current_week;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
