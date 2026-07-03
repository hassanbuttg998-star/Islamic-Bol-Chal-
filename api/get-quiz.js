const fetch = require('node-fetch'); // Node 18+ par agar fetch built-in hai toh yeh automatic handle ho jayega

module.exports = async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { category, level } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key missing on server' });
    }

    const prompt = `Generate exactly 10 multiple-choice questions for the category "${category}" at difficulty level ${level} (where 1 is Easy, 5 is Extreme Hard). 
    The language must be Roman Urdu/Hindi (English script like "Islam ke pehle nabi kaun hain?").
    You MUST respond with a raw JSON array only. Do not include markdown or \`\`\`json wrappers.
    Format: [{"question": "...", "options": ["...", "...", "...", "..."], "correct": "..."}]`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            return res.status(500).json({ error: 'AI response failed', details: data });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const questions = JSON.parse(rawText.trim());
        return res.status(200).json(questions);

    } catch (error) {
        return res.status(500).json({ error: 'Server crash', details: error.message });
    }
};
