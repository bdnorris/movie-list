<script setup>
import { ref, computed, onMounted } from 'vue';
import { searchMovies, getMovieDetails, getMovieTrailerUrl, getPosterUrl } from './lib/tmdb';

const query = ref('');
const isSearching = ref(false);
const searchError = ref('');
const results = ref([]);

const watchlist = ref([]);

// Load from localStorage on mount
onMounted(() => {
	try {
		const saved = localStorage.getItem('movie-watchlist');
		if (saved) {
			watchlist.value = JSON.parse(saved);
		}
	} catch (e) {
		console.warn('Failed to load watchlist from localStorage:', e);
	}
});

// Save to localStorage whenever watchlist changes
function saveWatchlist() {
	try {
		localStorage.setItem('movie-watchlist', JSON.stringify(watchlist.value));
	} catch (e) {
		console.warn('Failed to save watchlist to localStorage:', e);
	}
}

async function runSearch() {
	searchError.value = '';
	isSearching.value = true;
	results.value = [];
	try {
		const items = await searchMovies(query.value);
		results.value = items;
	} catch (err) {
		searchError.value = err instanceof Error ? err.message : String(err);
	} finally {
		isSearching.value = false;
	}
}

async function addToList(result) {
	try {
		const [details, trailerUrl] = await Promise.all([
			getMovieDetails(result.id),
			getMovieTrailerUrl(result.id)
		]);
		const year = (details.release_date || '').slice(0, 4);
		watchlist.value.unshift({
			id: details.id,
			name: details.title,
			year,
			synopsis: details.overview || '',
			score: typeof details.vote_average === 'number' ? Math.round(details.vote_average * 10) / 10 : '',
			trailerUrl,
			poster: getPosterUrl(details.poster_path, 'w185')
		});
		saveWatchlist();
	} catch (err) {
		alert(err instanceof Error ? err.message : String(err));
	}
}

function removeFromList(id) {
	watchlist.value = watchlist.value.filter(m => m.id !== id);
	saveWatchlist();
}

function clearList() {
	if (confirm('Clear the entire watchlist?')) {
		watchlist.value = [];
		saveWatchlist();
	}
}

const canSearch = computed(() => query.value.trim().length > 0 && !isSearching.value);

function escapeHtml(str) {
	return String(str)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

function buildListHtml(items) {
	const li = items.map(m => {
		const title = escapeHtml(m.name || '');
		const year = m.year ? ` <span>(${escapeHtml(m.year)})</span>` : '';
		const score = m.score !== '' ? ` <span>⭐ ${escapeHtml(String(m.score))}</span>` : '';
		const synopsis = m.synopsis ? `<div>${escapeHtml(m.synopsis)}</div>` : '';
		const trailer = m.trailerUrl ? `<div><a href="${escapeHtml(m.trailerUrl)}">Watch trailer</a></div>` : '';
		return `<li><div><strong>${title}</strong>${year}${score}</div>${synopsis}${trailer}</li>`;
	}).join('');
	return `<ul>${li}</ul>`;
}

async function copyListHtml() {
	if (!watchlist.value.length) {
		return;
	}
	const html = buildListHtml(watchlist.value);

	// Try modern clipboard API first
	try {
		if (navigator.clipboard && window.ClipboardItem) {
			const htmlBlob = new Blob([html], { type: 'text/html' });
			const textBlob = new Blob([html], { type: 'text/plain' });
			await navigator.clipboard.write([
				new ClipboardItem({
					'text/html': htmlBlob,
					'text/plain': textBlob
				})
			]);
			alert('List HTML copied to clipboard');
			return;
		}
	} catch (e) {
		console.log('ClipboardItem failed, trying fallback:', e);
	}

	// Fallback: create temporary textarea and select/copy
	try {
		const textarea = document.createElement('textarea');
		textarea.value = html;
		textarea.style.position = 'fixed';
		textarea.style.left = '-9999px';
		textarea.style.top = '-9999px';
		document.body.appendChild(textarea);
		textarea.select();
		textarea.setSelectionRange(0, 99999); // For mobile

		const successful = document.execCommand('copy');
		document.body.removeChild(textarea);

		if (successful) {
			alert('List HTML copied to clipboard');
		} else {
			throw new Error('execCommand failed');
		}
	} catch (err) {
		console.error('Copy failed:', err);
		alert('Copy failed. Please select and copy manually from the console or try a different browser.');
	}
}
</script>

<template>
	<div class="container">
		<header class="app-header">
			<div class="brand">
				<div class="brand-mark" aria-hidden="true">
					<svg viewBox="0 0 52 34" xmlns="http://www.w3.org/2000/svg">
						<path d="M5 1 H23 A3 3 0 0 0 29 1 H47 A4 4 0 0 1 51 5 V12 A3 3 0 0 0 51 22 V29 A4 4 0 0 1 47 33 H29 A3 3 0 0 0 23 33 H5 A4 4 0 0 1 1 29 V22 A3 3 0 0 0 1 12 V5 A4 4 0 0 1 5 1 Z"
							  fill="oklch(0.55 0.20 25)"
							  stroke="oklch(0.82 0.135 85)"
							  stroke-width="1.1" />
						<line x1="26" y1="6" x2="26" y2="28" stroke="oklch(0.82 0.135 85)" stroke-width="1.1" stroke-dasharray="1.5 2.4" opacity="0.95" />
						<path d="M13.5 11.5 l1.55 3.15 l3.45 0.5 l-2.5 2.45 l0.6 3.45 l-3.1 -1.65 l-3.1 1.65 l0.6 -3.45 l-2.5 -2.45 l3.45 -0.5 z" fill="oklch(0.85 0.14 85)" />
						<g fill="oklch(0.85 0.14 85)">
							<rect x="33" y="11" width="1.2" height="12" />
							<rect x="35.6" y="11" width="0.8" height="12" />
							<rect x="37.6" y="11" width="1.4" height="12" />
							<rect x="40" y="11" width="0.8" height="12" />
							<rect x="42" y="11" width="1.2" height="12" />
							<rect x="44.4" y="11" width="0.8" height="12" />
						</g>
					</svg>
				</div>
				<h1>Movie <em>Night</em> Helper</h1>
			</div>
		</header>

		<form class="search" @submit.prevent="runSearch">
			<div class="search-input-wrap">
				<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>
				<input
					type="text"
					v-model="query"
					placeholder="Search movies (e.g., Inception)"
					aria-label="Search movies"
				/>
			</div>
			<button type="submit" :disabled="!canSearch">{{ isSearching ? 'Searching…' : 'Search' }}</button>
		</form>
		<p v-if="searchError" class="error">{{ searchError }}</p>

		<div class="results" v-if="results.length">
			<h2>Results</h2>
			<ul>
				<li v-for="r in results" :key="r.id" class="result">
					<img v-if="r.poster_path" :src="getPosterUrl(r.poster_path)" alt="" />
					<div v-else class="poster-fallback" aria-hidden="true"></div>
					<div class="meta">
						<div class="title">{{ r.title }} <span v-if="r.release_date">{{ r.release_date.slice(0,4) }}</span></div>
						<div class="overview" v-if="r.overview">{{ r.overview }}</div>
					</div>
					<button class="add-btn" @click="addToList(r)">+ Add</button>
				</li>
			</ul>
		</div>

		<div class="watchlist" v-if="watchlist.length">
			<div class="watchlist-header">
				<h2>Quick List</h2>
				<div class="watchlist-actions">
					<button class="copy" @click="copyListHtml">Copy list HTML</button>
					<button class="clear" @click="clearList">Clear list</button>
				</div>
			</div>
			<ul>
				<li v-for="m in watchlist" :key="m.id" class="card">
					<img v-if="m.poster" :src="m.poster" alt="" />
					<div v-else class="poster-fallback" aria-hidden="true"></div>
					<div class="content">
						<div class="header">
							<strong>{{ m.name }}</strong>
							<span v-if="m.year" class="year">{{ m.year }}</span>
							<span v-if="m.score !== ''" class="score">★ {{ m.score }}</span>
						</div>
						<p v-if="m.synopsis" class="synopsis">{{ m.synopsis }}</p>
						<div class="actions">
							<a v-if="m.trailerUrl" :href="m.trailerUrl" target="_blank" rel="noreferrer noopener">▶ Watch trailer</a>
							<button class="remove" @click="removeFromList(m.id)">Remove</button>
						</div>
					</div>
				</li>
			</ul>
		</div>
	</div>
</template>

<style>
:root {
	--bg:        oklch(0.16 0.008 60);
	--bg-2:      oklch(0.21 0.010 60);
	--bg-3:      oklch(0.255 0.012 60);
	--line:      oklch(0.38 0.014 60);
	--line-soft: oklch(0.32 0.012 60);

	--text:      oklch(0.95 0.005 80);
	--text-dim:  oklch(0.72 0.010 70);
	--text-mute: oklch(0.55 0.012 70);

	--gold:      oklch(0.82 0.135 85);
	--gold-soft: oklch(0.82 0.135 85 / 0.14);
	--gold-line: oklch(0.82 0.135 85 / 0.32);

	--red:       oklch(0.64 0.195 25);
	--red-hi:    oklch(0.70 0.205 28);
	--red-soft:  oklch(0.64 0.195 25 / 0.14);
	--red-line:  oklch(0.64 0.195 25 / 0.40);
}

.container {
	max-width: 1040px;
	margin: 0 auto;
	padding: 40px 28px 80px;
	font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	color: var(--text);
}

/* ---------- Header ---------- */
.app-header {
	display: flex;
	align-items: center;
	gap: 16px;
	margin-bottom: 32px;
	padding-bottom: 20px;
	border-bottom: 1px solid var(--line-soft);
}
.brand {
	display: flex;
	align-items: center;
	gap: 14px;
}
.brand-mark {
	width: 56px; height: 36px;
	flex-shrink: 0;
	filter: drop-shadow(0 4px 10px oklch(0.64 0.195 25 / 0.35));
	transform: rotate(-6deg);
	margin-right: 4px;
}
.brand-mark svg { display: block; width: 100%; height: 100%; overflow: visible; }

.container h1 {
	font-size: 26px;
	font-weight: 600;
	letter-spacing: -0.01em;
	margin: 0;
	color: var(--text);
}
.container h1 em {
	font-style: italic;
	color: var(--gold);
	font-weight: 500;
}

.container h2 {
	font-size: 20px;
	font-weight: 600;
	letter-spacing: -0.01em;
	margin: 32px 0 14px;
}

/* ---------- Search ---------- */
.search {
	display: flex;
	gap: 10px;
	margin-bottom: 24px;
}
.search-input-wrap {
	flex: 1;
	position: relative;
}
.search-icon {
	position: absolute;
	left: 14px; top: 50%;
	transform: translateY(-50%);
	color: var(--text-mute);
	pointer-events: none;
}
.search input {
	width: 100%;
	padding: 13px 14px 13px 40px;
	font-size: 15px;
	font-family: inherit;
	color: var(--text);
	background: var(--bg-2);
	border: 1px solid var(--line);
	border-radius: 10px;
	outline: none;
	transition: border-color 120ms, background 120ms, box-shadow 120ms;
}
.search input::placeholder { color: var(--text-mute); }
.search input:focus {
	border-color: var(--gold-line);
	background: var(--bg-3);
	box-shadow: 0 0 0 3px var(--gold-soft);
}
.search button {
	padding: 0 22px;
	font-size: 14px;
	font-weight: 500;
	font-family: inherit;
	color: oklch(0.18 0 0);
	background: var(--gold);
	border: 1px solid var(--gold);
	border-radius: 10px;
	cursor: pointer;
	transition: filter 120ms, transform 120ms;
}
.search button:hover { filter: brightness(1.08); }
.search button:active { transform: translateY(1px); }
.search button[disabled] { opacity: 0.5; cursor: not-allowed; filter: none; }

.error { color: var(--red-hi); }

/* ---------- Poster fallback ---------- */
.poster-fallback {
	background:
		repeating-linear-gradient(135deg,
			oklch(0.24 0.01 60) 0 8px,
			oklch(0.21 0.01 60) 8px 16px);
	border-radius: 6px;
	border: 1px solid var(--line-soft);
}

/* ---------- Results ---------- */
.results ul, .watchlist ul { list-style: none; padding: 0; margin: 0; }
.results ul {
	background: var(--bg-2);
	border: 1px solid var(--line-soft);
	border-radius: 10px;
	overflow: hidden;
}
.result {
	display: grid;
	grid-template-columns: 76px 1fr auto;
	gap: 16px;
	padding: 14px 16px;
	border-bottom: 1px solid var(--line-soft);
	align-items: center;
	background: var(--bg-2);
	transition: background 120ms;
}
.result:last-child { border-bottom: none; }
.result:hover { background: var(--bg-3); }
.result img, .result .poster-fallback {
	width: 76px;
	aspect-ratio: 2 / 3;
	border-radius: 6px;
	object-fit: cover;
}
.result .meta { min-width: 0; }
.result .title {
	font-weight: 600;
	font-size: 15px;
	margin-bottom: 4px;
	color: var(--text);
}
.result .title span {
	color: var(--text-mute);
	font-weight: 400;
	font-size: 13px;
	margin-left: 4px;
}
.result .overview {
	color: var(--text-dim);
	font-size: 13px;
	line-height: 1.5;
	text-wrap: pretty;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
.add-btn {
	font-family: inherit;
	font-size: 13px;
	font-weight: 500;
	padding: 8px 14px;
	border-radius: 6px;
	border: 1px solid var(--line);
	background: var(--bg-3);
	color: var(--text);
	cursor: pointer;
	transition: all 120ms;
	white-space: nowrap;
}
.add-btn:hover {
	border-color: var(--gold-line);
	color: var(--gold);
	background: var(--gold-soft);
}

/* ---------- Watchlist header ---------- */
.watchlist-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 14px;
}
.watchlist-header h2 { margin: 0; }
.watchlist-actions { display: flex; gap: 8px; }
.watchlist-header .copy,
.watchlist-header .clear {
	font-family: inherit;
	font-size: 13px;
	font-weight: 500;
	padding: 8px 14px;
	border-radius: 6px;
	cursor: pointer;
	transition: all 120ms;
}
.watchlist-header .copy {
	border: 1px solid var(--gold-line);
	background: var(--gold-soft);
	color: var(--gold);
}
.watchlist-header .copy:hover {
	border-color: var(--gold);
	background: oklch(0.82 0.135 85 / 0.20);
}
.watchlist-header .clear {
	border: 1px solid var(--red-line);
	background: transparent;
	color: var(--red-hi);
}
.watchlist-header .clear:hover {
	border-color: var(--red);
	background: var(--red-soft);
}

/* ---------- Watchlist cards ---------- */
.watchlist ul { display: grid; gap: 14px; }
.card {
	display: grid;
	grid-template-columns: 110px 1fr;
	gap: 18px;
	padding: 16px;
	background: linear-gradient(180deg, var(--bg-2), oklch(0.19 0.01 60));
	border: 1px solid var(--line-soft);
	border-radius: 10px;
	box-shadow: 0 1px 0 oklch(1 0 0 / 0.04) inset, 0 1px 2px oklch(0 0 0 / 0.4);
	transition: border-color 160ms;
}
.card:hover { border-color: var(--line); }
.card img, .card .poster-fallback {
	width: 110px;
	aspect-ratio: 2 / 3;
	border-radius: 8px;
	border: 1px solid var(--line);
	box-shadow: 0 8px 24px -12px oklch(0 0 0 / 0.6);
	display: block;
	align-self: start;
	object-fit: cover;
}
.card .content { display: flex; flex-direction: column; min-width: 0; }
.card .header {
	display: flex;
	align-items: baseline;
	gap: 12px;
	margin-bottom: 8px;
	flex-wrap: wrap;
}
.card .header strong {
	font-size: 18px;
	font-weight: 600;
	letter-spacing: -0.005em;
	color: var(--text);
}
.card .year {
	font-size: 13px;
	color: var(--text-mute);
	font-variant-numeric: tabular-nums;
}
.card .score {
	font-size: 12px;
	font-weight: 500;
	color: var(--gold);
	padding: 2px 8px;
	border-radius: 999px;
	background: var(--gold-soft);
	border: 1px solid var(--gold-line);
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}
.card .synopsis {
	color: var(--text-dim);
	font-size: 14px;
	line-height: 1.55;
	margin: 0 0 14px;
	text-align: left;
	text-wrap: pretty;
}
.card .actions {
	display: flex;
	gap: 8px;
	align-items: center;
	margin-top: auto;
}
.card .actions a {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	font-weight: 500;
	text-decoration: none;
	color: var(--red-hi);
	padding: 7px 12px;
	border-radius: 6px;
	border: 1px solid var(--red-line);
	background: var(--red-soft);
	transition: all 120ms;
	white-space: nowrap;
}
.card .actions a:hover {
	background: oklch(0.64 0.195 25 / 0.22);
	border-color: var(--red);
	color: oklch(0.78 0.16 28);
}
.card .remove {
	font-family: inherit;
	font-size: 13px;
	font-weight: 500;
	padding: 7px 12px;
	border-radius: 6px;
	border: 1px solid transparent;
	background: transparent;
	color: var(--text-dim);
	cursor: pointer;
	transition: color 120ms, background 120ms;
}
.card .remove:hover {
	color: var(--text);
	background: var(--bg-2);
}

@media (max-width: 640px) {
	.container { padding: 24px 16px 60px; }
	.app-header { flex-wrap: wrap; }
	.watchlist-header { flex-direction: column; align-items: flex-start; }
	.card { grid-template-columns: 88px 1fr; gap: 14px; padding: 14px; }
	.card img, .card .poster-fallback { width: 88px; }
	.result { grid-template-columns: 60px 1fr; }
	.result img, .result .poster-fallback { width: 60px; }
	.result .add-btn { grid-column: 2; justify-self: start; margin-top: 4px; }
}
</style>
