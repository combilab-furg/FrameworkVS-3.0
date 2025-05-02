# backend/core/plip_runner.py

import subprocess
from pathlib import Path

def convert_to_pdbqt_to_pdb(input_path: str, output_path: Path):
    result = subprocess.run(
        ["obabel", input_path, "-O", str(output_path)],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        raise RuntimeError(f"Open Babel conversion failed:\n{result.stderr}")

def run_plip(receptor_path: str, ligand_path: str, output_folder: str) -> str:
    base_out = Path(output_folder)
    base_out.mkdir(parents=True, exist_ok=True)

    # Convert both inputs
    rec_pdb = base_out / f"converted_{Path(receptor_path).stem}_receptor.pdb"
    lig_pdb = base_out / f"converted_{Path(ligand_path).stem}_ligand.pdb"
    convert_to_pdbqt_to_pdb(receptor_path, rec_pdb)
    convert_to_pdbqt_to_pdb(ligand_path, lig_pdb)

    # Combine
    combined = base_out / f"complex_{Path(ligand_path).stem}.pdb"
    with combined.open("w") as out:
        out.write(rec_pdb.read_text())
        out.write("\n")
        out.write(lig_pdb.read_text())

    # Output folder and filename
    ligand_stem = Path(ligand_path).stem
    out_dir = base_out / f"plip_{ligand_stem}"
    out_dir.mkdir(exist_ok=True)

    xml_name = f"plip_{ligand_stem}.xml"
    expected_path = out_dir / xml_name

    # Run PLIP
    proc = subprocess.run(
        [
            "plip",
            "-f", str(combined),
            "-o", str(out_dir),
            "-x",
            "--name", xml_name
        ],
        capture_output=True,
        text=True
    )
    if proc.returncode != 0:
        raise RuntimeError(f"PLIP failed:\n{proc.stderr}")

    # 🔄 Rename if PLIP adds .xml.xml
    actual_file = out_dir / f"{xml_name}.xml"
    if actual_file.exists():
        actual_file.rename(expected_path)

    return str(expected_path)
