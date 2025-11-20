const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGemini() {
    console.log('Testing Gemini API...');
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error('❌ Error: GEMINI_API_KEY not found in .env');
        return;
    }

    console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

    for (const modelName of models) {
        try {
            console.log(`\nTesting model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`✅ Success with ${modelName}! Response:`, response.text());
            return; // Exit on success
        } catch (e) {
            console.error(`❌ Failed with ${modelName}: ${e.message}`);
            if (e.response) console.error('Status:', e.response.status, e.response.statusText);
        }
    }

    console.error('\n❌ All models failed.');
}

testGemini();
