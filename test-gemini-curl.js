const axios = require('axios');
require('dotenv').config();

async function testGeminiRaw() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Testing Gemini API (Raw HTTP)...');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const data = {
        contents: [{
            parts: [{ text: "Hello" }]
        }]
    };

    try {
        const response = await axios.post(url, data);
        console.log('✅ Success! Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ HTTP Request Failed');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testGeminiRaw();
