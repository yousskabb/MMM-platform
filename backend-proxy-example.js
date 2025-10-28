// Example backend proxy for API key protection
// Deploy this separately (not on GitHub Pages)

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Your API key is stored securely on the server
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_API_ENDPOINT = process.env.LLM_API_ENDPOINT;

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, context } = req.body;

        const response = await fetch(LLM_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LLM_API_KEY}`
            },
            body: JSON.stringify({
                prompt,
                context,
                // Add any other required parameters
            })
        });

        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'API call failed' });
    }
});

app.listen(3001, () => {
    console.log('Proxy server running on port 3001');
});
