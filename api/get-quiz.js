export default async function handler(req, res) {
    // CORS Headers taake aapka frontend is se data le sake
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

    // AI ke liye strict prompt aapke plan ke mutabiq (10 Questions, 4 Options, JSON output)
    const prompt = `You are an Islamic Quiz Generator. Generate exactly 10 multiple-choice questions for the category "${category}" at difficulty level ${level} (where 1 is Easy, 2 is Medium, 3 is Hard, 4 is Extreme, 5 is Extreme Hard). 
    The language must be Roman Urdu/Hindi (English script but speaking Urdu/Hindi like "Islam ke pehle nabi kaun hain?").
    
    You MUST respond with a raw JSON array only. Do not include any markdown formatting, no \`\`\`json wrappers.
    Each object in the array must look exactly like this:
    {
        "question": "Question text here?",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correct": "The exact matching string from the options array"
    }`;

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
        const rawText = data.candidates[0].content.parts[0].text;
        
        // Clean and parse the JSON string from Gemini
        const questions = JSON.parse(rawText.trim());
        return res.status(200).json(questions);

    } catch (error) {
        return res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
    }
}
