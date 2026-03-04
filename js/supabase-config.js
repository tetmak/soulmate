try {
    var SUPABASE_URL = 'https://cxkyyifqxbwidseofbgk.supabase.co';
    var SUPABASE_ANON_KEY = 'sb_publishable_zjI0OggICM4s7wz0xpq2WA_Q_6JAHbN';

    if (window.supabase) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: 'numerael-auth-token',
                storage: window.localStorage
            }
        });
    } else {
        console.warn('[Supabase] SDK yuklenemedi');
        window.supabaseClient = null;
    }
} catch(e) {
    console.warn('[Supabase] Baglanti hatasi:', e);
    window.supabaseClient = null;
}

// Global AI auth helper — tüm /api/openai çağrıları için
(function() {
    var _cachedSession = null;
    window.__getAiAuthHeaders = async function() {
        var headers = { 'Content-Type': 'application/json' };
        try {
            if (!_cachedSession && window.supabaseClient) {
                var res = await window.supabaseClient.auth.getSession();
                if (res && res.data && res.data.session) {
                    _cachedSession = res.data.session;
                }
            }
            if (_cachedSession && _cachedSession.access_token) {
                headers['Authorization'] = 'Bearer ' + _cachedSession.access_token;
            }
        } catch(e) { /* auth not available yet */ }
        return headers;
    };
})();
