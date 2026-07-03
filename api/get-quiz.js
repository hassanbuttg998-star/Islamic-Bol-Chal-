export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { category, level } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key missing in environment' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Generate 10 multiple-choice questions for ${category}, level ${level}. Respond ONLY with raw JSON array. format: [{"question": "...", "options": ["...","...","...","..."], "correct": "..."}]` }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        
        // Error handling: Check if API returned an error
        if (!data.candidates || !data.candidates[0].content.parts[0].text) {
            console.error("API Response Error:", JSON.stringify(data));
            return res.status(500).json({ error: 'AI failed to generate response', details: data });
        }

        const rawText = data.candidates[0].content.parts[0].text;
        const questions = JSON.parse(rawText.trim());
        return res.status(200).json(questions);

    } catch (error) {
        return res.status(500).json({ error: 'Server crash', details: error.message });
    }
}
