import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/ai", async (req, res) => {
  try {
    const { text } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "User yozgan gapni qisqa vazifaga aylantir"
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 30
      })
    });

    const data = await response.json();

    res.json({
      result: data.choices?.[0]?.message?.content || ""
    });

  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});