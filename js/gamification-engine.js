/**
 * KADER — Gamification Engine v1.0
 * XP, Rütbe, Quiz, Günlük Görev, Ödül, Leaderboard, Kozmik Görünürlük
 *
 * Kullanım:
 *   gamification.addXP('quiz_correct', 10)
 *   gamification.getRank()
 *   gamification.getDailyQuests()
 *   gamification.getVisibilityMultiplier()
 */
(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // RÜTBE SİSTEMİ
    // ═══════════════════════════════════════════════════════════
    var RANKS = [
        { id: 'novice',     name: 'Çaylak Kaşif',      minNBP: 0,    color: '#9ca3af', icon: 'explore',        visibility: 1, radarSize: 6,  premiumDays: 0, frame: null },
        { id: 'student',    name: 'Yıldız Öğrencisi',  minNBP: 100,  color: '#22c55e', icon: 'school',         visibility: 2, radarSize: 8,  premiumDays: 0, frame: 'glow-green' },
        { id: 'warrior',    name: 'Sayı Savaşçısı',    minNBP: 300,  color: '#3b82f6', icon: 'shield',         visibility: 3, radarSize: 10, premiumDays: 0, frame: 'glow-blue' },
        { id: 'guide',      name: 'Kozmik Rehber',      minNBP: 600,  color: '#a855f7', icon: 'assistant_navigation', visibility: 4, radarSize: 12, premiumDays: 0, frame: 'glow-purple' },
        { id: 'master',     name: 'Usta Numerolog',     minNBP: 1000, color: '#f59e0b', icon: 'auto_awesome',   visibility: 5, radarSize: 14, premiumDays: 1, frame: 'glow-gold' },
        { id: 'sage',       name: 'Yıldız Bilgesi',    minNBP: 2000, color: '#e2e8f0', icon: 'diamond',        visibility: 7, radarSize: 16, premiumDays: 1, frame: 'glow-platinum' },
        { id: 'oracle',     name: 'Kozmik Kahin',       minNBP: 3500, color: '#ec4899', icon: 'blur_on',        visibility: 10, radarSize: 20, premiumDays: 3, frame: 'glow-galaxy' }
    ];

    // ═══════════════════════════════════════════════════════════
    // XP EYLEM TABLOSU
    // ═══════════════════════════════════════════════════════════
    var XP_ACTIONS = {
        app_open:          5,    // günde 1 kez
        daily_reading:     10,   // günlük titreşim oku
        quiz_correct:      15,   // quiz doğru cevap
        quiz_wrong:        3,    // quiz yanlış (katılım ödülü)
        duel_win:          50,   // düello kazan
        duel_lose:         10,   // düello katılım
        compatibility:     20,   // uyumluluk analizi yap
        add_connection:    25,   // arkadaş ekle
        cosmic_match_view: 10,   // günlük eşleşme bak
        streak_day:        15,   // her streak günü
        streak_7:          100,  // 7 gün streak bonus
        streak_30:         500,  // 30 gün streak bonus
        quest_complete:    30,   // günlük görev tamamla
        all_quests:        100,  // tüm günlük görevler bonus
        share_card:        20,   // kart paylaş
        reveal_match:      15,   // cosmic match reveal
        manifest_set:      10,   // niyet belirle
        wheel_spin:        10    // çark çevir
    };

    // ═══════════════════════════════════════════════════════════
    // BAŞARIM ROZETLERİ
    // ═══════════════════════════════════════════════════════════
    var BADGES = [
        { id: 'first_step',     name: 'İlk Adım',           desc: 'İlk analizini yap',            icon: 'footprint',        condition: function(s) { return s.total_analyses >= 1; } },
        { id: 'connector',      name: 'Bağ Kurucusu',        desc: '5 arkadaş ekle',                icon: 'group_add',        condition: function(s) { return s.connections >= 5; } },
        { id: 'streak_fire',    name: 'Streak Ateşi',        desc: '7 gün üst üste giriş',         icon: 'local_fire_department', condition: function(s) { return s.max_streak >= 7; } },
        { id: 'streak_blaze',   name: 'Söndürülmez Alev',    desc: '30 gün streak',                 icon: 'whatshot',         condition: function(s) { return s.max_streak >= 30; } },
        { id: 'streak_eternal', name: 'Sonsuz Ateş',         desc: '100 gün streak',                icon: 'emergency_heat',         condition: function(s) { return s.max_streak >= 100; } },
        { id: 'quiz_5',         name: 'Meraklı Zihin',       desc: '5 quiz doğru cevapla',          icon: 'psychology',       condition: function(s) { return s.quiz_correct >= 5; } },
        { id: 'quiz_50',        name: 'Bilgi Makinesi',      desc: '50 quiz doğru cevapla',         icon: 'neurology',        condition: function(s) { return s.quiz_correct >= 50; } },
        { id: 'duel_3',         name: 'Yenilmez',            desc: '3 düello üst üste kazan',       icon: 'swords',           condition: function(s) { return s.duel_win_streak >= 3; } },
        { id: 'duel_legend',    name: 'Düello Efsanesi',     desc: '10 düello üst üste kazan',      icon: 'military_tech',    condition: function(s) { return s.duel_win_streak >= 10; } },
        { id: 'soul_hunter',    name: 'Ruh İkizi Avcısı',   desc: '10 Cosmic Match reveal',        icon: 'favorite',         condition: function(s) { return s.reveals >= 10; } },
        { id: 'galaxy_cap',     name: 'Galaksi Kaptanı',     desc: 'Elmas lige ulaş',              icon: 'emoji_events',     condition: function(s) { return s.league_tier >= 5; } },
        { id: 'all_quests_7',   name: 'Görev Avcısı',        desc: '7 gün üst üste tüm görevleri tamamla', icon: 'task_alt', condition: function(s) { return s.all_quests_streak >= 7; } },
        { id: 'oracle_rank',    name: 'Kozmik Uyanış',       desc: 'Kozmik Kahin rütbesine ulaş',  icon: 'blur_on',          condition: function(s) { return s.nbp >= 3500; } }
    ];

    // ═══════════════════════════════════════════════════════════
    // QUIZ SORU BANKASI
    // ═══════════════════════════════════════════════════════════
    var QUIZ_BANK = [
        // ── KOLAY ──
        { q: '1 sayısının enerjisi nedir?', opts: ['Liderlik & Bağımsızlık', 'Uyum & Denge', 'Yaratıcılık & İfade', 'Disiplin & Düzen'], correct: 0, diff: 1 },
        { q: '2 sayısının temel özelliği nedir?', opts: ['Güç & Otorite', 'Diplomasi & Denge', 'Macera & Özgürlük', 'Analiz & Gizem'], correct: 1, diff: 1 },
        { q: '3 sayısı neyi temsil eder?', opts: ['Disiplin', 'İletişim & Yaratıcılık', 'Güvenlik', 'Mükemmelcilik'], correct: 1, diff: 1 },
        { q: '7 sayısının enerjisi nedir?', opts: ['Sosyallik', 'Maneviyat & Analiz', 'Maddi başarı', 'Romantizm'], correct: 1, diff: 1 },
        { q: 'Hangi sayı "Şifacı" arketipini taşır?', opts: ['3', '5', '6', '9'], correct: 2, diff: 1 },
        { q: '5 sayısı neyi simgeler?', opts: ['Düzen & Güvenlik', 'Değişim & Özgürlük', 'Ev & Aile', 'Güç & Otorite'], correct: 1, diff: 1 },
        { q: '9 sayısı hangi enerjiyi taşır?', opts: ['Bencillik', 'Evrensel Sevgi & Bilgelik', 'Kaos & Karmaşa', 'Korku & Şüphe'], correct: 1, diff: 1 },
        { q: '4 sayısının anahtar kelimesi nedir?', opts: ['Macera', 'Hayal gücü', 'Yapı & Disiplin', 'Duygu'], correct: 2, diff: 1 },
        { q: '8 sayısı neyle ilişkilidir?', opts: ['Sanat & Müzik', 'Maddi Bolluk & Güç', 'Yalnızlık', 'Hayal & Fantezi'], correct: 1, diff: 1 },
        { q: 'Yaşam Yolu sayısı nasıl hesaplanır?', opts: ['İsmin harflerinden', 'Doğum tarihinin toplamından', 'Ay burcundan', 'Rastgele atanır'], correct: 1, diff: 1 },

        // ── ORTA ──
        { q: '11 neden "Usta Sayı" kabul edilir?', opts: ['En büyük tek haneli sayıdır', 'Yüksek sezgisel & spiritüel enerji taşır', 'Şans getirir', 'Çift sayıdır'], correct: 1, diff: 2 },
        { q: 'Hangi iki sayı en yüksek uyuma sahiptir?', opts: ['1 ve 4', '2 ve 6', '3 ve 7', '5 ve 8'], correct: 1, diff: 2 },
        { q: 'Soul Urge (Ruh Dürtüsü) sayısı nasıl bulunur?', opts: ['Doğum gününden', 'İsmin sesli harflerinden', 'İsmin sessiz harflerinden', 'Yıl sayısından'], correct: 1, diff: 2 },
        { q: 'Kişilik (Personality) sayısı neyi gösterir?', opts: ['İç dünyanı', 'Başkalarının seni nasıl gördüğünü', 'Hayat amacını', 'Ruh eşini'], correct: 1, diff: 2 },
        { q: 'Hangi sayı çifti doğal gerilim yaratır?', opts: ['1 ve 3', '4 ve 5', '6 ve 9', '2 ve 4'], correct: 1, diff: 2 },
        { q: '22 usta sayısı hangi arketiptir?', opts: ['İlhamcı', 'Mistik', 'Usta Mimar', 'Şifacı'], correct: 2, diff: 2 },
        { q: '33 usta sayısının enerjisi nedir?', opts: ['Güç & Kontrol', 'Koşulsuz Sevgi & Öğretmenlik', 'Macera & Risk', 'Analiz & Mantık'], correct: 1, diff: 2 },
        { q: 'Kişisel Yıl sayısı ne belirler?', opts: ['Hayat amacını', 'O yılın enerji temasını', 'Ruh eşini', 'Şans gününü'], correct: 1, diff: 2 },
        { q: 'Expression (İfade) sayısı neden önemlidir?', opts: ['Doğum gününü gösterir', 'Doğal yetenekleri ve potansiyeli gösterir', 'Ay burcunu belirler', 'Gelecek yılı tahmin eder'], correct: 1, diff: 2 },
        { q: '1 ve 8 neden güçlü uyum sağlar?', opts: ['İkisi de çift sayıdır', 'Liderlik ve güç enerjileri birbirini besler', 'Aynı element grubundadır', 'İkisi de usta sayıdır'], correct: 1, diff: 2 },

        // ── ZOR ──
        { q: '15 Ağustos 1990 doğumlu birinin Yaşam Yolu sayısı kaçtır?', opts: ['5', '6', '7', '33'], correct: 1, diff: 3 },
        { q: 'Karmic borç sayıları hangileridir?', opts: ['11, 22, 33', '13, 14, 16, 19', '1, 5, 7, 9', '2, 4, 6, 8'], correct: 1, diff: 3 },
        { q: 'Pisagor sisteminde "Ş" harfinin değeri kaçtır?', opts: ['1', '3', '6', '8'], correct: 0, diff: 3 },
        { q: 'Kişisel Ay sayısı nasıl hesaplanır?', opts: ['Doğum ayı + güncel ay', 'Kişisel Yıl + güncel ay', 'Yaşam Yolu × 2', 'İfade + Ruh Dürtüsü'], correct: 1, diff: 3 },
        { q: '6 ve 9 neden "kozmik ikizler" kabul edilir?', opts: ['Toplamları 15 yapar', 'Biri veren biri alan; sevgi döngüsü tamamlanır', 'Aynı gezegen yönetir', 'İkisi de tek sayıdır'], correct: 1, diff: 3 },
        { q: 'Missing Number (eksik sayı) analizi ne gösterir?', opts: ['İsimde olmayan harfleri', 'İsimde hiç bulunmayan sayı titreşimlerini — gelişim alanını', 'Doğum gününde olmayan rakamları', 'Yanlış hesaplanmış sayıları'], correct: 1, diff: 3 },
        { q: 'Bridge Number ne işe yarar?', opts: ['İki kişiyi köprüler', 'İki temel sayı arasındaki farkı gösterir, uyum ipucu verir', 'Yeni sayı üretir', 'Gelecek tahmini yapar'], correct: 1, diff: 3 },
        { q: 'Pinnacle ve Challenge döngüleri kaç yaşlarında değişir?', opts: ['Her 10 yılda', '~27-36-45 yaşlarında (LP bazlı)', 'Her 5 yılda', 'Değişmez, sabittir'], correct: 1, diff: 3 },

        // ── UZMAN ──
        { q: 'Doğum tarihi 29/11/1994 olan birinin tüm temel sayıları düşünüldüğünde, bu kişi hangi enerji kümesindedir?', opts: ['Lider-Yapıcı (1-4-8)', 'Sezgisel-Spiritüel (2-7-11)', 'Yaratıcı-Sosyal (3-5-9)', 'Usta Sayı taşıyıcısı (11-22)'], correct: 3, diff: 4 },
        { q: 'Maturity Number ne zaman etkili olmaya başlar ve nasıl hesaplanır?', opts: ['Doğumdan itibaren, LP+Expression', '35-40 yaş civarı, LP+Expression toplamı', 'Her yıl değişir, Kişisel Yıl bazlı', '50 yaş sonrası, Soul+Personality'], correct: 1, diff: 4 },
    ];

    // ═══════════════════════════════════════════════════════════
    // GÜNLÜK GÖREVLER
    // ═══════════════════════════════════════════════════════════
    var QUEST_TEMPLATES = [
        { id: 'read_daily',      name: 'Günlük Titreşimini Oku',  icon: 'auto_stories',  xp: 10, action: 'daily_reading' },
        { id: 'quiz_1',          name: '1 Quiz Sorusu Cevapla',   icon: 'quiz',           xp: 15, action: 'quiz_attempt' },
        { id: 'view_match',      name: 'Cosmic Match\'ine Bak',   icon: 'favorite',       xp: 10, action: 'cosmic_match_view' },
        { id: 'check_compat',    name: 'Uyumluluk Analizi Yap',   icon: 'compare_arrows', xp: 20, action: 'compatibility' },
        { id: 'set_manifest',    name: 'Bir Niyet Belirle',       icon: 'self_improvement',xp: 10, action: 'manifest_set' },
        { id: 'share_card',      name: 'Kozmik Kartını Paylaş',   icon: 'share',          xp: 20, action: 'share_card' },
        { id: 'quiz_3',          name: '3 Quiz Doğru Cevapla',    icon: 'psychology',     xp: 30, action: 'quiz_3_correct' },
        { id: 'spin_wheel',      name: 'Kader Çarkını Çevir',     icon: 'casino',         xp: 10, action: 'wheel_spin' },
        { id: 'add_friend',      name: 'Yeni Arkadaş Ekle',       icon: 'person_add',     xp: 25, action: 'add_connection' },
        { id: 'visit_calendar',  name: 'Kozmik Takvimi Ziyaret Et', icon: 'calendar_month', xp: 10, action: 'calendar_visit' }
    ];

    // ═══════════════════════════════════════════════════════════
    // STATE YÖNETİMİ (localStorage)
    // ═══════════════════════════════════════════════════════════
    var STATE_KEY = 'kader_gamification';

    function getState() {
        try {
            var s = JSON.parse(localStorage.getItem(STATE_KEY));
            if (s && s.version === 1) return s;
        } catch(e) {}
        return createDefaultState();
    }

    function saveState(s) {
        s.updated_at = new Date().toISOString();
        try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch(e) {}

        // Supabase'e senkronize et (debounced)
        clearTimeout(saveState._timer);
        saveState._timer = setTimeout(function() { syncToSupabase(s); }, 2000);
    }

    // ─── SUPABASE SENKRONİZASYON ─────────────────────────────
    var _syncing = false;

    async function syncToSupabase(s) {
        if (_syncing) return;
        if (!window.supabaseClient || !window.auth) return;
        try {
            _syncing = true;
            var session = await window.auth.getSession();
            if (!session || !session.user) { _syncing = false; return; }

            var uid = session.user.id;
            var rank = getRankByNBP(s.nbp);
            var weekStart = getWeekStart();

            var userData = null;
            try { userData = JSON.parse(localStorage.getItem('kader_user_data')); } catch(e) {}
            var displayName = (userData && userData.name) ? userData.name : 'Kaşif';
            // İsmi kısalt (gizlilik): "Ahmet Yılmaz" → "Ahmet Y."
            var parts = displayName.trim().split(/\s+/);
            if (parts.length > 1) displayName = parts[0] + ' ' + parts[parts.length-1].charAt(0) + '.';

            await window.supabaseClient.from('user_gamification').upsert({
                user_id: uid,
                display_name: displayName,
                nbp: s.nbp,
                total_xp: s.total_xp,
                rank_id: rank.id,
                quiz_correct: s.quiz_correct,
                quiz_total: s.quiz_total,
                duel_wins: s.duel_wins,
                duel_losses: s.duel_losses,
                duel_win_streak: s.duel_win_streak,
                duel_best_streak: s.duel_best_streak,
                current_streak: s.current_streak,
                max_streak: s.max_streak,
                total_analyses: s.total_analyses,
                connections_count: s.connections,
                reveals_count: s.reveals,
                premium_days_earned: s.premium_days_earned,
                bonus_reveals: s.bonus_reveals,
                unlocked_badges: s.unlocked_badges,
                equipped_frame: s.equipped_frame,
                league_tier: s.league_tier || 1,
                weekly_xp: s.daily_xp_earned,
                week_start: weekStart,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

            _syncing = false;
        } catch(e) {
            console.warn('[Gamification] Supabase sync error:', e);
            _syncing = false;
        }
    }

    function getWeekStart() {
        var d = new Date();
        var day = d.getDay(); // 0=pazar
        var diff = d.getDate() - day + (day === 0 ? -6 : 1); // pazartesi
        var mon = new Date(d.setDate(diff));
        return mon.toISOString().slice(0, 10);
    }

    // Uygulama açılınca Supabase'den state çek (varsa)
    async function loadFromSupabase() {
        if (!window.supabaseClient || !window.auth) return;
        try {
            var session = await window.auth.getSession();
            if (!session || !session.user) return;
            var res = await window.supabaseClient
                .from('user_gamification')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (res.data && res.data.nbp > 0) {
                var s = getState();
                // Supabase'deki veri daha yüksekse güncelle
                if (res.data.nbp > s.nbp) {
                    s.nbp = res.data.nbp;
                    s.total_xp = res.data.total_xp;
                    s.quiz_correct = res.data.quiz_correct;
                    s.quiz_total = res.data.quiz_total;
                    s.duel_wins = res.data.duel_wins;
                    s.duel_losses = res.data.duel_losses;
                    s.duel_win_streak = res.data.duel_win_streak;
                    s.duel_best_streak = res.data.duel_best_streak;
                    s.max_streak = res.data.max_streak;
                    s.reveals = res.data.reveals_count;
                    s.league_tier = res.data.league_tier;
                    s.unlocked_badges = res.data.unlocked_badges || [];
                    try { localStorage.setItem(STATE_KEY, JSON.stringify(s)); } catch(e) {}
                    console.log('[Gamification] State loaded from Supabase, NBP:', s.nbp);
                }
            }
        } catch(e) {}
    }

    function createDefaultState() {
        return {
            version: 1,
            nbp: 0,              // Numeroloji Bilgi Puanı
            total_xp: 0,         // toplam XP
            level: 1,
            // İstatistikler
            quiz_correct: 0,
            quiz_wrong: 0,
            quiz_total: 0,
            duel_wins: 0,
            duel_losses: 0,
            duel_win_streak: 0,
            duel_best_streak: 0,
            total_analyses: 0,
            connections: 0,
            reveals: 0,
            max_streak: 0,
            current_streak: 0,
            league_tier: 0,
            all_quests_streak: 0,
            // Günlük
            daily_quests: [],
            daily_quests_date: '',
            daily_xp_earned: 0,
            daily_date: '',
            // Başarımlar
            unlocked_badges: [],
            // Ödüller
            pending_rewards: [],
            premium_days_earned: 0,
            bonus_reveals: 0,
            // Profil
            equipped_frame: null,
            equipped_title: null,
            // Zaman
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    // ═══════════════════════════════════════════════════════════
    // XP & RÜTBE
    // ═══════════════════════════════════════════════════════════
    function addXP(action, bonus) {
        var s = getState();
        var base = XP_ACTIONS[action] || 0;
        var xp = base + (bonus || 0);
        if (xp <= 0) return s;

        // Günlük rate limit (app_open günde 1 kez)
        var today = todayStr();
        if (action === 'app_open') {
            if (s.daily_date === today && s.daily_xp_earned > 0) return s; // zaten açmış
        }

        s.total_xp += xp;
        s.nbp += Math.round(xp * 0.7); // NBP = XP'nin %70'i

        if (s.daily_date !== today) {
            s.daily_date = today;
            s.daily_xp_earned = 0;
        }
        s.daily_xp_earned += xp;

        // Stat güncelle
        if (action === 'quiz_correct') s.quiz_correct++;
        if (action === 'quiz_wrong') s.quiz_wrong++;
        if (action === 'quiz_correct' || action === 'quiz_wrong') s.quiz_total++;
        if (action === 'duel_win') { s.duel_wins++; s.duel_win_streak++; if (s.duel_win_streak > s.duel_best_streak) s.duel_best_streak = s.duel_win_streak; }
        if (action === 'duel_lose') { s.duel_losses++; s.duel_win_streak = 0; }
        if (action === 'compatibility') s.total_analyses++;
        if (action === 'add_connection') s.connections++;
        if (action === 'reveal_match') s.reveals++;

        // Rozet kontrol
        checkBadges(s);

        // Rütbe yükselme ödülü
        var oldRank = getRankByNBP(s.nbp - Math.round(xp * 0.7));
        var newRank = getRankByNBP(s.nbp);
        if (newRank.id !== oldRank.id) {
            s.pending_rewards.push({
                type: 'rank_up',
                rank: newRank.id,
                name: newRank.name,
                premiumDays: newRank.premiumDays,
                timestamp: new Date().toISOString()
            });
            if (newRank.premiumDays > 0) {
                s.premium_days_earned += newRank.premiumDays;
            }
        }

        saveState(s);
        return s;
    }

    function getRankByNBP(nbp) {
        var rank = RANKS[0];
        for (var i = RANKS.length - 1; i >= 0; i--) {
            if (nbp >= RANKS[i].minNBP) { rank = RANKS[i]; break; }
        }
        return rank;
    }

    function getCurrentRank() {
        var s = getState();
        return getRankByNBP(s.nbp);
    }

    function getNextRank() {
        var s = getState();
        var current = getCurrentRank();
        for (var i = 0; i < RANKS.length; i++) {
            if (RANKS[i].id === current.id && i < RANKS.length - 1) {
                return RANKS[i + 1];
            }
        }
        return null; // max rütbe
    }

    function getRankProgress() {
        var s = getState();
        var current = getCurrentRank();
        var next = getNextRank();
        if (!next) return { current: current, next: null, progress: 100, remaining: 0 };
        var range = next.minNBP - current.minNBP;
        var progress = Math.min(100, Math.round(((s.nbp - current.minNBP) / range) * 100));
        return {
            current: current,
            next: next,
            progress: progress,
            remaining: next.minNBP - s.nbp,
            nbp: s.nbp
        };
    }

    // ═══════════════════════════════════════════════════════════
    // KOZMİK GÖRÜNÜRLÜK (Cosmic Match entegrasyonu)
    // ═══════════════════════════════════════════════════════════
    function getVisibilityMultiplier() {
        return getCurrentRank().visibility;
    }

    function getRadarSize() {
        return getCurrentRank().radarSize;
    }

    function getProfileFrame() {
        var s = getState();
        return s.equipped_frame || getCurrentRank().frame;
    }

    // ═══════════════════════════════════════════════════════════
    // GÜNLÜK GÖREVLER
    // ═══════════════════════════════════════════════════════════
    function getDailyQuests() {
        var s = getState();
        var today = todayStr();

        if (s.daily_quests_date === today && s.daily_quests.length > 0) {
            return s.daily_quests;
        }

        // Bugünün seed'i ile 3 rastgele görev seç
        var seed = hashDate(today);
        var shuffled = QUEST_TEMPLATES.slice().sort(function(a, b) {
            return hashStr(a.id + today) - hashStr(b.id + today);
        });
        var selected = shuffled.slice(0, 3).map(function(qt) {
            return { id: qt.id, name: qt.name, icon: qt.icon, xp: qt.xp, action: qt.action, completed: false };
        });

        s.daily_quests = selected;
        s.daily_quests_date = today;
        saveState(s);
        return selected;
    }

    function completeQuest(questId) {
        var s = getState();
        var quest = null;
        for (var i = 0; i < s.daily_quests.length; i++) {
            if (s.daily_quests[i].id === questId && !s.daily_quests[i].completed) {
                s.daily_quests[i].completed = true;
                quest = s.daily_quests[i];
                break;
            }
        }
        if (!quest) return null;

        // XP ver
        s.total_xp += quest.xp;
        s.nbp += Math.round(quest.xp * 0.7);

        // Tüm görevler tamamlandı mı?
        var allDone = s.daily_quests.every(function(q) { return q.completed; });
        if (allDone) {
            // Bonus!
            var bonus = XP_ACTIONS.all_quests;
            s.total_xp += bonus;
            s.nbp += Math.round(bonus * 0.7);
            s.all_quests_streak++;

            // Kozmik Sandık ödülü
            var chest = generateChestReward(s);
            s.pending_rewards.push(chest);
        }

        checkBadges(s);
        saveState(s);
        return { quest: quest, allDone: allDone, state: s };
    }

    // Aksiyon bazlı otomatik görev tamamlama
    function trackAction(action) {
        var s = getState();
        if (s.daily_quests_date !== todayStr()) getDailyQuests();
        s = getState();

        var completed = [];
        for (var i = 0; i < s.daily_quests.length; i++) {
            var q = s.daily_quests[i];
            if (!q.completed && q.action === action) {
                completed.push(q.id);
            }
        }
        completed.forEach(function(id) { completeQuest(id); });
        return completed;
    }

    // ═══════════════════════════════════════════════════════════
    // KOZMİK SANDIK (Rastgele Ödül)
    // ═══════════════════════════════════════════════════════════
    function generateChestReward(s) {
        var roll = Math.random();
        if (roll < 0.05) {
            // %5 — Nadir: 1 gün Premium
            return { type: 'chest', rarity: 'legendary', reward: 'premium_day', label: '1 Gün Premium!', icon: 'workspace_premium', color: '#f59e0b' };
        } else if (roll < 0.15) {
            // %10 — Epik: Reveal kredisi
            s.bonus_reveals++;
            return { type: 'chest', rarity: 'epic', reward: 'reveal_credit', label: '+1 Reveal Kredisi', icon: 'visibility', color: '#a855f7' };
        } else if (roll < 0.35) {
            // %20 — Nadir: Streak kalkanı
            return { type: 'chest', rarity: 'rare', reward: 'streak_shield', label: 'Streak Kalkanı', icon: 'shield', color: '#3b82f6' };
        } else if (roll < 0.60) {
            // %25 — Bonus XP
            var bonusXP = 50 + Math.floor(Math.random() * 100);
            s.total_xp += bonusXP;
            s.nbp += Math.round(bonusXP * 0.7);
            return { type: 'chest', rarity: 'common', reward: 'bonus_xp', label: '+' + bonusXP + ' XP', icon: 'bolt', color: '#22c55e' };
        } else {
            // %40 — Koleksiyon kartı
            var cardNum = Math.floor(Math.random() * 12) + 1; // 1-12
            if (cardNum > 9 && cardNum <= 11) cardNum = 11;
            if (cardNum > 11) cardNum = 22;
            return { type: 'chest', rarity: 'common', reward: 'card', label: cardNum + ' Kozmik Kartı', icon: 'style', color: '#ec4899', cardNumber: cardNum };
        }
    }

    // ═══════════════════════════════════════════════════════════
    // QUIZ SİSTEMİ
    // ═══════════════════════════════════════════════════════════
    function getQuizQuestion(difficulty) {
        var s = getState();
        var rank = getCurrentRank();

        // Rütbeye göre zorluk ayarla
        var maxDiff = 1;
        if (rank.minNBP >= 100) maxDiff = 2;
        if (rank.minNBP >= 600) maxDiff = 3;
        if (rank.minNBP >= 2000) maxDiff = 4;

        var targetDiff = difficulty || Math.min(maxDiff, 1 + Math.floor(Math.random() * maxDiff));

        var pool = QUIZ_BANK.filter(function(q) { return q.diff <= targetDiff + 1 && q.diff >= targetDiff - 1; });
        if (pool.length === 0) pool = QUIZ_BANK;

        // Rastgele seç
        var idx = Math.floor(Math.random() * pool.length);
        return pool[idx];
    }

    function answerQuiz(questionIndex, selectedOpt, question) {
        var isCorrect = selectedOpt === question.correct;
        if (isCorrect) {
            // Zorluk bonusu
            var bonus = (question.diff - 1) * 5;
            addXP('quiz_correct', bonus);
            trackAction('quiz_attempt');

            // 3 doğru peşpeşe?
            var s = getState();
            trackAction('quiz_3_correct');
        } else {
            addXP('quiz_wrong', 0);
            trackAction('quiz_attempt');
        }
        return isCorrect;
    }

    // ═══════════════════════════════════════════════════════════
    // DÜELLO
    // ═══════════════════════════════════════════════════════════
    function startDuel() {
        // 5 soru ile düello
        var questions = [];
        for (var i = 0; i < 5; i++) {
            var diff = 1 + Math.floor(i / 2); // giderek zorlaşır
            questions.push(getQuizQuestion(diff));
        }
        return { questions: questions, playerScore: 0, opponentScore: 0 };
    }

    function finishDuel(playerCorrect, totalQuestions) {
        // Rakip AI simülasyonu (rütbeye göre zorluk)
        var rank = getCurrentRank();
        var aiDifficulty = Math.min(0.8, 0.4 + (rank.minNBP / 5000));
        var opponentCorrect = 0;
        for (var i = 0; i < totalQuestions; i++) {
            if (Math.random() < aiDifficulty) opponentCorrect++;
        }

        var won = playerCorrect > opponentCorrect;
        var tied = playerCorrect === opponentCorrect;

        if (won) {
            addXP('duel_win', 0);
        } else if (!tied) {
            addXP('duel_lose', 0);
        } else {
            addXP('quiz_correct', 10); // berabere
        }

        var s = getState();
        var rewards = [];

        // Win streak kontrolleri
        if (won) {
            if (s.duel_win_streak === 3) {
                rewards.push({ type: 'badge', id: 'duel_3', name: 'Yenilmez Rozeti! (24 saat profilde)' });
            }
            if (s.duel_win_streak === 5) {
                rewards.push({ type: 'card', name: 'Nadir Koleksiyon Kartı!' });
            }
            if (s.duel_win_streak === 10) {
                rewards.push({ type: 'premium', days: 1, name: '1 Gün Premium + Düello Efsanesi Rozeti!' });
                s.premium_days_earned++;
                saveState(s);
            }
        }

        return {
            won: won,
            tied: tied,
            playerScore: playerCorrect,
            opponentScore: opponentCorrect,
            winStreak: s.duel_win_streak,
            rewards: rewards
        };
    }

    // ═══════════════════════════════════════════════════════════
    // LEADERBOARD
    // ═══════════════════════════════════════════════════════════
    var LEAGUES = [
        { tier: 1, name: 'Bronz Ay',      color: '#cd7f32', icon: 'dark_mode' },
        { tier: 2, name: 'Gümüş Yıldız',  color: '#c0c0c0', icon: 'star' },
        { tier: 3, name: 'Altın Güneş',    color: '#ffd700', icon: 'light_mode' },
        { tier: 4, name: 'Platin Nebula',  color: '#e5e7eb', icon: 'blur_circular' },
        { tier: 5, name: 'Elmas Galaksi',  color: '#60a5fa', icon: 'diamond' }
    ];

    function getCurrentLeague() {
        var s = getState();
        var tier = s.league_tier || 1;
        if (tier < 1) tier = 1;
        if (tier > LEAGUES.length) tier = LEAGUES.length;
        return LEAGUES[tier - 1];
    }

    // Gerçek leaderboard — Supabase'den çek
    async function getLeaderboardAsync() {
        var s = getState();
        var league = getCurrentLeague();

        try {
            if (!window.supabaseClient) throw new Error('No Supabase');

            var res = await window.supabaseClient
                .from('user_gamification')
                .select('user_id, display_name, weekly_xp, nbp, rank_id, league_tier')
                .eq('league_tier', league.tier)
                .order('weekly_xp', { ascending: false })
                .limit(20);

            if (res.data && res.data.length > 0) {
                var session = null;
                try { session = await window.auth.getSession(); } catch(e) {}
                var myId = session && session.user ? session.user.id : null;

                var board = res.data.map(function(row) {
                    var rank = getRankByNBP(row.nbp || 0);
                    return {
                        name: row.display_name || 'Kaşif',
                        weeklyXP: row.weekly_xp || 0,
                        rank: rank,
                        isUser: row.user_id === myId
                    };
                });

                // Kendimi bulamadıysam ekle
                var found = board.some(function(b) { return b.isUser; });
                if (!found && myId) {
                    var userData = null;
                    try { userData = JSON.parse(localStorage.getItem('kader_user_data')); } catch(e) {}
                    var myName = (userData && userData.name) ? userData.name : 'Sen';
                    board.push({ name: myName, weeklyXP: s.daily_xp_earned || 0, rank: getCurrentRank(), isUser: true });
                    board.sort(function(a, b) { return b.weeklyXP - a.weeklyXP; });
                }

                return board.slice(0, 20);
            }
        } catch(e) {
            console.warn('[Gamification] Leaderboard fetch failed, using local:', e);
        }

        // Fallback: simüle leaderboard (henüz DB'de kimse yokken)
        return getLeaderboardSimulated();
    }

    // Simüle leaderboard (offline / boş DB fallback)
    function getLeaderboardSimulated() {
        var s = getState();
        var today = todayStr();
        var seed = hashDate(today);

        var userData = null;
        try { userData = JSON.parse(localStorage.getItem('kader_user_data')); } catch(e) {}
        var myName = (userData && userData.name) ? userData.name : 'Sen';

        var names = ['Elif A.', 'Ahmet K.', 'Zeynep M.', 'Can B.', 'Ayşe T.', 'Emre Ö.', 'Selin Y.', 'Berk D.', 'Deniz G.', 'Nisa R.', 'Kaan S.', 'Ece F.', 'Mert Ç.', 'Defne H.', 'Yusuf İ.', 'İrem L.', 'Oğuz N.', 'Hira P.', 'Alp V.'];
        var league = getCurrentLeague();
        var baseXP = league.tier * 200;

        var board = names.map(function(n, i) {
            var xp = baseXP + Math.floor((seed * (i + 7)) % 500) + Math.floor(Math.random() * 50);
            var rIdx = Math.min(RANKS.length - 1, Math.floor(xp / 400));
            return { name: n, weeklyXP: xp, rank: RANKS[rIdx], isUser: false };
        });
        board.push({ name: myName, weeklyXP: s.daily_xp_earned + Math.floor(s.nbp * 0.1), rank: getCurrentRank(), isUser: true });
        board.sort(function(a, b) { return b.weeklyXP - a.weeklyXP; });
        return board.slice(0, 20);
    }

    // Senkron versiyon (eski uyumluluk)
    function getLeaderboard() {
        return getLeaderboardSimulated();
    }

    // Quiz sonucunu Supabase'e kaydet
    async function saveQuizResult(mode, correct, total, xp, duelWon) {
        try {
            if (!window.supabaseClient || !window.auth) return;
            var session = await window.auth.getSession();
            if (!session || !session.user) return;
            await window.supabaseClient.from('quiz_results').insert({
                user_id: session.user.id,
                mode: mode,
                correct_count: correct,
                total_count: total,
                xp_earned: xp,
                duel_won: duelWon
            });
        } catch(e) { console.warn('[Quiz] Save error:', e); }
    }

    // ═══════════════════════════════════════════════════════════
    // BAŞARIM / ROZET
    // ═══════════════════════════════════════════════════════════
    function checkBadges(s) {
        BADGES.forEach(function(badge) {
            if (s.unlocked_badges.indexOf(badge.id) === -1) {
                if (badge.condition(s)) {
                    s.unlocked_badges.push(badge.id);
                    s.pending_rewards.push({
                        type: 'badge_unlock',
                        badge: badge,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        });
    }

    function getUnlockedBadges() {
        var s = getState();
        return BADGES.filter(function(b) { return s.unlocked_badges.indexOf(b.id) !== -1; });
    }

    function getLockedBadges() {
        var s = getState();
        return BADGES.filter(function(b) { return s.unlocked_badges.indexOf(b.id) === -1; });
    }

    // ═══════════════════════════════════════════════════════════
    // ÖDÜL POPUP
    // ═══════════════════════════════════════════════════════════
    function showRewardPopup(reward) {
        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px);z-index:9500;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.3s';

        var colors = { legendary: '#f59e0b', epic: '#a855f7', rare: '#3b82f6', common: '#22c55e' };
        var bgColor = reward.color || colors[reward.rarity] || '#8b5cf6';

        var card = document.createElement('div');
        card.style.cssText = 'text-align:center;transform:scale(0.5);transition:transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';

        var title = '';
        var subtitle = '';
        if (reward.type === 'chest') {
            title = '🎁 Kozmik Sandık!';
            subtitle = reward.label;
        } else if (reward.type === 'rank_up') {
            title = '⭐ Rütbe Yükseldi!';
            subtitle = reward.name;
        } else if (reward.type === 'badge_unlock') {
            title = '🏆 Rozet Kazandın!';
            subtitle = reward.badge.name;
        } else {
            title = '🎉 Ödül!';
            subtitle = reward.label || reward.name || '';
        }

        card.innerHTML =
            '<div style="width:100px;height:100px;border-radius:50%;background:' + bgColor + ';display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 0 40px ' + bgColor + '60">' +
                '<span class="material-symbols-outlined" style="color:white;font-size:48px;font-variation-settings:\'FILL\' 1">' + (reward.icon || 'redeem') + '</span>' +
            '</div>' +
            '<h3 style="color:white;font-size:22px;font-weight:800;font-family:Space Grotesk,sans-serif;margin-bottom:8px">' + title + '</h3>' +
            '<p style="color:rgba(255,255,255,0.6);font-size:16px;font-family:Space Grotesk,sans-serif;font-weight:600">' + subtitle + '</p>' +
            '<button style="margin-top:24px;padding:12px 40px;border-radius:9999px;background:' + bgColor + ';color:white;font-weight:700;font-family:Space Grotesk,sans-serif;border:none;cursor:pointer;font-size:14px" onclick="this.closest(\'div[style*=fixed]\').remove()">Harika!</button>';

        overlay.appendChild(card);
        document.body.appendChild(overlay);
        setTimeout(function() { overlay.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 30);
    }

    // Bekleyen ödülleri göster
    function showPendingRewards() {
        var s = getState();
        if (!s.pending_rewards || s.pending_rewards.length === 0) return;

        var reward = s.pending_rewards.shift();
        saveState(s);
        showRewardPopup(reward);

        // Kalan ödüller 1.5s arayla
        if (s.pending_rewards.length > 0) {
            setTimeout(showPendingRewards, 1500);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // YARDIMCI
    // ═══════════════════════════════════════════════════════════
    function todayStr() { return new Date().toISOString().slice(0, 10); }
    function hashDate(d) { var h = 0; for (var i = 0; i < d.length; i++) { h = ((h << 5) - h) + d.charCodeAt(i); h |= 0; } return Math.abs(h); }
    function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h); }

    // ═══════════════════════════════════════════════════════════
    // SAYFA YÜKLENME
    // ═══════════════════════════════════════════════════════════
    function onPageLoad() {
        // Günlük giriş XP
        addXP('app_open', 0);
        // Görevleri oluştur
        getDailyQuests();
        // Supabase'den state çek
        loadFromSupabase();
        // Bekleyen ödülleri göster
        setTimeout(showPendingRewards, 800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', onPageLoad);
    } else {
        onPageLoad();
    }

    // ═══════════════════════════════════════════════════════════
    // GLOBAL EXPORT
    // ═══════════════════════════════════════════════════════════
    window.gamification = {
        // XP & Rütbe
        addXP: addXP,
        getState: getState,
        getRank: getCurrentRank,
        getNextRank: getNextRank,
        getRankProgress: getRankProgress,
        RANKS: RANKS,

        // Görünürlük
        getVisibility: getVisibilityMultiplier,
        getRadarSize: getRadarSize,
        getFrame: getProfileFrame,

        // Görevler
        getQuests: getDailyQuests,
        completeQuest: completeQuest,
        trackAction: trackAction,

        // Quiz
        getQuestion: getQuizQuestion,
        answerQuiz: answerQuiz,
        QUIZ_BANK: QUIZ_BANK,

        // Düello
        startDuel: startDuel,
        finishDuel: finishDuel,

        // Leaderboard
        getLeaderboard: getLeaderboard,
        getLeaderboardAsync: getLeaderboardAsync,
        getLeague: getCurrentLeague,
        LEAGUES: LEAGUES,

        // Rozetler
        getUnlockedBadges: getUnlockedBadges,
        getLockedBadges: getLockedBadges,
        BADGES: BADGES,

        // Ödüller
        showPendingRewards: showPendingRewards,
        showReward: showRewardPopup,

        // Supabase
        syncToSupabase: function() { syncToSupabase(getState()); },
        loadFromSupabase: loadFromSupabase,
        saveQuizResult: saveQuizResult,

        // Dev
        resetState: function() { localStorage.removeItem(STATE_KEY); window.location.reload(); },
        addNBP: function(n) { var s = getState(); s.nbp += n; s.total_xp += n; saveState(s); console.log('NBP:', s.nbp, 'Rank:', getRankByNBP(s.nbp).name); },
        XP_ACTIONS: XP_ACTIONS
    };

})();
