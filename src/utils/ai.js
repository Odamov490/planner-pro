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

    return data.result || "";

  } catch {
    return "";
  }
}
