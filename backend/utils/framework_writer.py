import os
from textwrap import dedent
from typing import List


def generate_vsframework(
    ligand_folder: str,
    receptor_folder: str,
    box_center,
    box_size,
    box_step,
    box_count,
    exhaustiveness: int,
    output_path="outputs/vsframework.py"
):
    # Resolve absolute paths
    ligand_folder = os.path.abspath(ligand_folder)
    receptor_folder = os.path.abspath(receptor_folder)

    script = dedent(f"""\
    #!/usr/bin/env python
    import os
    import subprocess
    from concurrent.futures import ProcessPoolExecutor
    import re
    import sys

    ####################################################
    # Ensure Vina 1.2.1+ is installed before running
    ####################################################
    def check_vina_version():
        global vina_version
        try:
            result = subprocess.run(["vina", "--version"], capture_output=True, text=True)
            version_output = result.stdout.strip()
            match = re.search(r'(\\d+)\\.(\\d+)\\.(\\d+)', version_output)
            if not match:
                print("❌ Unable to parse Vina version.")
                sys.exit(1)
            major, minor, patch = map(int, match.groups())
            vina_version = (major, minor, patch)
            if vina_version < (1, 2, 1):
                print(f"❌ AutoDock Vina {{major}}.{{minor}}.{{patch}} is too old. FrameworkVS 3.0 requires Vina 1.2.1 or newer.")
                sys.exit(1)
            print(f"✅ AutoDock Vina version {{major}}.{{minor}}.{{patch}} is supported.")
        except Exception as e:
            print("❌ Failed to detect AutoDock Vina. Please ensure it is installed and in your PATH.")
            print(e)
            sys.exit(1)

    check_vina_version()

    ##########################################################
    # Check if Open Babel is available for format conversion
    ##########################################################
    def check_obabel():
        try:
            subprocess.run(["obabel", "-V"], capture_output=True, text=True, check=True)
        except Exception as e:
            print("🚨 Open Babel (obabel) is not installed or not in PATH.")
            print("👉 Please install it first. Example:")
            print("   sudo apt install openbabel")
            exit(1)

    check_obabel()

    ##########################################################
    # Scan folder for ligand and receptor file formats
    ##########################################################
    def scan_folder(folder, allowed_exts=(".pdbqt", ".pdb", ".mol2", ".sdf", ".cif")):
        files = []
        if not os.path.exists(folder):
            print(f"❌ Folder does not exist: {{folder}}")
            return files
        for file in os.listdir(folder):
            if file.lower().endswith(allowed_exts):
                files.append(os.path.join(folder, file))
        return files

    ##########################################################
    # Convert input files to .pdbqt if needed using obabel
    ##########################################################
    def convert_to_pdbqt(path):
        if not os.path.exists(path):
            print(f"❌ File does not exist: {{path}}")
            return None
        if path.endswith(".pdbqt"):
            print(f"✅ Already PDBQT: {{path}}")
            return path
        output = path.rsplit(".", 1)[0] + ".pdbqt"
        if os.path.exists(output):
            print(f"⏭️ Skipping conversion (already exists): {{output}}")
            return output
        print(f"🔄 Converting {{path}} → {{output}}...")
        try:
            result = subprocess.run(["obabel", path, "-O", output], capture_output=True, text=True)
            if result.returncode != 0:
                print(f"❌ Conversion failed: {{result.stderr.strip()}}")
                return None
            if not os.path.exists(output):
                print(f"❌ Output file not created: {{output}}")
                return None
            print(f"✅ Converted: {{output}}")
            return output
        except Exception as e:
            print(f"🚨 Error converting {{path}}: {{str(e)}}")
            return None

    # === Ligand & Receptor Folders ===
    ligand_folder = r"{ligand_folder}"
    receptor_folder = r"{receptor_folder}"

    # === Load Ligands ===
    if os.path.isdir(ligand_folder):
        ligands = scan_folder(ligand_folder)
    else:
        ligands = [ligand_folder]

    # === Load Receptors ===
    if os.path.isdir(receptor_folder):
        receptors = scan_folder(receptor_folder)
    else:
        receptors = [receptor_folder]

    # === Apply conversion ===
    ligands = [convert_to_pdbqt(l) for l in ligands]
    ligands = [l for l in ligands if l]
    receptors = [convert_to_pdbqt(r) for r in receptors]
    receptors = [r for r in receptors if r]

    # === Filter ligands to avoid duplicates with receptors ===
    receptor_basenames = {{os.path.splitext(os.path.basename(r))[0] for r in receptors}}
    filtered_ligands = []
    for l in ligands:
        l_base = os.path.splitext(os.path.basename(l))[0]
        if l_base not in receptor_basenames:
            filtered_ligands.append(l)
        else:
            print(f"⚠️ Skipping ligand {{l}} (same name as a receptor)")
    ligands = filtered_ligands

    # === Box Configuration ===
    class Vector3:
        def __init__(self, x, y, z):
            self.x = float(x)
            self.y = float(y)
            self.z = float(z)

        def __add__(self, other):
            return Vector3(self.x + other.x, self.y + other.y, self.z + other.z)

        def __str__(self):
            return f"({{self.x}}, {{self.y}}, {{self.z}})"

    box_center = Vector3({box_center[0]}, {box_center[1]}, {box_center[2]})
    box_size = Vector3({box_size[0]}, {box_size[1]}, {box_size[2]})
    box_step = Vector3({box_step[0]}, {box_step[1]}, {box_step[2]})
    box_count = Vector3({box_count[0]}, {box_count[1]}, {box_count[2]})
 
    ###############################
    # === Output Configuration ===#
    ###############################

    output_path = r"{output_path}"
    hierarchy = {{
        "brothers": ["Receptors"],
        "children": {{
            "brothers": ["Ligands"],
            "children": {{
                "brothers": ["Box Centers"]
            }}
        }}
    }}

    # === Vina Command ===
    def vina_command(ligand, receptor, box_center, box_size, output):
        return [
            "vina",
            "--receptor", receptor,
            "--ligand", ligand,
            "--center_x", str(box_center.x),
            "--center_y", str(box_center.y),
            "--center_z", str(box_center.z),
            "--size_x", str(box_size.x),
            "--size_y", str(box_size.y),
            "--size_z", str(box_size.z),
            "--exhaustiveness", "8",
            "--out", f"{{output}}_out.pdbqt"
        ]

    # === Helper: Build output dir path ===
    def generate_output(ligand, receptor, center, hierarchy, base, center_str):
        parts = []
        for level in hierarchy.get("brothers", []):
            if level == "Ligands":
                ligand_name = os.path.basename(ligand)
                for ext in [".pdbqt", ".pdb", ".mol2", ".sdf"]:
                    if ligand_name.endswith(ext):
                        ligand_name = ligand_name[:-len(ext)]
                        break
                parts.append(ligand_name)
            elif level == "Receptors":
                receptor_name = os.path.basename(receptor)
                for ext in [".pdbqt", ".pdb", ".mol2", ".sdf", ".cif"]:
                    if receptor_name.endswith(ext):
                        receptor_name = receptor_name[:-len(ext)]
                        break
                parts.append(receptor_name)
            elif level == "Box Centers":
                parts.append(center_str)
        out_dir = os.path.join(base, "-".join(parts))
        if "children" in hierarchy:
            return generate_output(ligand, receptor, center, hierarchy["children"], out_dir, center_str)
        return out_dir

    # === Run Single Docking ===
    def run_single_docking(task):
        cmd, ligand, receptor, center_str, output = task
        checkpoint_file = os.path.join(os.path.dirname(output_path), "checkpoint.txt")
        unique_key = f"{{os.path.basename(ligand)}}::{{os.path.basename(receptor)}}::{{center_str}}"
        
        if os.path.exists(checkpoint_file):
            with open(checkpoint_file, "r") as f:
                completed = set(line.strip() for line in f)
            if unique_key in completed:
                print(f"✔ Skipping: {{unique_key}}")
                return

        print(f"🧪 Running: {{' '.join(cmd)}}")
        
        try:
            log_path = f"{{output}}_log.txt"
            with open(log_path, "w") as log_file:
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    universal_newlines=True
                )
                for line in process.stdout:
                    print(line, end="")
                    log_file.write(line)
                exit_code = process.wait()

            out_file = f"{{output}}_out.pdbqt"
            if exit_code == 0 and os.path.exists(out_file):
                os.makedirs(os.path.dirname(checkpoint_file), exist_ok=True)
                with open(checkpoint_file, "a") as f:
                    f.write(unique_key + "\\n")
            else:
                print(f"❌ Failed or missing {{out_file}} for: {{unique_key}}")
        except Exception as e:
            print(f"🚨 Error running docking: {{str(e)}}")

    # === Generate all docking tasks ===
    def generate_tasks():
        tasks = []
        for ligand in ligands:
            for receptor in receptors:
                for dx in range(int(box_count.x)):
                    for dy in range(int(box_count.y)):
                        for dz in range(int(box_count.z)):
                            offset = Vector3(
                                box_step.x * dx,
                                box_step.y * dy,
                                box_step.z * dz
                            )
                            center = box_center + offset
                            center_str = f"{{center.x}}_{{center.y}}_{{center.z}}"
                            output = generate_output(ligand, receptor, center, hierarchy, output_path, center_str)
                            os.makedirs(os.path.dirname(output), exist_ok=True)
                            cmd = vina_command(ligand, receptor, center, box_size, output)
                            tasks.append((cmd, ligand, receptor, center_str, output))
        return tasks

    # === Run all docking tasks in parallel ===
    def run_docking():
        tasks = generate_tasks()
        print(f"🔵 Total docking tasks: {{len(tasks)}}")
        with ProcessPoolExecutor() as executor:
            executor.map(run_single_docking, tasks)

    if __name__ == "__main__":
        run_docking()
    """)

    if os.path.isdir(output_path):
        output_path = os.path.join(output_path, "vsframework.py")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(script)

    return output_path
