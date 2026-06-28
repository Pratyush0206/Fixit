import { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";

function App() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState([]);
  const [aiResult, setAiResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const analyzeWithGemini = async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `You are an AI that analyzes community issues. Analyze this image and the description: "${description}". Return ONLY a JSON object with these fields: category (one of: Pothole, Water Leakage, Broken Streetlight, Garbage, Other), severity (one of: Low, Medium, High), summary (one sentence description). No markdown, just raw JSON.` },
              { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
            ]
          }]
        }),
      }
    );
    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  };

  const handleSubmit = async () => {
    if (!imageBase64 || !location) return alert("Please add image and location");
    setLoading(true);
    try {
      const result = await analyzeWithGemini();
      setAiResult(result);
      await addDoc(collection(db, "issues"), {
        location,
        description,
        category: result.category,
        severity: result.severity,
        summary: result.summary,
        votes: 0,
        status: "Reported",
        timestamp: serverTimestamp(),
      });
      alert("Issue reported successfully!");
      setLocation("");
      setDescription("");
      setImage(null);
      setImageBase64(null);
      loadIssues();
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
    setLoading(false);
  };

  const loadIssues = async () => {
    const snapshot = await getDocs(collection(db, "issues"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setIssues(data);
  };

  const severityColor = (s) => s === "High" ? "bg-red-500" : s === "Medium" ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400">FixIt 🛠️</h1>
        <p className="text-gray-400 text-sm">AI-powered community issue reporting</p>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Report Form */}
        <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Report an Issue</h2>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full mb-3 text-sm text-gray-400"
          />
          {image && <p className="text-green-400 text-sm mb-3">✓ Image selected: {image.name}</p>}
          
          <input
            type="text"
            placeholder="Location (e.g. Near Gate 2, MG Road)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-gray-800 rounded-lg p-3 mb-3 text-white placeholder-gray-500 border border-gray-700"
          />
          
          <textarea
            placeholder="Describe the issue (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-800 rounded-lg p-3 mb-4 text-white placeholder-gray-500 border border-gray-700 h-24"
          />
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg p-3 font-semibold disabled:opacity-50"
          >
            {loading ? "Analyzing with AI..." : "Report Issue"}
          </button>
        </div>

        {/* AI Result */}
        {aiResult && (
          <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-blue-800">
            <h3 className="font-semibold text-blue-400 mb-2">AI Analysis</h3>
            <p><span className="text-gray-400">Category:</span> {aiResult.category}</p>
            <p><span className="text-gray-400">Severity:</span> {aiResult.severity}</p>
            <p><span className="text-gray-400">Summary:</span> {aiResult.summary}</p>
          </div>
        )}

        {/* Load Issues Button */}
        <button
          onClick={loadIssues}
          className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-3 mb-4 font-semibold"
        >
          Load Reported Issues
        </button>

        {/* Issues Feed */}
        {issues.map(issue => (
          <div key={issue.id} className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold">{issue.category}</span>
              <span className={`text-xs px-2 py-1 rounded-full text-white ${severityColor(issue.severity)}`}>
                {issue.severity}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-1">📍 {issue.location}</p>
            <p className="text-gray-300 text-sm">{issue.summary}</p>
            <p className="text-gray-500 text-xs mt-2">Status: {issue.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;