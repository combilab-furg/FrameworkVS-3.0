# ml_models/run_rfscore.py
import argparse
import os

parser = argparse.ArgumentParser()
parser.add_argument("--input", required=True, help="Path to docking results (folder)")
parser.add_argument("--output", required=True, help="Output folder for scores")
args = parser.parse_args()

# Create the output folder if it doesn't exist
os.makedirs(args.output, exist_ok=True)

# Simulate scoring results
output_file = os.path.join(args.output, "rfscore_results.csv")
with open(output_file, "w") as f:
    f.write("Ligand,Receptor,RFScore\n")
    f.write("ligand1,receptor1,7.85\n")
    f.write("ligand2,receptor1,6.94\n")

print(f"✅ RF-Score finished. Results written to: {output_file}")
