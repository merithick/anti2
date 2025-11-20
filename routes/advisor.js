const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Ensure env vars are loaded
dotenv.config();

const router = express.Router();

// Middleware to verify token
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

router.use(authMiddleware);

// Initialize Gemini API lazily
let genAI;

// Analyze user profile and get recommendations
router.post('/analyze', async (req, res) => {
    const { age, income, savings, risk, goals, timeline } = req.body;
    let recommendation;

    try {
        console.log('Received analysis request');

        // Debug logging
        if (!process.env.GEMINI_API_KEY) {
            console.error('CRITICAL: GEMINI_API_KEY is missing');
            throw new Error('API Key missing');
        }

        // Initialize if not already done
        if (!genAI) {
            genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      Act as an expert financial advisor for an Indian investor. Based on the following profile, provide a detailed investment strategy:
      
      - Age: ${age}
      - Monthly Income: ₹${income}
      - Current Savings: ₹${savings}
      - Risk Tolerance: ${risk}
      - Goals: ${goals.join(', ')}
      - Timeline: ${timeline}

      Provide the response in STRICT JSON format with the following structure (do not include markdown formatting like \`\`\`json):
      {
        "suggestedSIP": number (monthly amount in rupees),
        "assetAllocation": { 
          "equity": number (percentage), 
          "debt": number (percentage), 
          "hybrid": number (percentage), 
          "gold": number (percentage)
        },
        "strategy": "string (detailed explanation of the strategy)",
        "recommendedFunds": ["string (fund category examples, e.g., 'Large Cap Index Fund')"],
        "riskAnalysis": "string (assessment of their risk profile vs goals)",
        "actionPlan": ["string (step 1)", "string (step 2)", "string (step 3)"]
      }
    `;

        console.log('Sending prompt to Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('Received response from Gemini');

        // Clean up the response if it contains markdown code blocks
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        recommendation = JSON.parse(jsonStr);

    } catch (error) {
        console.error('AI Advisor Error:', error.message);

        // FALLBACK: Mock AI Response for testing/region-blocked users
        console.log('⚠️ Switching to MOCK AI MODE due to API error');

        const mockSIP = Math.round((income * 0.2) / 500) * 500; // 20% of income, rounded to nearest 500
        const isAggressive = risk === 'Aggressive';
        const isConservative = risk === 'Conservative';

        recommendation = {
            suggestedSIP: mockSIP,
            assetAllocation: {
                equity: isAggressive ? 70 : (isConservative ? 30 : 50),
                debt: isAggressive ? 20 : (isConservative ? 50 : 30),
                hybrid: isAggressive ? 0 : (isConservative ? 10 : 10),
                gold: 10
            },
            strategy: `(Mock AI Mode) Based on your profile as a ${age}-year-old investor with a ${risk} risk appetite, we recommend a ${isAggressive ? 'growth-oriented' : 'balanced'} approach. Your goal of ${goals.join(' and ')} requires disciplined investing. We suggest allocating a significant portion to ${isAggressive ? 'equity mutual funds' : 'debt and hybrid instruments'} to optimize returns while managing volatility.`,
            recommendedFunds: [
                isAggressive ? "Bluechip Equity Fund" : "Balanced Advantage Fund",
                isAggressive ? "Mid Cap Fund" : "Short Term Debt Fund",
                "Sovereign Gold Bond"
            ],
            riskAnalysis: `Your ${risk} risk profile suggests you are ${isAggressive ? 'willing to accept short-term market fluctuations for higher long-term gains' : 'prioritizing capital protection over aggressive growth'}. This aligns well with your ${timeline} timeline.`,
            actionPlan: [
                `Start a monthly SIP of ₹${mockSIP} immediately.`,
                "Build an emergency fund equivalent to 6 months of expenses before increasing investments.",
                "Review and rebalance your portfolio every year."
            ]
        };
    }

    // Save to database (both real and mock)
    try {
        const stmt = db.prepare(`
      INSERT INTO advisor_sessions (user_id, profile_data, recommendation_data)
      VALUES (?, ?, ?)
    `);

        stmt.run(
            req.user.userId,
            JSON.stringify({ age, income, savings, risk, goals, timeline }),
            JSON.stringify(recommendation)
        );
        console.log('✅ Session saved to database');
    } catch (dbError) {
        console.error('Failed to save session:', dbError);
    }

    res.json(recommendation);
});

// Get history
router.get('/history', (req, res) => {
    try {
        const sessions = db.prepare(`
      SELECT * FROM advisor_sessions 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.userId);

        const parsedSessions = sessions.map(session => ({
            ...session,
            profile_data: JSON.parse(session.profile_data),
            recommendation_data: JSON.parse(session.recommendation_data)
        }));

        res.json(parsedSessions);
    } catch (error) {
        console.error('History Error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

module.exports = router;
