import { useState,  useRef } from "react";
import axios from 'axios';
import { useEffect } from "react";


export default function NewDocking() {
    const ligandFileRef = useRef(null);
    const receptorFileRef = useRef(null);

    const [basePath, setBasePath] = useState(localStorage.getItem("basePath") || "");
    const [showBasePathModal, setShowBasePathModal] = useState(!localStorage.getItem("basePath"));

// we only need the arrays; if you still want a preview of “the first” file, you can derive it.
    const [ligandFiles,   setLigandFiles]   = useState([]);
    const [receptorFiles, setReceptorFiles] = useState([]);
    const [showAllLigands, setShowAllLigands] = useState(false);
    const [showAllReceptors, setShowAllReceptors] = useState(false);

// (optional) keep single‑file refs for NGL preview:
    const ligandFile = ligandFiles[0] || null;
    const receptorFile = receptorFiles[0] || null;


    const [ligandPath, setLigandPath] = useState("");
    const [receptorPath, setReceptorPath] = useState("");
    const [outputFolder, setOutputFolder] = useState("");
    const [varyGridBox, setVaryGridBox] = useState(false);
    const [box, setBox] = useState({
      centerX: "", centerY: "", centerZ: "",
      sizeX: "", sizeY: "", sizeZ: "",  // ← Add comma here
      stepX: "", stepY: "", stepZ: "",
      countX: "", countY: "", countZ: ""
    });
    
    const [exhaustiveness, setExhaustiveness] = useState(8);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isInitialSet, setIsInitialSet] = useState(!!localStorage.getItem("basePath"));



    useEffect(() => {
      const storedPath = localStorage.getItem("basePath");
      if (storedPath) {
        setBasePath(storedPath);
        setIsInitialSet(true);
      }
    }, []);
    
    const handleBasePathConfirm = () => {
      if (basePath.trim() !== "") {
        localStorage.setItem("basePath", basePath.trim());
        setIsInitialSet(true);               // ✔️ Update button label
        setShowBasePathModal(false);        // ✔️ Close modal
      }
    };

    const resetBasePath = () => {
      const stored = localStorage.getItem("basePath") || "";
      setBasePath(stored); // ✅ Load the stored value
      setShowBasePathModal(true); // ✅ Show modal again
    };
    

    const validateForm = () => {
      const newErrors = {};
      if (!ligandPath)       newErrors.ligandPath = "Ligand Path is required";
      if (!receptorPath)     newErrors.receptorPath = "Receptor Path is required";
      if (!ligandFiles.length)   newErrors.ligandPath = "Please select at least one ligand file/folder";
      if (!receptorFiles.length) newErrors.receptorPath = "Please select at least one receptor file/folder";
    
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async () => {
      if (!validateForm()) return;
    
      setIsLoading(true);
    
      try {
        const formData = new FormData();
    
        formData.append("ligand_folder", ligandPath);
        formData.append("receptor_folder", receptorPath);
    
        formData.append("center_x", box.centerX);
        formData.append("center_y", box.centerY);
        formData.append("center_z", box.centerZ);
        formData.append("size_x", box.sizeX);
        formData.append("size_y", box.sizeY);
        formData.append("size_z", box.sizeZ);
    
        if (varyGridBox) {
          formData.append("box_step_x", box.stepX);
          formData.append("box_step_y", box.stepY);
          formData.append("box_step_z", box.stepZ);
          formData.append("box_count_x", box.countX);
          formData.append("box_count_y", box.countY);
          formData.append("box_count_z", box.countZ);
        }
    
        formData.append("exhaustiveness", exhaustiveness);
        formData.append("output_path", outputFolder || "outputs/vsframework.py");
    
        const response = await axios.post(
          "http://127.0.0.1:8000/docking/generate-script",
          formData
        );
    
        const filePath = response.data.vsframework_path;
        const fileResponse = await axios.get(`http://127.0.0.1:8000/files/download?path=${encodeURIComponent(filePath)}`, {
          responseType: 'blob',
        });
    
        const url = window.URL.createObjectURL(new Blob([fileResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'vsframework.py');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    
        alert("✅ File downloaded: vsframework.py");
    
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
    
  
 
  // basePath Effect
  useEffect(() => {
    // ✅ Prevent crash: skip if NGL not loaded
    if (typeof window.NGL === "undefined") {
      console.warn("⚠️ NGL not loaded yet — skipping viewer setup.");
      return;
    }
  
    // ✅ Do nothing until at least one file is selected
    if (!receptorFile && !ligandFile) return;
  
    // ✅ Create the stage inside the <div id="nglViewer">
    const stage = new window.NGL.Stage("nglViewer", { backgroundColor: "white" });
  
    const loaders = [];
  
    const getExt = (filename) => {
      let ext = filename.split(".").pop().toLowerCase();
      return ext === "pdbqt" ? "pdb" : ext;
    };
  
    // ✅ Load receptor
    if (receptorFile) {
      const ext = getExt(receptorFile.name);
      const blob = new Blob([receptorFile], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
  
      loaders.push(
        stage.loadFile(url, { ext }).then((comp) => {
          comp.addRepresentation("cartoon", { color: "blue", opacity: 0.6 });
          URL.revokeObjectURL(url);
        })
      );
    }
  
    // ✅ Load ligand
    if (ligandFile) {
      const ext = getExt(ligandFile.name);
      const blob = new Blob([ligandFile], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
  
      loaders.push(
        stage.loadFile(url, { ext }).then((comp) => {
          comp.addRepresentation("ball+stick", {
            colorScheme: "element",
            radiusScale: 2.0
          });
          URL.revokeObjectURL(url);
        })
      );
    }
  
    // ✅ After both are loaded, zoom + show box
    Promise.all(loaders).then(() => {
      stage.autoView();
  
      const { centerX, centerY, centerZ, sizeX, sizeY, sizeZ } = box;
      if (centerX && centerY && centerZ && sizeX && sizeY && sizeZ) {
        const shape = new window.NGL.Shape("dockingBox");
        shape.addBox(
          [parseFloat(centerX), parseFloat(centerY), parseFloat(centerZ)],
          [0, 1, 0],
          [parseFloat(sizeX), parseFloat(sizeY), parseFloat(sizeZ)]
        );
        stage.loadShape(shape);
      }
    });
  
    // ✅ Cleanup on unmount or file change
    return () => {
      stage.dispose();
    };
  }, [receptorFile, ligandFile, box]);
  
  // your handleSubmit, handleBasePathConfirm, resetBasePath, validateForm...

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
            <p className="text-xs text-gray-400 mt-1">
              You can update this path anytime.
            </p>
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
                {basePath.trim() ? "Update" : "Confirm"}


              </button>
            </div>
          </div>
        </div>
      )}
    {/* Change Path link - top right */}
    <div className="absolute top-24 right-8 z-10">
    <p
      className="text-sm text-blue-600 cursor-pointer underline hover:text-blue-800"
      onClick={resetBasePath}
    >
      🔄 Change Base Path
    </p>
  </div>
    
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 pt-28 pb-10 px-4">
      <div className="max-w-4xl mx-auto bg-white/30 backdrop-blur-md rounded-xl shadow-lg p-4 sm:p-8">


        <h2 className="text-3xl font-bold text-blue-700 text-center mb-8">
          🧬 New Docking Configuration
        </h2>

{/* Ligand */}
<div className="mb-8">
  <div className="flex justify-between mb-2">
    <label className="text-lg font-semibold text-blue-700">🔗 Ligand Path</label>
    <span className="text-sm text-gray-500">Supported: .pdb, .mol2, .pdbqt, .sdf</span>
  </div>
  <input
    type="text"
    value={ligandPath}
    onChange={(e) => setLigandPath(e.target.value)}
    placeholder="Paste ligand path or use browse below"
    className={`w-full p-3 border rounded-md shadow-sm ${errors.ligandPath ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-400`}
  />
  {errors.ligandPath && <p className="text-red-500 text-sm mt-1">{errors.ligandPath}</p>}

  {/* Hidden inputs */}
  <input
    type="file"
    accept=".pdb,.mol2,.pdbqt,.sdf"
    hidden
    ref={(el) => (window.ligandFileInput = el)}
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) {
        
        const fullPath = file.path || `${basePath}/${file.name}`;
        setLigandPath(fullPath);
        setLigandFiles([file]); // ✅ Fix: wrap single file in array!
    
        // ✅ Auto-set output folder if not already filled
        if (!outputFolder) {
          const parentDir = fullPath.substring(0, fullPath.lastIndexOf("/"));
          setOutputFolder(parentDir);

    
        }
      }
    }}
  />
  <input
    type="file"
    hidden
    webkitdirectory="true"
    directory=""
    ref={(el) => (window.ligandFolderInput = el)}
    onChange={(e) => {
      const files = e.target.files;
      if (files.length > 0) {
        const fileArray = Array.from(files);
        setLigandFiles(fileArray);

        // ✅ Extract folder name from first file path
        const folderName = files[0].webkitRelativePath.split("/")[0];
  
        // ✅ Construct full path from basePath
        const fullPath = `${basePath}/${folderName}`;
              // ✅ Filter supported formats
        const validExts = [".pdbqt", ".pdb",".mol2", ".sdf"];
        const filtered = Array.from(files).filter(file =>
          validExts.includes(file.name.toLowerCase().slice(file.name.lastIndexOf(".")))
        );
        setLigandFiles(filtered);
  
        setLigandPath(fullPath);
  
        // ✅ Optional: auto-fill output folder if empty
        if (!outputFolder) {
          setOutputFolder(fullPath);
        }
      }
    }}
  />

  <div className="flex gap-3 mt-3">
    <button
      onClick={() => window.ligandFileInput.click()}
      className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm shadow hover:bg-blue-600"
    >
      📁 Browse File
    </button>
    <button
      onClick={() => window.ligandFolderInput.click()}
      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm shadow hover:bg-gray-400"
    >
      📂 Browse Folder
    </button>
  </div>
</div>
<ul className="text-sm text-gray-500 mt-2">
  {(showAllLigands ? ligandFiles : ligandFiles.slice(0, 4)).map((f) => (
    <li key={f.name}>📄 {f.name}</li>
  ))}
</ul>

{ligandFiles.length > 4 && (
  <p
    onClick={() => setShowAllLigands(!showAllLigands)}
    className="text-blue-600 text-sm mt-1 cursor-pointer hover:underline"
  >
    {showAllLigands ? "Show Less ▲" : `Show All (${ligandFiles.length}) ▼`}
  </p>
)}



{/* Receptor */}
<div className="mb-8">
  <div className="flex justify-between mb-2">
    <label className="text-lg font-semibold text-blue-700">🧬 Receptor Path</label>
    <span className="text-sm text-gray-500">Supported: .pdb, .pdbqt, .cif</span>
  </div>
  <input
    type="text"
    value={receptorPath}
    onChange={(e) => setReceptorPath(e.target.value)}
    placeholder="Paste receptor path or use browse below"
    className={`w-full p-3 border rounded-md shadow-sm ${errors.receptorPath ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-400`}
  />
  {errors.receptorPath && <p className="text-red-500 text-sm mt-1">{errors.receptorPath}</p>}

  {/* Hidden inputs */}
  <input
    type="file"
    accept=".pdb,.pdbqt,.cif"
    hidden
    ref={(el) => (window.receptorFileInput = el)}
    onChange={(e) => {
      const file = e.target.files[0];
      if (file) {
        setReceptorPath(`${basePath}/${file.name}`);
        setReceptorFiles([file]); // ✅ Fix: wrap single file in array!
      }
    }}
    
  />
<input
  type="file"
  hidden
  webkitdirectory="true"
  directory=""
  ref={(el) => (window.receptorFolderInput = el)}
  onChange={(e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const fileArray = Array.from(files);
      setReceptorFiles(fileArray);

      // ✅ Extract folder name from first file path
      const folderName = files[0].webkitRelativePath.split("/")[0];

      // ✅ Construct full path from basePath
      const fullPath = `${basePath}/${folderName}`;
            // ✅ Filter supported formats
      const validExts = [".pdbqt", ".pdb", ".cif"];
      const filtered = Array.from(files).filter(file =>
        validExts.includes(file.name.toLowerCase().slice(file.name.lastIndexOf(".")))
      );
      setReceptorFiles(filtered);

      setReceptorPath(fullPath);

      // ✅ Optional: auto-fill output folder if empty
      if (!outputFolder) {
        setOutputFolder(fullPath);
      }
    }
  }}
/>


  <div className="flex gap-3 mt-3">
    <button
      onClick={() => window.receptorFileInput.click()}
      className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm shadow hover:bg-blue-600"
    >
      📁 Browse File
    </button>
    <button
      onClick={() => window.receptorFolderInput.click()}
      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm shadow hover:bg-gray-400"
    >
      📂 Browse Folder
    </button>


  </div>
</div>
<ul className="text-sm text-gray-500 mt-2">
  {(showAllReceptors ? receptorFiles : receptorFiles.slice(0, 4)).map((f) => (
    <li key={f.name}>📄 {f.name}</li>
  ))}
</ul>

{receptorFiles.length > 4 && (
  <p
    onClick={() => setShowAllReceptors(!showAllReceptors)}
    className="text-blue-600 text-sm mt-1 cursor-pointer hover:underline"
  >
    {showAllReceptors ? "Show Less ▲" : `Show All (${receptorFiles.length}) ▼`}
  </p>
)}

        {/* Output Folder */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <label className="text-lg font-semibold text-blue-700"> Output Folder</label>
            <span className="text-sm text-gray-500">Default: backend/outputs</span>
          </div>
          <input
            type="text"
            value={outputFolder}
            onChange={(e) => setOutputFolder(e.target.value)}
            placeholder="Output Result path"
            className="w-full p-3 border rounded-md shadow-sm border-gray-300 focus:ring-2 focus:ring-blue-400"
          />
          {/* <div className="flex gap-3 mt-3">
            <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm shadow hover:bg-gray-400">📂 Browse Folder</button>
          </div> */}
        </div>

        {/* Grid Box */}
<div className="mb-8 p-4 bg-gray-50 rounded-md border border-gray-200">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-xl font-semibold text-blue-700">📦 Grid Box Parameters</h3>
    <span className="text-sm text-gray-400">Docking Box</span>
  </div>

  {/* Initial Box Center */}
  <div className="mb-4">
    <label className="block text-gray-600 mb-2 font-medium">Initial Box Center</label>
    <div className="grid grid-cols-3 gap-3">
      <input
        type="number"
        placeholder="X"
        value={box.centerX}
        onChange={(e) => setBox({...box, centerX: e.target.value})}
        className="p-3 rounded-md bg-gray-100 border border-gray-300 placeholder-gray-400"
      />
      <input
        type="number"
        placeholder="Y"
        value={box.centerY}
        onChange={(e) => setBox({...box, centerY: e.target.value})}
        className="p-3 rounded-md bg-gray-100 border border-gray-300 placeholder-gray-400"
      />
      <input
        type="number"
        placeholder="Z"
        value={box.centerZ}
        onChange={(e) => setBox({...box, centerZ: e.target.value})}
        className="p-3 rounded-md bg-gray-100 border border-gray-300 placeholder-gray-400"
      />
    </div>
  </div>

  {/* Box Size */}
  <div className="mb-4">
    <label className="block text-gray-600 mb-2 font-medium">Box Size</label>
    <div className="grid grid-cols-3 gap-3">
      <input
        type="number"
        placeholder="X"
        value={box.sizeX}
        onChange={(e) => setBox({...box, sizeX: e.target.value})}
        className="p-3 rounded-md bg-gray-100 border border-gray-300 placeholder-gray-400"
      />
      <input
        type="number"
        placeholder="Y"
        value={box.sizeY}
        onChange={(e) => setBox({...box, sizeY: e.target.value})}
        className="p-3 rounded-md bg-gray-100 border border-gray-300 placeholder-gray-400"
      />
      <input
        type="number"
        placeholder="Z"
        value={box.sizeZ}
        onChange={(e) => setBox({...box, sizeZ: e.target.value})}
        className="p-3 rounded-md bg-gray-100 border border-gray-300 placeholder-gray-400"
      />
    </div>
  </div>

  {/* Grid box vary checkbox */}
  <div className="flex items-start flex-col gap-4">
  <label className="flex items-center text-gray-600 font-medium">
    <input
      type="checkbox"
      id="varyGridBox"
      className="mr-2"
      checked={varyGridBox}
      onChange={(e) => setVaryGridBox(e.target.checked)}
    />
    Do you want the grid box to vary?
  </label>

  {varyGridBox && (
    <div className="w-full space-y-4">

      {/* Box Step */}
      <div>
        <label className="block text-gray-600 mb-2 font-medium">Box Step (Δx, Δy, Δz)</label>
        <div className="grid grid-cols-3 gap-3">
          <input type="number" placeholder="X" value={box.stepX} onChange={(e) => setBox({...box, stepX: e.target.value})} className="p-3 rounded-md border border-gray-300" />
          <input type="number" placeholder="Y" value={box.stepY} onChange={(e) => setBox({...box, stepY: e.target.value})} className="p-3 rounded-md border border-gray-300" />
          <input type="number" placeholder="Z" value={box.stepZ} onChange={(e) => setBox({...box, stepZ: e.target.value})} className="p-3 rounded-md border border-gray-300" />
        </div>
      </div>

      {/* Box Count */}
      <div>
        <label className="block text-gray-600 mb-2 font-medium">Box Count (Nx, Ny, Nz)</label>
        <div className="grid grid-cols-3 gap-3">
          <input type="number" placeholder="Count X" value={box.countX} onChange={(e) => setBox({...box, countX: e.target.value})} className="p-3 rounded-md border border-gray-300" />
          <input type="number" placeholder="Count Y" value={box.countY} onChange={(e) => setBox({...box, countY: e.target.value})} className="p-3 rounded-md border border-gray-300" />
          <input type="number" placeholder="Count Z" value={box.countZ} onChange={(e) => setBox({...box, countZ: e.target.value})} className="p-3 rounded-md border border-gray-300" />
        </div>
      </div>

    </div>
  )}
</div>
</div>

 {/* NGL Viewer Placeholder */}
{/* inside NewDocking.jsx render() */}
<div className="mt-10 bg-gray-10 border border-blue-200 p-6 rounded-lg text-center">
  <strong>🔬 Structure Viewer</strong>
  <div 
    id="nglViewer" 
    className="w-full h-96 mt-4 rounded-md shadow-inner" 
    style={{ background: "black" }} 
  />
</div>





        {/* Exhaustiveness */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-blue-700">⚙️ Vina Exhaustiveness</label>
          <input type="number" value={exhaustiveness} onChange={(e) => setExhaustiveness(e.target.value)} className="w-full p-3 border rounded-md shadow-sm border-gray-300 focus:ring-2 focus:ring-blue-400 mt-2"/>
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button onClick={handleSubmit} disabled={isLoading} className={`bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-full shadow-md ${isLoading ? "opacity-50" : ""}`}>
            {isLoading ? "Generating..." : "🚀 Generate Docking Script"}
          </button>
        </div>

      </div>
            {/* Footer pinned to bottom */}
      <footer className="relative z-10 text-center text-sm text-gray-600 py-4">
        © Combi-Lab VS 2025. All rights reserved.
      </footer>
      </div>
    </>
  );
  
}
