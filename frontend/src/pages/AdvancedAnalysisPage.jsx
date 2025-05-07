// src/pages/AdvancedAnalysisPage.jsx
import { useState } from "react";
import ActionSelector from "../components/analysis/ActionSelector";
import PlipForm from "../components/analysis/PlipForm";
import ScoringForm from "../components/analysis/ScoringForm";
import RunVsframeworkForm from "../components/analysis/RunVsframeworkForm";
import ResultsTable from "../components/analysis/ResultsTable"; // ← add this

export default function AdvancedAnalysisPage() {
  const [selectedAction, setSelectedAction] = useState("");
  const [csvPath, setCsvPath] = useState(""); // ← add this

  // maps the scoring method to the expected result file
  const getResultFilename = (method) => {
    return {
    //   vina: "vina_scores.csv",
      rfscore: "rfscore_results.csv",
    //   gnina: "gnina_scores.sdf", // optional
    }[method];
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Advanced Analysis</h1>

      <ActionSelector selectedAction={selectedAction} setSelectedAction={setSelectedAction} />

      <div className="mt-6">
        {selectedAction === "plip" && <PlipForm />}
        {selectedAction === "plip take image" && <PlipForm />}
        {selectedAction === "scoring" && (
          <>
            <ScoringForm
              onSuccess={(outputFolder, method) => {
                const fileName = getResultFilename(method);
                setCsvPath(`${outputFolder}/${fileName}`);
              }}
            />
            {csvPath && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-2">Scoring Results</h2>
                <ResultsTable csvPath={csvPath} />
              </div>
            )}
          </>
        )}
        {selectedAction === "run-vsframework" && <RunVsframeworkForm />}
      </div>
                  {/* Footer pinned to bottom */}
      <footer className="relative z-10 text-center text-sm text-gray-600 py-4">
        © Combi-Lab VS 2025. All rights reserved.
      </footer>
    </div>
  );
}
