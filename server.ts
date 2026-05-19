import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

let genAI: GoogleGenerativeAI | null = null;

function getAIModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Assistant API
  app.post("/api/ai/query", async (req, res) => {
    try {
      const { query, context } = req.body;
      
      const prompt = `
        You are CLEMTRIX AI, a senior business advisor for a POS system in Ghana.
        User Question: ${query}
        
        Context (Business Data):
        ${JSON.stringify(context, null, 2)}
        
        Instructions:
        1. Answer the user's question based on the provided business data context.
        2. Be professional, helpful, and concise.
        3. Use Ghana Cedi (GHS) for monetary values.
        4. If data is missing, suggest what they might want to track.
        5. Do NOT mention being an AI or raw SQL queries.
      `;

      const model = getAIModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ answer: response.text() });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // Paystack Webhook Placeholder
  app.post("/api/paystack/webhook", (req, res) => {
    // Handle Paystack events here
    res.status(200).send("OK");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CLEMTRIX Server running at http://localhost:${PORT}`);
  });
}

startServer();
