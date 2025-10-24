// Minimal TMDB client that calls through Netlify function to hide API key
// All requests go through the Netlify serverless function

async function tmdbFetch(path, params = {}) {
	// Always use Netlify function proxy
	const url = new URL('/.netlify/functions/tmdb', window.location.origin);
	const searchParams = new URLSearchParams({ endpoint: path, ...params });
	url.search = searchParams.toString();
	
	const response = await fetch(url.toString());
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(`TMDB request failed ${response.status}: ${errorData.error}`);
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
