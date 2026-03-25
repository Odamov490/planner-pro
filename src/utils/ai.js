export async function getSuggestion(text) {

  if (!text || text.length < 3) return "";

  try {
    const res = await fetch("http://localhost:5000/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await res.json();

    console.log("AI RESPONSE:", data); // 👈 qo‘sh

    return data.result || "";

  } catch (e) {
    console.error("AI ERROR:", e);
    return "";
  }
}