# backend/core/plip_runner.py

import os
from plip.structure.preparation import PDBComplex
from plip.exchange.report import BindingSiteReport

def run_plip_analysis(pdbqt_path: str) -> dict:
    pdb_path = pdbqt_path.replace(".pdbqt", ".pdb")

    if not os.path.exists(pdb_path):
        raise FileNotFoundError(f"PDB file not found: {pdb_path}")

    protlig = PDBComplex()
    protlig.load_pdb(pdb_path)
    protlig.analyze()

    report = {}

    for key, site in protlig.interaction_sets.items():
        report[key] = BindingSiteReport(site).to_dict()

    return report
