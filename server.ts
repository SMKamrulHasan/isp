import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config({ override: true });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));

  // API Route: Proxy for Gemini Analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { imageDataUrl, prompt } = req.body;

      if (!imageDataUrl || !prompt) {
        // If it's just a health check (empty body), return 200 if key is present
        if (Object.keys(req.body).length === 0) {
          const hasKey = !!(process.env.GEMINI_API_KEY && 
                           process.env.GEMINI_API_KEY !== "TODO_KEYHERE" && 
                           process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
          return res.status(hasKey ? 200 : 500).json({ 
            status: hasKey ? "ready" : "error",
            error: hasKey ? null : "Server API key not configured" 
          });
        }
        return res.status(400).json({ error: "Missing image or prompt" });
      }

      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      
      if (!apiKey || apiKey === "TODO_KEYHERE" || apiKey === "MY_GEMINI_API_KEY") {
        console.error(`Server API key issue. Key exists: ${!!apiKey}, Value: ${apiKey}`);
        return res.status(500).json({ 
          error: "Server API key not configured",
          details: "Please ensure GEMINI_API_KEY is set in the Secrets panel (lock icon in sidebar)."
        });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Extract base64 data and mime type
      if (!imageDataUrl || !imageDataUrl.includes(',')) {
        return res.status(400).json({ error: "Invalid image data format" });
      }

      const [header, base64Data] = imageDataUrl.split(',');
      const mimeTypeMatch = header.match(/:(.*?);/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

      console.log(`Analyzing image with mimeType: ${mimeType} using gemini-flash-latest`);

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nimaScore: { type: Type.NUMBER },
              insights: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["nimaScore", "insights"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("Proxy Error:", error);
      res.status(500).json({ 
        error: "AI Analysis failed on server", 
        details: error.message 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
