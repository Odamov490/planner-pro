import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/ai-stream", async (req, res) => {

  const { text } = req.body;

  try {

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        stream: true,
        messages: [
          {
            role: "system",
            content: "User yozgan gapni qisqa vazifaga aylantir"
          },
          {
            role: "user",
            content: text
          }
        ]
      })
    });

    res.setHeader("Content-Type", "text/plain");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      res.write(chunk);
    }

    res.end();

  } catch (err) {
    res.status(500).send("error");
  }
});

app.listen(5000, () => {
  console.log("🚀 Streaming server running http://localhost:5000");
});