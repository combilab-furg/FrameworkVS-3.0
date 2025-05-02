// src/pages/AdvancedAnalysisPage.jsx
import { useState } from "react";
import ActionSelector from "../components/analysis/ActionSelector";
import PlipForm from "../components/analysis/PlipForm";
import ScoringForm from "../components/analysis/ScoringForm";
import RunVsframeworkForm from "../components/analysis/RunVsframeworkForm";

export default function AdvancedAnalysisPage() {
  const [selectedAction, setSelectedAction] = useState("");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Advanced Analysis</h1>

      <ActionSelector selectedAction={selectedAction} setSelectedAction={setSelectedAction} />

      <div className="mt-6">
        {selectedAction === "plip" && <PlipForm />}
        {selectedAction === "plip take image" && <PlipForm />}
        {selectedAction === "scoring" && <ScoringForm />}
        {selectedAction === "run-vsframework" && <RunVsframeworkForm />}
      </div>
    </div>
  );
}
