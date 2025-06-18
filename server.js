// server.js - A Node.js Express server to fetch cryptocurrency prices from CoinMarketCap.

// Import necessary modules
const express = require('express');   // Express.js for creating the server
const fetch = require('node-fetch');  // node-fetch for making HTTP requests
const cors = require('cors');         // CORS middleware

const app = express();
const PORT = process.env.PORT || 3000;

// IMPORTANT: Your CoinMarketCap API Key is now directly in the code.
// While convenient for quick testing, for production deployments,
// it is generally recommended to use environment variables (as in the previous version)
// for security and easier management.
const CMC_API_KEY = 'fb3d7be2-38b1-4afd-b436-7ac1c56a8c49';

// Enable CORS for all routes
app.use(cors());

// Define the CoinMarketCap API endpoint for latest prices
// Note: CoinMarketCap has different endpoints and often uses a 'quotes/latest' endpoint
// for fetching current prices by symbol.
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

// Define the CoinMarketCap symbols for the cryptocurrencies we want to fetch
// These are standard ticker symbols, often easier to manage than CoinGecko IDs.
const CRYPTO_SYMBOLS = [
    'BTC',  // Bitcoin
    'ETH',  // Ethereum
    'LTC',  // Litecoin
    'SHIB', // Shiba Inu
    'DOGE', // Dogecoin
    'TRX',  // Tron
    'XRP',  // Ripple
    'TON',  // The Open Network (note: TON might be tricky as there are multiple 'TON's, ensure correct ID if using ID-based endpoint)
    'USDT'  // Tether
];
const CONVERT_CURRENCY = 'USD'; // We want prices in USD

/**
 * Fetches cryptocurrency prices from the CoinMarketCap API.
 * @returns {Object} An object containing the fetched prices, or an error object.
 */
async function fetchCryptoPrices() {
    try {
        // Construct the URL for the CoinMarketCap API call
        const symbolsParam = CRYPTO_SYMBOLS.join(',');
        const url = `${CMC_API_URL}?symbol=${symbolsParam}&convert=${CONVERT_CURRENCY}`;

        // Make the API request with the necessary headers (including API key)
        const response = await fetch(url, {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_API_KEY,
                'Accept': 'application/json' // Always good to explicitly ask for JSON
            }
        });

        // Check if the response was successful
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        // Parse the JSON response
        const data = await response.json();

        // Check if the API returned an error status within its response body
        if (data.status && data.status.error_code !== 0) {
            throw new Error(`CoinMarketCap API internal error: ${data.status.error_message}`);
        }

        const formattedPrices = {};
        for (const symbol of CRYPTO_SYMBOLS) {
            // CoinMarketCap returns data in data[SYMBOL_CODE][0].quote.USD.price
            // Need to handle potential for multiple listings for the same symbol (e.g., TON)
            // We'll take the first one found for simplicity for now.
            if (data.data && data.data[symbol] && data.data[symbol].length > 0 && data.data[symbol][0].quote && data.data[symbol][0].quote[CONVERT_CURRENCY]) {
                formattedPrices[symbol.toLowerCase()] = data.data[symbol][0].quote[CONVERT_CURRENCY].price;
            } else {
                formattedPrices[symbol.toLowerCase()] = 'N/A'; // Indicate if price not found
            }
        }

        return formattedPrices;
    } catch (error) {
        console.error('Error fetching crypto prices from CoinMarketCap:', error.message);
        return { error: 'Failed to fetch cryptocurrency prices', details: error.message };
    }
}

// Define a root route for a simple health check or welcome message
app.get('/', (req, res) => {
    res.send('Welcome to the Crypto Price API! Access /prices to get the latest data from CoinMarketCap.');
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
});
