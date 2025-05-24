export class SpotifyAPI {
    constructor() {
        this.clientId = '527bc50d121141e2b7b6e27336211312';
        this.redirectUri = 'https://vivi315.netlify.app/';
        this.authEndpoint = 'https://accounts.spotify.com/authorize';
        this.tokenEndpoint = '/.netlify/functions/auth'; // Netlify function

        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        this.expirationTime = localStorage.getItem('expires_at');

        this.checkRedirectForCode();
    }

    // Redirect to Spotify login
    authorize() {
        const scope = 'user-read-private playlist-modify-public playlist-modify-private';
        const authUrl = `${this.authEndpoint}?client_id=${this.clientId}&response_type=code&redirect_uri=${encodeURIComponent(this.redirectUri)}&scope=${encodeURIComponent(scope)}`;
        window.location = authUrl;
    }

    // If redirected with a ?code, exchange for tokens
    async checkRedirectForCode() {
        const code = new URLSearchParams(window.location.search).get('code');
        if (code && !this.accessToken) {
            const response = await fetch(`${this.tokenEndpoint}?code=${code}`);
            const data = await response.json();

            this.accessToken = data.access_token;
            this.refreshToken = data.refresh_token;
            this.expirationTime = Date.now() + (data.expires_in * 1000);

            localStorage.setItem('access_token', this.accessToken);
            localStorage.setItem('refresh_token', this.refreshToken);
            localStorage.setItem('expires_at', this.expirationTime);

            // Clean URL
            window.history.replaceState({}, document.title, '/');

            document.dispatchEvent(new Event('spotify-authenticated'));
        }
    }

    // Check if user is logged in
    isAuthenticated() {
        return !!this.accessToken && Date.now() < this.expirationTime;
    }

    // Refresh the token if expired (OPTIONAL: if using refresh token flow)
    async refreshAccessToken() {
        const response = await fetch(`${this.tokenEndpoint}?refresh_token=${this.refreshToken}`);
        const data = await response.json();

        this.accessToken = data.access_token;
        this.expirationTime = Date.now() + (data.expires_in * 1000);

        localStorage.setItem('access_token', this.accessToken);
        localStorage.setItem('expires_at', this.expirationTime);
    }

    // Spotify API call with token check
    async fetchWithToken(url, options = {}) {
        if (!this.accessToken || Date.now() >= this.expirationTime) {
            throw new Error('Not authenticated');
        }

        const res = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });

        if (res.status === 401) {
            throw new Error('Authentication expired');
        }

        return res.json();
    }

    // Example API: search tracks
    async searchTracks(query) {
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
        return await this.fetchWithToken(url);
    }

    async getAudioFeatures(trackId) {
        return await this.fetchWithToken(`https://api.spotify.com/v1/audio-features/${trackId}`);
    }

    async getRecommendations(trackId, audioFeatures) {
        const url = `https://api.spotify.com/v1/recommendations?limit=10&seed_tracks=${trackId}&target_energy=${audioFeatures.energy}&target_valence=${audioFeatures.valence}`;
        return await this.fetchWithToken(url);
    }

    async createPlaylist(name, description) {
        const userData = await this.fetchWithToken('https://api.spotify.com/v1/me');
        const userId = userData.id;

        const url = `https://api.spotify.com/v1/users/${userId}/playlists`;
        const body = JSON.stringify({ name, description, public: false });

        return await this.fetchWithToken(url, { method: 'POST', body });
    }

    async addTracksToPlaylist(playlistId, uris) {
        const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
        const body = JSON.stringify({ uris });
        return await this.fetchWithToken(url, { method: 'POST', body });
    }

    logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.expirationTime = null;

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('expires_at');
    }
}
