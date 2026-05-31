const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { messages, model, useGemini } = req.body;

    if (useGemini) {
      const fetch = (await import("node-fetch")).default;
      const key = process.env.GEMINI_API_KEY;

      const geminiMessages = messages
        .filter(m => m.role !== "system")
        .map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }));

      const systemPrompt = messages.find(m => m.role === "system")?.content || "";

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: geminiMessages
          })
        }
      );

      const data = await response.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";

      res.json({
        choices: [{ message: { content: reply } }]
      });

    } else {
      const completion = await groq.chat.completions.create({
        model: model || "llama-3.3-70b-versatile",
        messages
      });
      res.json(completion);
    }

  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "CodeAI Plus" },
          unit_amount: 499,
        },
        quantity: 1,
      }],
      success_url: "https://israelandarcia11-a11y.github.io/CodeAI/",
      cancel_url: "https://israelandarcia11-a11y.github.io/CodeAI/",
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/get-plan", (req, res) => {
  res.json({ plan: "free" });
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Servidor corriendo en puerto 10000 🚀");
});