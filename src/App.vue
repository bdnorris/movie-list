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
		<h1>Movie Night Helper</h1>

		<form class="search" @submit.prevent="runSearch">
			<input
				type="text"
				v-model="query"
				placeholder="Search movies (e.g., Inception)"
				aria-label="Search movies"
			/>
			<button type="submit" :disabled="!canSearch">{{ isSearching ? 'Searching…' : 'Search' }}</button>
		</form>
		<p v-if="searchError" class="error">{{ searchError }}</p>

		<div class="results" v-if="results.length">
			<h2>Results</h2>
			<ul>
				<li v-for="r in results" :key="r.id" class="result">
					<img v-if="r.poster_path" :src="getPosterUrl(r.poster_path)" alt="" />
					<div class="meta">
						<div class="title">{{ r.title }} <span v-if="r.release_date">({{ r.release_date.slice(0,4) }})</span></div>
						<div class="overview" v-if="r.overview">{{ r.overview }}</div>
						<button @click="addToList(r)">Add</button>
					</div>
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
					<div class="content">
						<div class="header">
							<strong>{{ m.name }}</strong>
							<span v-if="m.year" class="year">{{ m.year }}</span>
							<span v-if="m.score !== ''" class="score">⭐ {{ m.score }}</span>
						</div>
						<p v-if="m.synopsis" class="synopsis">{{ m.synopsis }}</p>
						<div class="actions">
							<a v-if="m.trailerUrl" :href="m.trailerUrl" target="_blank" rel="noreferrer noopener">Watch trailer</a>
							<button class="remove" @click="removeFromList(m.id)">Remove</button>
						</div>
					</div>
				</li>
			</ul>
		</div>
	</div>
</template>

<style>
.container {
	max-width: 960px;
	margin: 0 auto;
	padding: 24px;
	font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
}

h1 {
	font-size: 28px;
	margin-bottom: 16px;
}

.search {
	display: flex;
	gap: 8px;
	margin-bottom: 16px;
}
.search input {
	flex: 1;
	padding: 10px 12px;
	border: 1px solid #ddd;
	border-radius: 6px;
	font-size: 16px;
}
.search button {
	padding: 10px 14px;
	border: 1px solid #0d6efd;
	background: #0d6efd;
	color: #fff;
	border-radius: 6px;
	cursor: pointer;
}
.search button[disabled] {
	opacity: 0.6;
	cursor: not-allowed;
}

.error { color: #b00020; }

.results ul, .watchlist ul { list-style: none; padding: 0; margin: 0; }
.result { display: grid; grid-template-columns: 92px 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid #eee; }
.result img { width: 92px; border-radius: 6px; }
.meta .title { font-weight: 600; margin-bottom: 4px; }
.meta .overview { color: #444; margin-bottom: 8px; }
.meta button { padding: 8px 10px; border-radius: 6px; border: 1px solid #222; background: #222; color: #fff; cursor: pointer; }

.watchlist-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.watchlist-actions { display: flex; gap: 8px; }
.watchlist-header .copy { padding: 8px 10px; border-radius: 6px; border: 1px solid #0d6efd; background: #0d6efd; color: #fff; cursor: pointer; }
.watchlist-header .clear { padding: 8px 10px; border-radius: 6px; border: 1px solid #dc3545; background: #dc3545; color: #fff; cursor: pointer; }

.card { display: grid; grid-template-columns: 92px 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid #eee; }
.card img { width: 92px; border-radius: 6px; }
.card .header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.card .year { color: #666; }
.card .score { color: #cc8b00; }
.card .synopsis { margin: 6px 0 8px; color: #333; text-align: left; }
.card .actions { display: flex; gap: 12px; align-items: center; }
.card .remove { border: 1px solid #b00020; background: #fff; color: #b00020; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
</style>
