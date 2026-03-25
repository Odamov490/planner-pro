export async function streamSuggestion(text, onUpdate){

 if(!text || text.length < 3) return;

 const res = await fetch("http://localhost:5000/ai-stream",{
  method:"POST",
  headers:{ "Content-Type":"application/json" },
  body: JSON.stringify({ text })
 });

 const reader = res.body.getReader();
 const decoder = new TextDecoder();

 let result = "";

 while(true){
  const { done, value } = await reader.read();
  if(done) break;

  const chunk = decoder.decode(value);
  result += chunk;

  onUpdate(result); // 🔥 real-time update
 }
}