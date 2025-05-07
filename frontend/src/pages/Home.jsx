// src/pages/Home.jsx
import { Link } from "react-router-dom";
import moleculeImage from "../assets/molecule.jpg"; // Ensure you have an image here

export default function Home() {   
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-50 flex flex-col">
      {/* Background image */}
      <img src={moleculeImage} alt="Molecular Docking" className="absolute inset-0 w-full h-full object-cover opacity-30" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm"></div>

      {/* Main content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-4 text-center z-10">
        <h1 className="text-5xl font-extrabold text-blue-700 mb-4">FrameworkVS 3.0</h1>
        <p className="text-lg text-gray-700 max-w-2xl mb-8">
          A modern virtual screening tool for ligand-receptor docking simulations and analysis.
        </p>

        <div className="flex gap-6">
          <Link to="/new-docking">
            <button className="bg-blue-500 text-white py-3 px-8 rounded-full text-lg hover:bg-blue-700 shadow-lg">
              ➕ New Docking
            </button>
          </Link>
          <Link to="/advanced-analysis">
            <button className="bg-gray-500 text-white py-3 px-8 rounded-full text-lg hover:bg-gray-700 shadow-lg">
              🧬 Advanced Analysis
            </button>
          </Link>
        </div>
      </div>

      {/* Footer pinned to bottom */}
      <footer className="relative z-10 text-center text-sm text-gray-600 py-4">
        © Combi-Lab VS 2025. All rights reserved.
      </footer>
    </div>
  );
}

