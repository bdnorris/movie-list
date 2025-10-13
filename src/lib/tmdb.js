// Minimal TMDB client for searching and fetching details
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function getApiKey() {
	const key = import.meta.env.VITE_TMDB_API_KEY;
	if (!key) {
		throw new Error('Missing VITE_TMDB_API_KEY. Set it in your .env file.');
	}
	return key;
}

async function tmdbFetch(path, params = {}) {
	const url = new URL(`${TMDB_BASE_URL}${path}`);
	const searchParams = new URLSearchParams({ api_key: getApiKey(), include_adult: 'false', language: 'en-US', ...params });
	url.search = searchParams.toString();

	const response = await fetch(url.toString());
	if (!response.ok) {
		const text = await response.text().catch(() => '');
		throw new Error(`TMDB request failed ${response.status}: ${text}`);
	}
	return response.json();
}

export async function searchMovies(query) {
	if (!query || !query.trim()) return [];
	const data = await tmdbFetch('/search/movie', { query });
	return Array.isArray(data.results) ? data.results : [];
}

export async function getMovieDetails(movieId) {
	if (!movieId) throw new Error('movieId is required');
	return tmdbFetch(`/movie/${movieId}`);
}

export async function getMovieTrailerUrl(movieId) {
	if (!movieId) throw new Error('movieId is required');
	const data = await tmdbFetch(`/movie/${movieId}/videos`);
	const videos = Array.isArray(data.results) ? data.results : [];
	const trailer = videos.find(v => (v.type === 'Trailer') && (v.site === 'YouTube'))
		|| videos.find(v => v.site === 'YouTube');
	if (trailer && trailer.key) {
		return `https://www.youtube.com/watch?v=${trailer.key}`;
	}
	return '';
}

export function getPosterUrl(path, size = 'w185') {
	if (!path) return '';
	return `https://image.tmdb.org/t/p/${size}${path}`;
}
