class SpotifyAPI {
    constructor() {
        this.clientId = '527bc50d121141e2b7b6e27336211312'; // Your Spotify Client ID
        this.redirectUri = 'https://vivi315.netlify.app/';
        this.accessToken = null;
        this.tokenExpirationTime = 0;
        this.endpoints = {
            authorize: 'https://accounts.spotify.com/authorize',
            token: 'https://accounts.spotify.com/api/token',
            search: 'https://api.spotify.com/v1/search',
            audioFeatures: 'https://api.spotify.com/v1/audio-features',
            recommendations: 'https://api.spotify.com/v1/recommendations',
            createPlaylist: 'https://api.spotify.com/v1/users/me/playlists',
            addTracks: (playlistId) => `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            me: 'https://api.spotify.com/v1/me'
        };
        this.scopes = [
            'user-read-private',
            'playlist-modify-public',
            'playlist-modify-private'
        ];
        this.init();
    }

    init() {
        // Check if returning from auth flow with a code
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // Add loading indicator here if possible
            console.log("Auth code detected, processing...");
            this.fetchAccessToken(code)
                .then(success => {
                    console.log("Token fetch completed, success:", success);
                    if (success) {
                        // Dispatch an event to notify the app that authentication is successful
                        const event = new CustomEvent('spotify-authenticated');
                        document.dispatchEvent(event);
                    }
                })
                .catch(err => console.error("Token fetch error:", err));
            
            // Clean up URL
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        } else {
            // Check for stored token
            this.loadTokenFromStorage();
        }
    }

    authorize() {
        const authUrl = new URL(this.endpoints.authorize);
        const params = {
            client_id: this.clientId,
            response_type: 'code',
            redirect_uri: this.redirectUri,
            scope: this.scopes.join(' '),
            show_dialog: true
        };

        authUrl.search = new URLSearchParams(params).toString();
        window.location.href = authUrl.toString();
    }

    async fetchAccessToken(code) {
        try {
            console.log("Exchanging code for token...");
            // Using our serverless function for token exchange
            const response = await fetch('/.netlify/functions/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code: code,
                    redirectUri: this.redirectUri
                })
            });

            console.log("Token exchange response status:", response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Token exchange failed:", errorText);
                throw new Error('Failed to fetch access token');
            }

            const data = await response.json();
            console.log("Token received successfully!");
            this.accessToken = data.access_token;
            this.tokenExpirationTime = Date.now() + (data.expires_in * 1000);
            
            // Store token in localStorage
            this.saveTokenToStorage();
            
            return true;
        } catch (error) {
            console.error('Error fetching access token:', error);
            return false;
        }
    }

    saveTokenToStorage() {
        localStorage.setItem('spotify_access_token', this.accessToken);
        localStorage.setItem('spotify_token_expiration', this.tokenExpirationTime);
    }

    loadTokenFromStorage() {
        this.accessToken = localStorage.getItem('spotify_access_token');
        const expirationTime = localStorage.getItem('spotify_token_expiration');
        
        if (this.accessToken && expirationTime) {
            this.tokenExpirationTime = parseInt(expirationTime);
            
            // Check if token is expired
            if (Date.now() > this.tokenExpirationTime) {
                this.logout();
                return false;
            }
            return true;
        }
        return false;
    }

    logout() {
        this.accessToken = null;
        this.tokenExpirationTime = 0;
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_token_expiration');
    }

    isAuthenticated() {
        return this.accessToken !== null && Date.now() < this.tokenExpirationTime;
    }

    async makeRequest(url, method = 'GET', body = null) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const headers = {
            'Authorization': `Bearer ${this.accessToken}`
        };

        if (body && method !== 'GET') {
            headers['Content-Type'] = 'application/json';
        }

        const options = {
            method,
            headers
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired
                this.logout();
                throw new Error('Authentication expired');
            }
            throw new Error(`API request failed with status ${response.status}`);
        }

        return await response.json();
    }

    async searchTracks(query, limit = 10) {
        const url = new URL(this.endpoints.search);
        const params = {
            q: query,
            type: 'track',
            limit: limit
        };
        url.search = new URLSearchParams(params).toString();
        
        return await this.makeRequest(url.toString());
    }

    async getAudioFeatures(trackId) {
        const url = `${this.endpoints.audioFeatures}/${trackId}`;
        return await this.makeRequest(url);
    }

    async getRecommendations(seedTrackId, audioFeatures, limit = 15) {
        const url = new URL(this.endpoints.recommendations);
        
        // Create parameters based on the audio features of the seed track
        const params = {
            seed_tracks: seedTrackId,
            limit: limit,
            target_danceability: audioFeatures.danceability,
            target_energy: audioFeatures.energy,
            target_key: audioFeatures.key,
            target_loudness: audioFeatures.loudness,
            target_mode: audioFeatures.mode,
            target_speechiness: audioFeatures.speechiness,
            target_acousticness: audioFeatures.acousticness,
            target_instrumentalness: audioFeatures.instrumentalness,
            target_liveness: audioFeatures.liveness,
            target_valence: audioFeatures.valence,
            target_tempo: audioFeatures.tempo
        };
        
        url.search = new URLSearchParams(params).toString();
        return await this.makeRequest(url.toString());
    }

    async getUserProfile() {
        return await this.makeRequest(this.endpoints.me);
    }

    async createPlaylist(name, description = '', isPublic = true) {
        const user = await this.getUserProfile();
        
        const body = {
            name: name,
            description: description,
            public: isPublic
        };
        
        return await this.makeRequest(this.endpoints.createPlaylist, 'POST', body);
    }

    async addTracksToPlaylist(playlistId, trackUris) {
        const url = this.endpoints.addTracks(playlistId);
        const body = {
            uris: trackUris
        };
        
        return await this.makeRequest(url, 'POST', body);
    }
}