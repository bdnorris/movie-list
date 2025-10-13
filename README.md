# Movie Night Helper

A minimal Vue + Vite app to search The Movie Database (TMDB) and build a quick, temporary list of movies to watch. No persistence; lists exist only in memory.

## Setup

1. Create an `.env` file based on `.env.example` and add your TMDB API key:

```
VITE_TMDB_API_KEY=YOUR_KEY_HERE
```

2. Install dependencies and run the dev server:

```
npm install
npm run dev
```

## Features

- Search for movies by title
- See results with posters and overviews
- Add selected movies to a temporary list showing:
  - name, year, synopsis, score, and trailer link
- Remove items from the list

## Notes

- Trailers are resolved from TMDB videos; YouTube links are preferred when available.
- This project uses Vite env variables prefixed with `VITE_` accessible via `import.meta.env`.
