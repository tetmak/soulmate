try {
    var SUPABASE_URL = 'https://cxkyyifqxbwidseofbgk.supabase.co';
    var SUPABASE_ANON_KEY = 'sb_publishable_zjI0OggICM4s7wz0xpq2WA_Q_6JAHbN';

    if (window.supabase) {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                storageKey: 'kader-auth-token',
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
