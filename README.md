# Movie Night Helper

A minimal Vue + Vite app to search The Movie Database (TMDB) and build a quick list of movies to watch. Lists are saved in localStorage and persist across sessions.

## Features

- Search for movies by title
- See results with posters and overviews
- Add selected movies to a watchlist showing:
  - name, year, synopsis, score, and trailer link
- Remove items from the list
- Copy the list as HTML for emails
- Clear the entire list
- Persistent storage via localStorage

## Local Development Setup

The app uses Netlify Functions for all API calls, so you'll need to run it with Netlify CLI to test locally.

1. Create an `.env` file with your TMDB API key:

```
TMDB_API_KEY=YOUR_KEY_HERE
```

2. Install dependencies:

```
npm install
```

3. Install Netlify CLI globally (if you haven't already):

```
npm install -g netlify-cli
```

4. Run the dev server with Netlify CLI:

```
netlify dev
```

This will start both the Vite dev server and the Netlify function locally.

## Deploying to Netlify

The app uses a Netlify serverless function to proxy TMDB API requests, keeping your API key secure.

### Deploy Steps

1. **Push to GitHub** (or GitLab/Bitbucket)

2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com) and sign in
   - Click "Add new site" → "Import an existing project"
   - Connect your repository

3. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
   
   (These should be auto-detected from `netlify.toml`)

4. **Add Environment Variable**:
   - In Netlify dashboard: Site settings → Environment variables
   - Add: `TMDB_API_KEY` = `YOUR_KEY_HERE`
   - **Important**: Use `TMDB_API_KEY` (not `VITE_TMDB_API_KEY`) for the Netlify function

5. **Deploy**: Netlify will build and deploy automatically

### How It Works

- All API calls (local and production) go through `/.netlify/functions/tmdb`
- The serverless function uses `TMDB_API_KEY` from environment variables
- Your API key never appears in client-side code or build output

## Notes

- Trailers are resolved from TMDB videos; YouTube links are preferred when available.
- Lists persist in browser localStorage (not synced across devices).
