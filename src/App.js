import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { collection, addDoc, getDocs, serverTimestamp, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function App() {
  const [, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [activeTab, setActiveTab] = useState("report");
  const [userName, setUserName] = useState("");
  const [showNameModal, setShowNameModal] = useState(true);
  const [duplicateIssue, setDuplicateIssue] = useState(null);
  const [pendingCoords, setPendingCoords] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { loadIssues(); loadInsights(); }, []);

  const getLocation = () => new Promise((resolve) => {
    navigator.geolocation
      ? navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve({ lat: 20.5937, lng: 78.9629 })
        )
      : resolve({ lat: 20.5937, lng: 78.9629 });
  });

  const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const findDuplicate = (category, lat, lng) => {
    return issues.find(i =>
      i.category === category &&
      i.status !== "Resolved" &&
      i.lat && i.lng &&
      getDistanceMeters(lat, lng, i.lat, i.lng) <= 80
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result.split(",")[1]);
      setImagePreview(reader.result);
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
          contents: [{ parts: [
            { text: `You are an AI that analyzes community issue images. Analyze this image and description: "${description}". If the image shows a legitimate civic/community problem, return ONLY raw JSON: {"valid": true, "category": "Pothole|Water Leakage|Broken Streetlight|Garbage|Damaged Road|Fallen Tree|Flooding|Sewage Problem|Illegal Dumping|Broken Infrastructure", "severity": "Low|Medium|High", "summary": "one descriptive sentence"}. Severity guidelines: High = immediate danger to life/safety. Medium = significant inconvenience affecting daily life. Low = minor issue, not urgent. If the image does NOT show a community issue (e.g. selfie, food, random object), return ONLY: {"valid": false, "category": "", "severity": "", "summary": ""}. No markdown, just raw JSON.` },
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
          ]}]
        }),
      }
    );
    const data = await response.json();
    if (!data.candidates) throw new Error(data.error?.message || "Gemini error");
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  };

  const handleSubmit = async () => {
    if (!imageBase64 || !location) return alert("Please add image and location");
    setLoading(true);
    try {
      const result = await analyzeWithGemini();
      if (!result.valid) {
        setLoading(false);
        return alert("⚠️ Please upload a photo of an actual community issue (pothole, garbage, broken infrastructure, etc.)");
      }
      setAiResult(result);
      const coords = await getLocation();

      const dup = findDuplicate(result.category, coords.lat, coords.lng);
      if (dup) {
        setDuplicateIssue(dup);
        setPendingCoords(coords);
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "issues"), {
        location, description,
        category: result.category, severity: result.severity, summary: result.summary,
        votes: 0, status: "Reported",
        lat: coords.lat, lng: coords.lng,
        timestamp: serverTimestamp(),
      });
      alert("Issue reported successfully!");
      setLocation(""); setDescription(""); setImage(null); setImageBase64(null); setImagePreview(null);
      loadIssues();
      setActiveTab("feed");
    } catch (err) { alert("Error: " + err.message); }
    setLoading(false);
  };

  const confirmDuplicateVerify = async () => {
    await handleUpvote(duplicateIssue.id);
    setDuplicateIssue(null);
    setLocation(""); setDescription(""); setImage(null); setImageBase64(null); setImagePreview(null);
    setActiveTab("feed");
  };

  const forceCreateNew = async () => {
    setLoading(true);
    await addDoc(collection(db, "issues"), {
      location, description,
      category: aiResult.category, severity: aiResult.severity, summary: aiResult.summary,
      votes: 0, status: "Reported",
      lat: pendingCoords.lat, lng: pendingCoords.lng,
      timestamp: serverTimestamp(),
    });
    setDuplicateIssue(null);
    alert("Issue reported successfully!");
    setLocation(""); setDescription(""); setImage(null); setImageBase64(null); setImagePreview(null);
    loadIssues();
    setActiveTab("feed");
    setLoading(false);
  };
  const loadIssues = async () => {
    const snapshot = await getDocs(collection(db, "issues"));
    setIssues(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const loadInsights = async () => {
    const snap = await getDoc(doc(db, "meta", "insights"));
    if (snap.exists()) setInsights(snap.data());
  };

  const generateInsights = async () => {
    setInsightsLoading(true);
    try {
      const issueData = issues.map(i => ({
        category: i.category, location: i.location, severity: i.severity,
        status: i.status, votes: i.votes
      }));
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Analyze these civic issues: ${JSON.stringify(issueData)}. Return ONLY raw JSON: {"hotspots": "1-2 sentences on repeated-location areas", "trends": "1-2 sentences on category patterns", "priority": "1-2 sentences on which open issues need attention first", "department": "1-2 sentences mapping categories to responsible departments", "riskAlert": "1-2 sentences on any escalation risk, or 'No immediate risks detected' if none"}. No markdown, just raw JSON.` }] }]
          }),
        }
      );
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const result = JSON.parse(text.replace(/```json|```/g, "").trim());
      await setDoc(doc(db, "meta", "insights"), { ...result, generatedAt: serverTimestamp() });
      setInsights(result);
    } catch (err) { alert("Insights error: " + err.message); }
    setInsightsLoading(false);
  };

  const handleUpvote = async (issueId) => {
    const issueRef = doc(db, "issues", issueId);
    await updateDoc(issueRef, { votes: increment(1) });
    const snapshot = await getDocs(collection(db, "issues"));
    const updated = snapshot.docs.find(d => d.id === issueId);
    const updatedIssue = { id: updated.id, ...updated.data() };
    await checkEscalation(issueId, updatedIssue.votes, updatedIssue);
    loadIssues();
  };

  const checkEscalation = async (issueId, votes, issue) => {
    if (votes >= 3 && issue.status === "Reported") {
      const letter = await generateEscalationLetter(issue);
      await updateDoc(doc(db, "issues", issueId), { status: "Escalated", escalationLetter: letter });
      loadIssues();
    }
  };

  const generateEscalationLetter = async (issue) => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.REACT_APP_GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Today's date is ${new Date().toLocaleDateString('en-IN', {day:'numeric', month:'long', year:'numeric'})}. Write a formal complaint letter to the Municipal Corporation about: Category: ${issue.category}, Location: ${issue.location}, Issue: ${issue.summary}, Severity: ${issue.severity}, Reported by ${issue.votes} citizens. The complainant's name is ${userName}. Use their actual name and today's date. Address it to "The Municipal Commissioner, Municipal Corporation" without any city placeholders or brackets. Remove ALL placeholder text in square brackets. Under 150 words, professional tone.` }] }]
        }),
      }
    );
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  };

  const handleResolve = async (issueId) => {
    await updateDoc(doc(db, "issues", issueId), { status: "Resolved" });
    loadIssues();
  };

  const severityColor = (s) => s === "High" ? "bg-red-500" : s === "Medium" ? "bg-yellow-500" : "bg-green-500";
  const statusColor = (s) => s === "Escalated" ? "text-red-400" : s === "Resolved" ? "text-green-400" : "text-gray-400";
  const statusIcon = (s) => s === "Escalated" ? "🚨" : s === "Resolved" ? "✅" : "📋";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-orange-800">
            <div className="text-4xl mb-3 text-center">🛠️</div>
            <h2 className="text-xl font-bold text-center mb-1">Welcome to FixIt</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Your name will appear on complaint letters sent to authorities</p>
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-gray-800 rounded-xl p-4 mb-4 text-white placeholder-gray-500 border border-gray-700 focus:border-orange-500 focus:outline-none"
            />
            <button
              onClick={() => { if(userName.trim()) setShowNameModal(false); }}
              className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl p-4 font-bold transition-colors"
            >
              Get Started →
            </button>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-gray-900 border-b border-orange-900 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg">
            <span className="text-xl">🛠️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">FixIt</h1>
            <p className="text-orange-400 text-xs font-medium">Stop filing forms. Just show FixIt.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className="bg-orange-900 text-orange-300 text-xs px-3 py-1 rounded-full font-semibold">Gemini AI</span>
          <span className="bg-green-900 text-green-300 text-xs px-3 py-1 rounded-full font-semibold">● Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-gray-800 border-b border-gray-800">
        {[
          { label: "Total Issues", value: issues.length, color: "text-orange-400" },
          { label: "Escalated", value: issues.filter(i => i.status === "Escalated").length, color: "text-red-400" },
          { label: "Resolved", value: issues.filter(i => i.status === "Resolved").length, color: "text-green-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-950 py-4 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="h-56 border-b border-gray-800">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {issues.map(issue => (
            issue.lat && issue.lng && (
              <Marker key={issue.id} position={[issue.lat, issue.lng]}>
                <Popup>
                  <div style={{minWidth: '150px'}}>
                    <b>{issue.category}</b><br/>
                    <span style={{color:'#666'}}>{issue.location}</span><br/>
                    Severity: <b>{issue.severity}</b><br/>
                    Status: {issue.status}
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-900 sticky top-16 z-40">
        {["report", "feed", "insights"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? "text-orange-400 border-b-2 border-orange-400" : "text-gray-500 hover:text-gray-300"}`}
          >
            {tab === "report" ? "📸 Report Issue" : tab === "feed" ? `📋 Issues Feed (${issues.length})` : "🤖 AI Insights"}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Report Tab */}
        {activeTab === "report" && (
          <div>
            {/* Image Upload */}
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-700 hover:border-orange-500 rounded-xl p-8 mb-4 text-center cursor-pointer transition-colors"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="max-h-48 mx-auto rounded-lg object-cover" />
              ) : (
                <div>
                  <p className="text-4xl mb-2">📷</p>
                  <p className="text-gray-400">Click to upload photo of the issue</p>
                  <p className="text-gray-600 text-xs mt-1">JPG, PNG supported</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

            <input
              type="text"
              placeholder="📍 Location (e.g. Near Gate 2, MG Road)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-gray-900 rounded-xl p-4 mb-3 text-white placeholder-gray-500 border border-gray-800 focus:border-orange-500 focus:outline-none"
            />

            <textarea
              placeholder="Describe the issue (optional — AI will analyze the photo)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-900 rounded-xl p-4 mb-4 text-white placeholder-gray-500 border border-gray-800 focus:border-orange-500 focus:outline-none h-24 resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 rounded-xl p-4 font-bold text-lg disabled:opacity-40 transition-colors"
            >
              {loading ? "🤖 AI Analyzing..." : "🚀 Report Issue"}
            </button>

            {aiResult && (
              <div className="mt-4 bg-orange-950 border border-orange-800 rounded-xl p-4">
                <p className="text-orange-400 font-semibold mb-3">🤖 AI Analysis Complete</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Category</p>
                    <p className="font-semibold">{aiResult.category}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Severity</p>
                    <p className={`font-semibold ${aiResult.severity === 'High' ? 'text-red-400' : aiResult.severity === 'Medium' ? 'text-yellow-400' : 'text-green-400'}`}>{aiResult.severity}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-3">{aiResult.summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Feed Tab */}
        {activeTab === "feed" && (
          <div>
            {issues.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">🏙️</p>
                <p>No issues reported yet</p>
              </div>
            ) : (
              issues.map(issue => (
                <div key={issue.id} className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-white">{issue.category}</span>
                      <span className={`ml-2 text-xs ${statusColor(issue.status)}`}>
                        {statusIcon(issue.status)} {issue.status}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full text-white font-semibold ${severityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-2">📍 {issue.location}</p>
                  <p className="text-gray-300 text-sm mb-3">{issue.summary}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpvote(issue.id)}
                      className="flex-1 text-sm bg-gray-800 hover:bg-gray-700 py-2 rounded-lg font-semibold transition-colors"
                    >
                      👍 Verify ({issue.votes})
                    </button>
                    {issue.status !== "Resolved" && (
                      <button
                        onClick={() => handleResolve(issue.id)}
                        className="flex-1 text-sm bg-green-900 hover:bg-green-800 py-2 rounded-lg font-semibold transition-colors text-green-300"
                      >
                        ✅ Mark Resolved
                      </button>
                    )}
                  </div>
                  {issue.escalationLetter && (
                    <div className="mt-3 p-3 bg-red-950 border border-red-900 rounded-lg">
                      <p className="text-red-400 text-xs font-bold mb-2">📨 AUTO-ESCALATED TO AUTHORITIES</p>
                      <p className="text-gray-300 text-xs leading-relaxed">{issue.escalationLetter}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* AI Insights Tab */}
        {activeTab === "insights" && (
          <div>
            <button
              onClick={generateInsights}
              disabled={insightsLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl p-4 font-bold mb-4 disabled:opacity-40"
            >
              {insightsLoading ? "🤖 Analyzing..." : "🔄 Refresh Insights"}
            </button>

            {!insights && !insightsLoading && (
              <p className="text-gray-500 text-center py-8">No insights generated yet. Tap refresh above.</p>
            )}

            {insights && (
              <div className="space-y-3">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-orange-400 font-semibold mb-1">📍 Hotspots</p>
                  <p className="text-gray-300 text-sm">{insights.hotspots}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-orange-400 font-semibold mb-1">📈 Trends</p>
                  <p className="text-gray-300 text-sm">{insights.trends}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-orange-400 font-semibold mb-1">⚡ Priority</p>
                  <p className="text-gray-300 text-sm">{insights.priority}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-orange-400 font-semibold mb-1">🏢 Department</p>
                  <p className="text-gray-300 text-sm">{insights.department}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                  <p className="text-orange-400 font-semibold mb-1">🚨 Risk Alert</p>
                  <p className="text-gray-300 text-sm">{insights.riskAlert}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Duplicate Detection Modal */}
      {duplicateIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[9999] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm border border-orange-800">
            <p className="text-orange-400 font-bold mb-3">⚠️ Similar issue already exists</p>
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <p className="font-bold">{duplicateIssue.category}</p>
              <p className="text-gray-400 text-sm mt-1">📍 {duplicateIssue.location}</p>
              <p className="text-gray-300 text-sm mt-2">{duplicateIssue.summary}</p>
              <p className="text-orange-300 text-xs mt-2">👍 Verified by {duplicateIssue.votes} citizens</p>
            </div>
            <button onClick={confirmDuplicateVerify} className="w-full bg-orange-500 hover:bg-orange-600 rounded-xl p-3 font-bold mb-2">
              Verify Existing Issue
            </button>
            <button onClick={forceCreateNew} className="w-full bg-gray-800 hover:bg-gray-700 rounded-xl p-3 font-semibold text-gray-300">
              Create New Report Anyway
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;