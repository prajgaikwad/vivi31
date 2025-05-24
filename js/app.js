const fetch = require('node-fetch');
require('dotenv').config();

exports.handler = async function(event, context) {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirect_uri = 'https://vivi315.netlify.app/';

  // Exchange authorization code for tokens
  if (event.queryStringParameters.code) {
    const code = event.queryStringParameters.code;
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirect_uri);
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Token exchange failed', details: err.message })
      };
    }
  }

  // Refresh token flow
  if (event.queryStringParameters.refresh_token) {
    const refresh_token = event.queryStringParameters.refresh_token;
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refresh_token);
    params.append('client_id', client_id);
    params.append('client_secret', client_secret);

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json();
      return {
        statusCode: 200,
        body: JSON.stringify(data)
      };
    } catch (err) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Refresh token failed', details: err.message })
      };
    }
  }

  // Fallback if neither code nor refresh_token provided
  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Missing code or refresh_token' })
  };
};
