/**
 * PROFILE & NUMEROLOGY MODULE
 * Profile loading/saving and Life Path Number calculations
 */

const profile = {
    // Load user profile
    async getProfile(userId) {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for no rows found
        return data;
    },

    // Save or update profile (full_name, birth_date)
    async updateProfile(userId, updates) {
        const { data, error } = await window.supabaseClient
            .from('profiles')
            .upsert({
                id: userId,
                ...updates,
                updated_at: new Date().toISOString(),
            });

        if (error) throw error;
        return data;
    },

    // Calculate Life Path Number
    // Sum all digits of the birth date until a single digit (or master number 11, 22) is reached
    calculateLifePathNumber(birthDateStr) {
        if (!birthDateStr) return null;

        const digits = birthDateStr.replace(/\D/g, '');
        let sum = digits.split('').reduce((acc, digit) => acc + parseInt(digit), 0);

        while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
            sum = sum.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
        }

        return sum;
    },

    // ─── CONNECTIONS (Other People) ────────────────────────────────

    // Helper to get storage key based on current user
    async getStorageKey() {
        const session = await window.auth.getSession();
        const userId = session ? session.user.id : 'guest';
        return `numerael_connections_${userId}`;
    },

    // Save a new connection (another person)
    async saveConnection(data) {
        const key = await this.getStorageKey();
        let connections = JSON.parse(localStorage.getItem(key) || '[]');

        // Veriyi zenginleştir
        const newConn = {
            id: Date.now().toString(),
            ...data,
            lifePath: this.calculateLifePathNumber(data.birthDate),
            createdAt: new Date().toISOString()
        };

        connections.push(newConn);
        localStorage.setItem(key, JSON.stringify(connections));
        return newConn;
    },

    // Get all connections
    async getConnections() {
        const key = await this.getStorageKey();
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    // Get connection by name (slugified or simple match)
    async getConnectionDetail(name) {
        const connections = await this.getConnections();
        return connections.find(c => c.fullName.toLowerCase().includes(name.toLowerCase())) || null;
    },

    // Delete connection by name
    async deleteConnection(fullName) {
        const key = await this.getStorageKey();
        let connections = JSON.parse(localStorage.getItem(key) || '[]');
        
        // Filter out the connection with matching name
        connections = connections.filter(c => c.fullName !== fullName);
        
        localStorage.setItem(key, JSON.stringify(connections));
        return true;
    },

    // Show loading spinner
    toggleLoading(show) {
        let loader = document.getElementById('supabase-loader');
        if (!loader && show) {
            loader = document.createElement('div');
            loader.id = 'supabase-loader';
            loader.innerHTML = `
                <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999;">
                    <div style="width:50px;height:50px;border:5px solid #fff;border-top:5px solid #6366f1;border-radius:50%;animation:spin 1s linear infinite;"></div>
                </div>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            `;
            document.body.appendChild(loader);
        } else if (loader && !show) {
            loader.remove();
        }
    }
};

window.profile = profile;
