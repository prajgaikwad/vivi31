document.addEventListener('DOMContentLoaded', () => {
    const spotify = new SpotifyAPI();
    
    // DOM Elements
    const loginContainer = document.getElementById('login-container');
    const searchContainer = document.getElementById('search-container');
    const selectedTrackContainer = document.getElementById('selected-track');
    const recommendationsContainer = document.getElementById('recommendations');
    const playlistSavedContainer = document.getElementById('playlist-saved');
    const loadingIndicator = document.getElementById('loading');
    
    // Buttons
    const loginButton = document.getElementById('login-button');
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const getRecommendationsButton = document.getElementById('get-recommendations');
    const savePlaylistButton = document.getElementById('save-playlist');
    const newSearchButton = document.getElementById('new-search');
    const openPlaylistButton = document.getElementById('open-playlist');
    
    // App State
    let selectedTrack = null;
    let recommendedTracks = [];
    
    // Initialize UI
    initUI();
     document.addEventListener('spotify-authenticated', () => {
        console.log("Authentication event received, updating UI");
        showLoggedInUI();
    });
    
    // Event Listeners
    loginButton.addEventListener('click', handleLogin);
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    getRecommendationsButton.addEventListener('click', handleGetRecommendations);
    savePlaylistButton.addEventListener('click', handleSavePlaylist);
    newSearchButton.addEventListener('click', handleNewSearch);
    
    function initUI() {
        if (spotify.isAuthenticated()) {
            showLoggedInUI();
        } else {
            showLoggedOutUI();
        }
    }
    
    function showLoggedInUI() {
        loginContainer.classList.add('hidden');
        searchContainer.classList.remove('hidden');
    }
    
    function showLoggedOutUI() {
        loginContainer.classList.remove('hidden');
        searchContainer.classList.add('hidden');
        selectedTrackContainer.classList.add('hidden');
        recommendationsContainer.classList.add('hidden');
        playlistSavedContainer.classList.add('hidden');
    }
    
    function showLoading() {
        loadingIndicator.classList.remove('hidden');
    }
    
    function hideLoading() {
        loadingIndicator.classList.add('hidden');
    }
    
    async function handleLogin() {
        spotify.authorize();
    }
    
    async function handleSearch() {
        const query = searchInput.value.trim();
        if (!query) return;
        
        try {
            showLoading();
            const result = await spotify.searchTracks(query);
            displaySearchResults(result.tracks.items);
        } catch (error) {
            console.error('Search error:', error);
            if (error.message === 'Not authenticated' || error.message === 'Authentication expired') {
                handleAuthError();
            }
        } finally {
            hideLoading();
        }
    }
    
    function displaySearchResults(tracks) {
        searchResults.innerHTML = '';
        
        if (tracks.length === 0) {
            searchResults.innerHTML = '<p class="no-results">No tracks found. Try a different search.</p>';
            return;
        }
        
        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.className = 'track-item';
            trackElement.innerHTML = `
                <img class="track-image" src="${track.album.images[2]?.url || 'https://via.placeholder.com/50'}" alt="${track.name}">
                <div class="track-details">
                    <div class="track-name">${track.name}</div>
                    <div class="track-artist">${track.artists.map(artist => artist.name).join(', ')}</div>
                </div>
            `;
            
            trackElement.addEventListener('click', () => selectTrack(track));
            searchResults.appendChild(trackElement);
        });
    }
    
    function selectTrack(track) {
        selectedTrack = track;
        
        const trackInfoElement = selectedTrackContainer.querySelector('.track-info');
        trackInfoElement.innerHTML = `
            <img class="track-image" src="${track.album.images[1]?.url || 'https://via.placeholder.com/150'}" alt="${track.name}">
            <div class="track-details">
                <div class="track-name">${track.name}</div>
                <div class="track-artist">${track.artists.map(artist => artist.name).join(', ')}</div>
                <div class="track-album">${track.album.name}</div>
            </div>
        `;
        
        selectedTrackContainer.classList.remove('hidden');
        recommendationsContainer.classList.add('hidden');
        playlistSavedContainer.classList.add('hidden');
        
        // Scroll to selected track section
        selectedTrackContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    async function handleGetRecommendations() {
        if (!selectedTrack) return;
        
        try {
            showLoading();
            
            // Get audio features of the selected track
            const audioFeatures = await spotify.getAudioFeatures(selectedTrack.id);
            
            // Get recommendations based on audio features
            const recommendations = await spotify.getRecommendations(selectedTrack.id, audioFeatures);
            
            recommendedTracks = recommendations.tracks;
            displayRecommendations(recommendedTracks);
        } catch (error) {
            console.error('Recommendations error:', error);
            if (error.message === 'Not authenticated' || error.message === 'Authentication expired') {
                handleAuthError();
            }
        } finally {
            hideLoading();
        }
    }
    
    function displayRecommendations(tracks) {
        const recommendationsListElement = recommendationsContainer.querySelector('.recommendations-list');
        recommendationsListElement.innerHTML = '';
        
        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.className = 'recommendation-card';
            trackElement.innerHTML = `
                <img src="${track.album.images[1]?.url || 'https://via.placeholder.com/200'}" alt="${track.name}">
                <div class="recommendation-info">
                    <div class="track-name">${track.name}</div>
                    <div class="track-artist">${track.artists.map(artist => artist.name).join(', ')}</div>
                </div>
            `;
            
            // Add click event to play preview if available
            if (track.preview_url) {
                trackElement.addEventListener('click', () => {
                    window.open(track.preview_url, '_blank');
                });
                trackElement.style.cursor = 'pointer';
            }
            
            recommendationsListElement.appendChild(trackElement);
        });
        
        recommendationsContainer.classList.remove('hidden');
        
        // Scroll to recommendations section
        recommendationsContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    async function handleSavePlaylist() {
        if (recommendedTracks.length === 0) return;
        
        try {
            showLoading();
            
            // Create a new playlist
            const playlistName = `vivi31: Similar to ${selectedTrack.name}`;
            const playlistDescription = `Tracks similar to ${selectedTrack.name} by ${selectedTrack.artists[0].name}. Generated by vivi31.`;
            
            const playlist = await spotify.createPlaylist(playlistName, playlistDescription);
            
            // Add the original track and recommended tracks to the playlist
            const trackUris = [selectedTrack.uri, ...recommendedTracks.map(track => track.uri)];
            await spotify.addTracksToPlaylist(playlist.id, trackUris);
            
            // Show success message
            playlistSavedContainer.classList.remove('hidden');
            openPlaylistButton.href = playlist.external_urls.spotify;
            
            // Scroll to playlist saved section
            playlistSavedContainer.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Save playlist error:', error);
            if (error.message === 'Not authenticated' || error.message === 'Authentication expired') {
                handleAuthError();
            }
        } finally {
            hideLoading();
        }
    }
    
    function handleNewSearch() {
        // Clear search input and results
        searchInput.value = '';
        searchResults.innerHTML = '';
        
        // Hide sections
        selectedTrackContainer.classList.add('hidden');
        recommendationsContainer.classList.add('hidden');
        playlistSavedContainer.classList.add('hidden');
        
        // Show search section
        searchContainer.classList.remove('hidden');
        
        // Reset state
        selectedTrack = null;
        recommendedTracks = [];
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function handleAuthError() {
        spotify.logout();
        showLoggedOutUI();
        alert('Your session has expired. Please log in again.');
    }
});