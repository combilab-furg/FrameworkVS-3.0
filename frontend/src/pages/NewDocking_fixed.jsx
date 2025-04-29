
import { useState, useRef } from "react";
import axios from 'axios';

export default function NewDocking() {
  const ligandFileRef = useRef(null);
  const receptorFileRef = useRef(null);

  const [basePath, setBasePath] = useState(localStorage.getItem("basePath") || "");
  const [showBasePathModal, setShowBasePathModal] = useState(!localStorage.getItem("basePath"));

  const [ligandFile, setLigandFile] = useState(null);
  const [receptorFile, setReceptorFile] = useState(null);
  const [ligandPath, setLigandPath] = useState("");
  const [receptorPath, setReceptorPath] = useState("");
  const [outputFolder, setOutputFolder] = useState("");
  const [box, setBox] = useState({
    centerX: "", centerY: "", centerZ: "",
    sizeX: "", sizeY: "", sizeZ: ""
  });
  const [exhaustiveness, setExhaustiveness] = useState(8);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleBasePathConfirm = () => {
    if (basePath.trim() !== "") {
      localStorage.setItem("basePath", basePath.trim());
      setShowBasePathModal(false);
    }
  };

  const resetBasePath = () => {
    localStorage.removeItem("basePath");
    setBasePath("");
    setShowBasePathModal(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!ligandPath) newErrors.ligandPath = "Ligand Path is required";
    if (!receptorPath) newErrors.receptorPath = "Receptor Path is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    const formData = new FormData();
    formData.append("ligand", ligandFile);
    formData.append("receptor", receptorFile);
    formData.append("center_x", box.centerX);
    formData.append("center_y", box.centerY);
    formData.append("center_z", box.centerZ);
    formData.append("size_x", box.sizeX);
    formData.append("size_y", box.sizeY);
    formData.append("size_z", box.sizeZ);
    formData.append("exhaustiveness", exhaustiveness);
    formData.append("output_path", outputFolder || "");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/docking/generate-script",
        formData
      );
      alert(`✅ Success: ${response.data.status}\n📄 File: ${response.data.vsframework_path}`);
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data ||
        error.message ||
        "Unknown error occurred";
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {showBasePathModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-blue-700">📂 Set Your Base Directory</h3>
            <p className="text-sm text-gray-500 mb-3">
              Please enter the full folder path where your ligand and receptor files are stored.
              We'll use this to construct the full file paths in the generated script.
            </p>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md mb-4"
              value={basePath}
              onChange={(e) => setBasePath(e.target.value)}
              placeholder="/home/username/docking"
            />
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
                onClick={() => setShowBasePathModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                onClick={handleBasePathConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 pt-28 pb-10 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-8">
          <h2 className="text-3xl font-bold text-blue-700 text-center mb-8">
            🧬 New Docking Configuration
          </h2>

          {/* The rest of your form remains unchanged... */}
        </div>
      </div>
    </>
  );
}
