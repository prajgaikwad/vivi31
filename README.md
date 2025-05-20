# vivi31 - Music Recommendation App

vivi31 is a web application that generates personalized music recommendations based on a single song input. Using the Spotify Web API, it analyzes audio features and metadata to create a curated playlist of similar tracks.

## Features

- 🎵 Search for any song on Spotify
- 🔍 Analyze audio features of the selected track
- 🎧 Generate recommendations based on sonic similarity
- 💾 Save recommendations as a Spotify playlist
- 📱 Responsive design for all devices

## How It Works

1. User authenticates with their Spotify account
2. User searches and selects a "seed" track
3. App fetches audio features (tempo, energy, danceability, etc.) of the selected track
4. App requests recommendations from Spotify API based on these features
5. User can save the recommendations as a new playlist on their Spotify account

## Technical Details

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **API**: Spotify Web API
- **Authentication**: OAuth 2.0 (via serverless function)
- **Hosting**: Netlify (with serverless functions)

## Setup and Development

### Prerequisites

- Spotify Developer Account
- Node.js and npm (for serverless functions)
- Netlify CLI (optional for local development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/vivi31.git
   cd vivi31
   ```

2. Create a Spotify Application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)

3. Add your Spotify Client ID to `js/spotify.js`:
   ```javascript
   this.clientId = 'YOUR_CLIENT_ID';
   ```

4. For local development with Netlify functions:
   ```bash
   npm install -g netlify-cli
   netlify dev
   ```

5. Set up environment variables in Netlify:
   - SPOTIFY_CLIENT_ID
   - SPOTIFY_CLIENT_SECRET

### Deployment

1. Connect your GitHub repository to Netlify
2. Configure the build settings as specified in `netlify.toml`
3. Set the environment variables in the Netlify dashboard
4. Deploy!

## License

MIT License

## Acknowledgements

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/)
- [Font Awesome](https://fontawesome.com/) for icons