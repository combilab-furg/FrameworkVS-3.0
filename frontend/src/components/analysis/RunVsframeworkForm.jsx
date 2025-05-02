// src/components/analysis/RunVsframeworkForm.jsx
import { useState } from "react";
import axios from "../../axios"; // your axios instance with baseURL
export default function RunVsframeworkForm() {
  const [scriptFile, setScriptFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleFileSelect = (e) => {
    setScriptFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scriptFile) return setStatus("❌ Please choose a Python script first.");

    setStatus("⏳ Uploading & running...");

    const formData = new FormData();
    formData.append("script", scriptFile);

    try {
      const { data } = await axios.post(
        "/advanced/run-vsframework",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setStatus(`✅ Success:\n${data.output || data.message}`);
    } catch (err) {
      setStatus(`❌ Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">Select vsframework.py</label>
        <input
          type="file"
          accept=".py"
          onChange={handleFileSelect}
          className="border border-gray-300 rounded px-3 py-2 w-full"
          required
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Run Script
      </button>

      {status && (
        <pre className="mt-2 whitespace-pre-wrap text-sm">{status}</pre>
      )}
    </form>
  );
}
