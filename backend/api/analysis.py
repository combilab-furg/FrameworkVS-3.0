# backend/api/analysis.py

from fastapi import APIRouter, Query, HTTPException
from core.plip_runner import run_plip_analysis

router = APIRouter()

@router.get("/plip")
def analyze_interactions(pdbqt_file: str = Query(...)):
    """
    Run PLIP interaction analysis on a converted docking result (PDB).
    """
    try:
        report = run_plip_analysis(pdbqt_file)
        return {"status": "success", "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
