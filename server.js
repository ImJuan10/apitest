// server.js - A simple Node.js Express server to fetch cryptocurrency prices.

// Import necessary modules
const express = require('express'); // Express.js for creating the server
const fetch = require('node-fetch'); // node-fetch for making HTTP requests (like the browser's fetch API)
const cors = require('cors');       // CORS middleware to allow cross-origin requests

const app = express(); // Initialize the Express application
const PORT = process.env.PORT || 3000; // Define the port for the server.
                                     // process.env.PORT is used for deployment environments like Render.com.

// Enable CORS for all routes
// This allows requests from different origins (e.g., your frontend application)
app.use(cors());

// Define the CoinGecko API endpoint and parameters
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';
const VS_CURRENCY = 'usd'; // We want prices in USD

// Define the CoinGecko IDs for the cryptocurrencies we want to fetch
// These IDs are specific to the CoinGecko API
const CRYPTO_IDS = [
    'bitcoin',          // BTC
    'ethereum',         // ETH
    'litecoin',         // LTC
    'shiba-inu',        // SHIB
    'dogecoin',         // DOGE
    'tron',             // TRX
    'ripple',           // XRP
    'the-open-network', // TON
    'tether'            // USDT
];

/**
 * Fetches cryptocurrency prices from the CoinGecko API.
 * @returns {Object} An object containing the fetched prices, or an error object.
 */
async function fetchCryptoPrices() {
    try {
        // Construct the URL for the CoinGecko API call
        const idsParam = CRYPTO_IDS.join(','); // Join the IDs with commas
        const url = `${COINGECKO_API_URL}?ids=${idsParam}&vs_currencies=${VS_CURRENCY}`;

        // Make the API request
        const response = await fetch(url);

        // Check if the response was successful
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`CoinGecko API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // Parse the JSON response
        const data = await response.json();

        // Format the data to be more readable if needed, or return as is
        // CoinGecko returns data like: { "bitcoin": { "usd": 30000 }, "ethereum": { "usd": 2000 } }
        const formattedPrices = {};
        for (const id of CRYPTO_IDS) {
            if (data[id] && data[id][VS_CURRENCY]) {
                formattedPrices[id] = data[id][VS_CURRENCY];
            } else {
                formattedPrices[id] = 'N/A'; // Indicate if price not found for a specific coin
            }
        }

        return formattedPrices;
    } catch (error) {
        console.error('Error fetching crypto prices:', error.message);
        return { error: 'Failed to fetch cryptocurrency prices', details: error.message };
    }
}

// Define a root route for a simple health check or welcome message
app.get('/', (req, res) => {
    res.send('Welcome to the Crypto Price API! Access /prices to get the latest data.');
});

// Define the API endpoint to serve the cryptocurrency prices
app.get('/prices', async (req, res) => {
    const prices = await fetchCryptoPrices();

    // Send the fetched prices as a JSON response
    if (prices.error) {
        res.status(500).json(prices); // Send 500 status if there was an error
    } else {
        res.status(200).json(prices); // Send 200 status with the prices
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access prices at: http://localhost:${PORT}/prices`);
    console.log(`Root access at: http://localhost:${PORT}/`);
});

// Note: For deployment on Render.com, you will also need a 'package.json' file
// to define your dependencies (express, node-fetch, cors) and a 'start' script.
// See the conclusion for 'package.json' details.
