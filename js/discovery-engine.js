/**
 * NUMERAEL — Cosmic Match / Discovery Engine
 * Kullanıcıları numerolojik uyuma göre eşleştirir.
 * Streak sistemi, günlük match, reveal kredileri.
 */
(function() {
    'use strict';

    // ─── PISAGOR ─────────────────────────────────────────────
    var TABLE = {A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,'Ş':1,'Ç':3,'Ü':3,'Ö':6,'Ğ':7,'İ':9};
    var VOWELS = 'AEIOUİIÖÜ';

    function reduce(n) {
        if (n===11||n===22||n===33) return n;
        while(n>9){ n=String(n).split('').reduce(function(a,d){return a+parseInt(d);},0); if(n===11||n===22||n===33) break; }
        return n;
    }
    function calcLP(d) { if(!d) return 7; return reduce(d.replace(/\D/g,'').split('').reduce(function(a,x){return a+parseInt(x);},0)); }
    function calcExp(name) { var s=0,c=(name||'').toUpperCase().replace(/[^A-ZÇĞİIÖŞÜ]/g,''); for(var i=0;i<c.length;i++) s+=(TABLE[c[i]]||0); return reduce(s); }
    function calcSoul(name) { var s=0,c=(name||'').toUpperCase().replace(/[^A-ZÇĞİIÖŞÜ]/g,''); for(var i=0;i<c.length;i++){ if(VOWELS.includes(c[i])) s+=(TABLE[c[i]]||0); } return reduce(s); }
    function calcPers(name) { var s=0,c=(name||'').toUpperCase().replace(/[^A-ZÇĞİIÖŞÜ]/g,''); for(var i=0;i<c.length;i++){ if(!VOWELS.includes(c[i])) s+=(TABLE[c[i]]||0); } return reduce(s); }

    // ─── UYUM MATRİSİ ───────────────────────────────────────
    var CM = {'1-1':75,'1-2':85,'1-3':90,'1-4':65,'1-5':80,'1-6':70,'1-7':75,'1-8':85,'1-9':80,'2-2':80,'2-3':85,'2-4':90,'2-5':65,'2-6':95,'2-7':70,'2-8':60,'2-9':90,'3-3':75,'3-4':65,'3-5':90,'3-6':80,'3-7':70,'3-8':75,'3-9':85,'4-4':85,'4-5':60,'4-6':90,'4-7':80,'4-8':95,'4-9':70,'5-5':70,'5-6':75,'5-7':80,'5-8':65,'5-9':85,'6-6':85,'6-7':75,'6-8':80,'6-9':95,'7-7':75,'7-8':70,'7-9':85,'8-8':70,'8-9':75,'9-9':95,'11-11':95,'11-22':90,'11-33':92,'22-22':92,'22-33':95,'33-33':98,'1-11':85,'2-11':90,'3-11':88,'4-22':92,'6-33':95,'9-11':90,'9-33':95};

    function getScore(a, b) { var k=a<=b?a+'-'+b:b+'-'+a; return CM[k]||70; }

    function calcFullMatch(user, other) {
        var lp = getScore(user.life_path||7, other.life_path||7);
        var soul = getScore(user.soul_urge||5, other.soul_urge||5);
        var pers = getScore(user.personality_num||3, other.personality_num||3);
        var exp = getScore(user.expression_num||1, other.expression_num||1);
        return Math.round(lp*0.35 + soul*0.30 + pers*0.20 + exp*0.15);
    }

    // ─── ARKETIP ETİKETLERİ ──────────────────────────────────
    var ARCHETYPES = {1:'Lider',2:'Diplomat',3:'Yaratıcı',4:'Kurucu',5:'Kaşif',6:'Şifacı',7:'Mistik',8:'Güç',9:'Bilge',11:'İlhamcı',22:'Usta Mimar',33:'Öğretmen'};
    var BOND_LABELS = {95:'Kozmik Ruh İkizi',90:'Kaderin Birleştirdiği',85:'Yıldız Bağı',80:'Güçlü Rezonans',75:'Uyumlu Titreşim',70:'Potansiyel Bağ',0:'Keşfedilecek Enerji'};

    function bondLabel(score) {
        var keys = Object.keys(BOND_LABELS).map(Number).sort(function(a,b){return b-a;});
        for (var i=0;i<keys.length;i++) { if(score>=keys[i]) return BOND_LABELS[keys[i]]; }
        return 'Keşfedilecek Enerji';
    }

    // ─── STREAK SİSTEMİ ─────────────────────────────────────
    function todayStr() { return new Date().toISOString().slice(0,10); }
    function yesterdayStr() { var d=new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); }

    async function updateStreak(userId) {
        var today = todayStr();
        var sb = window.supabaseClient;

        // Mevcut streak'i al
        var streak = null;
        try {
            var res = await sb.from('user_streaks').select('*').eq('user_id', userId).single();
            streak = res.data;
        } catch(e) {}

        if (!streak) {
            // İlk ziyaret
            try {
                await sb.from('user_streaks').insert({
                    user_id: userId,
                    current_streak: 1,
                    longest_streak: 1,
                    last_visit_date: today,
                    reveal_credits: 0,
                    total_reveals: 0
                });
            } catch(e) { console.warn('[Streak] Insert error:', e); }
            return { current_streak: 1, longest_streak: 1, reveal_credits: 0, last_visit_date: today, total_reveals: 0 };
        }

        // Zaten bugün güncellenmişse
        if (streak.last_visit_date === today) return streak;

        var newStreak = 1;
        var credits = streak.reveal_credits || 0;

        if (streak.last_visit_date === yesterdayStr()) {
            // Ardışık gün
            newStreak = (streak.current_streak || 0) + 1;
            // Her 3 günde 1 reveal hakkı
            if (newStreak % 3 === 0) credits += 1;
        }
        // else: streak kırıldı, 1'den başla

        var longest = Math.max(newStreak, streak.longest_streak || 0);

        try {
            await sb.from('user_streaks').update({
                current_streak: newStreak,
                longest_streak: longest,
                last_visit_date: today,
                reveal_credits: credits,
                updated_at: new Date().toISOString()
            }).eq('user_id', userId);
        } catch(e) { console.warn('[Streak] Update error:', e); }

        return { current_streak: newStreak, longest_streak: longest, reveal_credits: credits, last_visit_date: today, total_reveals: streak.total_reveals || 0 };
    }

    // ─── OPT-IN: Profili Supabase'e kaydet ──────────────────
    async function optIn(userId) {
        var ud = null;
        try { ud = JSON.parse(localStorage.getItem('numerael_user_data')||'null'); } catch(e){}
        if (!ud || !ud.name) return false;

        var data = {
            user_id: userId,
            full_name: ud.name,
            birth_date: ud.birthDate || null,
            gender: ud.gender || 'unknown',
            life_path: calcLP(ud.birthDate),
            expression_num: calcExp(ud.name),
            soul_urge: calcSoul(ud.name),
            personality_num: calcPers(ud.name),
            discoverable: true,
            updated_at: new Date().toISOString()
        };

        try {
            await window.supabaseClient.from('discovery_profiles').upsert(data);
            localStorage.setItem('numerael_discovery_opted_in', 'true');
            return true;
        } catch(e) {
            console.error('[Discovery] Opt-in error:', e);
            return false;
        }
    }

    async function optOut(userId) {
        try {
            await window.supabaseClient.from('discovery_profiles').update({ discoverable: false }).eq('user_id', userId);
            localStorage.setItem('numerael_discovery_opted_in', 'false');
            return true;
        } catch(e) { return false; }
    }

    // ─── KEŞFEDİLEBİLİR PROFİLLERİ ÇEK ─────────────────────
    async function fetchDiscoverableProfiles(excludeUserId) {
        try {
            var res = await window.supabaseClient
                .from('discovery_profiles')
                .select('*')
                .eq('discoverable', true)
                .neq('user_id', excludeUserId);
            return res.data || [];
        } catch(e) {
            console.error('[Discovery] Fetch error:', e);
            return [];
        }
    }

    // ─── GÜNLÜK EŞLEŞME BUL ─────────────────────────────────
    async function findDailyMatch(userId, userProfile) {
        var today = todayStr();
        var sb = window.supabaseClient;

        // Bugünkü eşleşme var mı?
        try {
            var existing = await sb.from('daily_matches')
                .select('*')
                .eq('user_id', userId)
                .eq('match_date', today)
                .maybeSingle();

            if (existing.data && existing.data.matched_user_id) {
                // Eşleşen profili ayrı çek
                var profileRes = await sb.from('discovery_profiles')
                    .select('*')
                    .eq('user_id', existing.data.matched_user_id)
                    .maybeSingle();

                if (profileRes.data) {
                    existing.data.matched = profileRes.data;
                    return existing.data;
                }
            }
        } catch(e) { console.warn('[Match] Existing check error:', e); }

        // Yoksa yeni eşleşme hesapla
        var profiles = await fetchDiscoverableProfiles(userId);
        if (!profiles.length) return null;

        // Geçmiş eşleşmeleri al (son 30 gün tekrar etmesin)
        var pastIds = [];
        try {
            var pastRes = await sb.from('daily_matches')
                .select('matched_user_id')
                .eq('user_id', userId)
                .gte('match_date', new Date(Date.now() - 30*86400000).toISOString().slice(0,10));
            pastIds = (pastRes.data || []).map(function(r) { return r.matched_user_id; });
        } catch(e) {}

        // Skor hesapla ve sırala (görünürlük çarpanı ile)
        var scored = profiles.map(function(p) {
            var baseScore = calcFullMatch(userProfile, p);
            var visBoost = 0;
            try {
                if (p.current_streak && p.current_streak > 3) visBoost += 2;
                if (p.current_streak && p.current_streak > 7) visBoost += 3;
            } catch(e) {}
            return { profile: p, score: Math.min(99, baseScore + visBoost) };
        });
        scored.sort(function(a,b) { return b.score - a.score; });

        var visMultiplier = 1;
        if (window.gamification) {
            visMultiplier = window.gamification.getVisibility() || 1;
        }

        // Tercihen son 30 günde gösterilmemiş birini seç
        var match = null;
        for (var i=0; i<scored.length; i++) {
            if (pastIds.indexOf(scored[i].profile.user_id) === -1) {
                match = scored[i]; break;
            }
        }
        if (!match) match = scored[0];

        // Kaydet (upsert — aynı gün tekrar çağrılırsa çakışmasın)
        try {
            await sb.from('daily_matches').upsert({
                user_id: userId,
                matched_user_id: match.profile.user_id,
                match_score: match.score,
                match_date: today,
                revealed: false
            }, { onConflict: 'user_id,match_date' });
        } catch(e) { console.warn('[Match] Upsert error:', e); }

        return {
            matched_user_id: match.profile.user_id,
            match_score: match.score,
            match_date: today,
            revealed: false,
            matched: match.profile
        };
    }

    // ─── REVEAL (Eşleşme açma) ──────────────────────────────
    async function revealMatch(userId, matchDate) {
        var sb = window.supabaseClient;
        // Kredi kontrolü
        var streak = null;
        try {
            var res = await sb.from('user_streaks').select('*').eq('user_id', userId).single();
            streak = res.data;
        } catch(e) {}

        if (!streak || streak.reveal_credits < 1) return { success: false, reason: 'no_credits' };

        // Reveal yap
        try {
            await sb.from('daily_matches').update({ revealed: true })
                .eq('user_id', userId).eq('match_date', matchDate || todayStr());
            await sb.from('user_streaks').update({
                reveal_credits: streak.reveal_credits - 1,
                total_reveals: (streak.total_reveals || 0) + 1,
                updated_at: new Date().toISOString()
            }).eq('user_id', userId);
            return { success: true, credits_remaining: streak.reveal_credits - 1 };
        } catch(e) {
            return { success: false, reason: 'error' };
        }
    }

    // ─── TOP MATCHES (Radar) ─────────────────────────────────
    async function getTopMatches(userId, userProfile, limit) {
        var profiles = await fetchDiscoverableProfiles(userId);
        if (!profiles.length) return [];

        var scored = profiles.map(function(p) {
            return { profile: p, score: calcFullMatch(userProfile, p) };
        });
        scored.sort(function(a,b) { return b.score - a.score; });
        return scored.slice(0, limit || 10);
    }

    // ─── GEÇMIŞ EŞLEŞMELER ──────────────────────────────────
    async function getMatchHistory(userId, limit) {
        try {
            var res = await window.supabaseClient
                .from('daily_matches')
                .select('*')
                .eq('user_id', userId)
                .order('match_date', { ascending: false })
                .limit(limit || 20);

            var matches = res.data || [];

            // Eşleşen profilleri toplu çek
            var matchedIds = matches.map(function(m) { return m.matched_user_id; }).filter(Boolean);
            if (matchedIds.length > 0) {
                var profilesRes = await window.supabaseClient
                    .from('discovery_profiles')
                    .select('*')
                    .in('user_id', matchedIds);

                var profileMap = {};
                (profilesRes.data || []).forEach(function(p) { profileMap[p.user_id] = p; });
                matches.forEach(function(m) { m.matched = profileMap[m.matched_user_id] || null; });
            }

            return matches;
        } catch(e) { return []; }
    }

    // ─── GLOBAL EXPORT ───────────────────────────────────────
    window.discovery = {
        // Hesaplama
        calcLP: calcLP,
        calcExp: calcExp,
        calcSoul: calcSoul,
        calcPers: calcPers,
        calcFullMatch: calcFullMatch,
        bondLabel: bondLabel,
        ARCHETYPES: ARCHETYPES,

        // Streak
        updateStreak: updateStreak,
        todayStr: todayStr,

        // Opt-in/out
        optIn: optIn,
        optOut: optOut,

        // Eşleşme
        findDailyMatch: findDailyMatch,
        revealMatch: revealMatch,
        getTopMatches: getTopMatches,
        getMatchHistory: getMatchHistory,
        fetchDiscoverableProfiles: fetchDiscoverableProfiles
    };

})();
