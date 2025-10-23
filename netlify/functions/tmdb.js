// Netlify serverless function to proxy TMDB API requests
// This hides the API key from the client

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

exports.handler = async (event, context) => {
	// Only allow GET requests
	if (event.httpMethod !== 'GET') {
		return {
			statusCode: 405,
			body: JSON.stringify({ error: 'Method not allowed' })
		};
	}

	// Get the API key from environment variables
	const apiKey = process.env.TMDB_API_KEY;
	if (!apiKey) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'TMDB_API_KEY not configured' })
		};
	}

	// Parse query parameters
	const params = event.queryStringParameters || {};
	const { endpoint, ...restParams } = params;

	if (!endpoint) {
		return {
			statusCode: 400,
			body: JSON.stringify({ error: 'Missing endpoint parameter' })
		};
	}

	// Build the TMDB URL
	const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
	const searchParams = new URLSearchParams({
		api_key: apiKey,
		include_adult: 'false',
		language: 'en-US',
		...restParams
	});
	url.search = searchParams.toString();

	try {
		const response = await fetch(url.toString());
		const data = await response.json();

		if (!response.ok) {
			return {
				statusCode: response.status,
				body: JSON.stringify({ error: data.status_message || 'TMDB API error' })
			};
		}

		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*'
			},
			body: JSON.stringify(data)
		};
	} catch (error) {
		console.error('TMDB proxy error:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Failed to fetch from TMDB' })
		};
	}
};

