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

1. Create an `.env` file based on `.env.example` and add your TMDB API key:

```
VITE_TMDB_API_KEY=YOUR_KEY_HERE
```

2. Install dependencies and run the dev server:

```
npm install
npm run dev
```

In local dev mode, the app calls TMDB API directly using your key from `.env`.

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

- **Local dev**: Uses `VITE_TMDB_API_KEY` from `.env` to call TMDB directly
- **Production**: Calls `/.netlify/functions/tmdb` which uses `TMDB_API_KEY` from Netlify env vars
- The serverless function proxies requests to TMDB, keeping your API key hidden from the client

### Testing Netlify Function Locally

Install Netlify CLI and run:

```bash
npm install -g netlify-cli
netlify dev
```

Set `TMDB_API_KEY` in your `.env` file and the Netlify CLI will run the function locally.

## Notes

- Trailers are resolved from TMDB videos; YouTube links are preferred when available.
- Lists persist in browser localStorage (not synced across devices).
