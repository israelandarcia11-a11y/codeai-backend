const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "CodeAI Plus" },
            unit_amount: 499,
          },
          quantity: 1,
        },
      ],
      success_url: "https://israelandarcia11-a11y.github.io/CodeAI/",
      cancel_url: "https://israelandarcia11-a11y.github.io/CodeAI/",
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { messages, model } = req.body;
    const completion = await groq.chat.completions.create({
      model: model || "llama-3.3-70b-versatile",
      messages
    });
    res.json(completion);
  } catch (err) {
    console.error("Groq error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/get-plan", (req, res) => {
  res.json({ plan: "free" });
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Servidor corriendo en puerto 10000 🚀");
});