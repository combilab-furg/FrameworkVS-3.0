import { useRef, useState } from "react";
import axios from "../../axios";

export default function PlipForm() {
  const [ligandFile, setLigandFile] = useState(null);
  const [receptorFile, setReceptorFile] = useState(null);
  const [ligandName, setLigandName] = useState("");
  const [receptorName, setReceptorName] = useState("");
  const [outputFolder, setOutputFolder] = useState("");
  const [status, setStatus] = useState("");
  const [reportPath, setReportPath] = useState("");

  const ligandInputRef = useRef(null);
  const receptorInputRef = useRef(null);

  const handleLigandBrowse = () => ligandInputRef.current.click();
  const handleReceptorBrowse = () => receptorInputRef.current.click();

  const handleLigandSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLigandFile(file);
      setLigandName(file.name);
    }
  };

  const handleReceptorSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceptorFile(file);
      setReceptorName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ligandFile || !receptorFile || !outputFolder.trim()) {
      setStatus("❌ Please select ligand, receptor, and output folder.");
      return;
    }

    const formData = new FormData();
    formData.append("ligand", ligandFile);
    formData.append("receptor", receptorFile);
    formData.append("output_folder", outputFolder);

    setStatus("⏳ Running PLIP analysis...");
    setReportPath("");

    try {
      const { data } = await axios.post(
        "/advanced/plip",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setStatus(`✅ ${data.message}`);
      setReportPath(data.report);
    } catch (err) {
      setStatus(`❌ Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  // Build a client-accessible URL for download
  const downloadUrl = reportPath
    ? `${axios.defaults.baseURL}/advanced/plip-report?path=${encodeURIComponent(reportPath)}`
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Ligand file selection */}
      <div>
        <label className="block font-medium mb-1">Ligand File</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={ligandName}
            readOnly
            placeholder="Choose ligand file..."
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
          <button
            type="button"
            onClick={handleLigandBrowse}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            📂 Browse
          </button>
          <input
            type="file"
            ref={ligandInputRef}
            className="hidden"
            accept=".pdb,.pdbqt,.mol2"
            onChange={handleLigandSelect}
          />
        </div>
      </div>

      {/* Receptor file selection */}
      <div>
        <label className="block font-medium mb-1">Receptor File</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={receptorName}
            readOnly
            placeholder="Choose receptor file..."
            className="flex-1 border border-gray-300 rounded px-3 py-2"
          />
          <button
            type="button"
            onClick={handleReceptorBrowse}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            📂 Browse
          </button>
          <input
            type="file"
            ref={receptorInputRef}
            className="hidden"
            accept=".pdb,.pdbqt,.cif"
            onChange={handleReceptorSelect}
          />
        </div>
      </div>

      {/* Output folder path */}
      <div>
        <label className="block font-medium mb-1">Output Folder</label>
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full"
          value={outputFolder}
          onChange={(e) => setOutputFolder(e.target.value)}
          placeholder="/path/to/output"
          required
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Run PLIP
      </button>

      {/* Status feedback */}
      {status && <pre className="mt-2 whitespace-pre-wrap text-sm">{status}</pre>}

      {/* Download link */}
      {reportPath && (
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-2 text-blue-600 hover:underline"
        >
          📥 Download PLIP Report
        </a>
      )}
    </form>
  );
}
