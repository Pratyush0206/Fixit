import { useEffect } from "react";

function App() {
  useEffect(() => {
    const testGemini = async () => {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Say hello from FixIt!" }] }],
            }),
          }
        );
        const data = await response.json();
        console.log("Full response:", data);
      } catch (err) {
        console.log("Error:", err);
      }
    };
    testGemini();
  }, []);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-10">
      <h1 className="text-3xl font-bold">FixIt 🛠️</h1>
      <p>Check browser console for Gemini response</p>
    </div>
  );
}

export default App;