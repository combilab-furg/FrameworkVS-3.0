from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse
from utils.framework_writer import generate_vsframework
import os

router = APIRouter()

@router.post("/generate-script")
async def generate_script(
    ligand_folder: str = Form(...),
    receptor_folder: str = Form(...),
    center_x: float = Form(...),
    center_y: float = Form(...),
    center_z: float = Form(...),
    size_x: float = Form(...),
    size_y: float = Form(...),
    size_z: float = Form(...),
    box_step_x: float = Form(0.0),
    box_step_y: float = Form(0.0),
    box_step_z: float = Form(0.0),
    box_count_x: int = Form(1),
    box_count_y: int = Form(1),
    box_count_z: int = Form(1),
    exhaustiveness: int = Form(8),
    output_path: str = Form("outputs/vsframework.py")
):
    try:
        # ✅ Build the box_step and box_count tuples
        box_step = (box_step_x, box_step_y, box_step_z)
        box_count = (box_count_x, box_count_y, box_count_z)

        # ✅ Call the updated generate_vsframework()
        script_path = generate_vsframework(
            ligand_folder=ligand_folder,
            receptor_folder=receptor_folder,
            box_center=(center_x, center_y, center_z),
            box_size=(size_x, size_y, size_z),
            box_step=box_step,
            box_count=box_count,
            exhaustiveness=exhaustiveness,
            output_path=output_path
        )

        return {"status": "success", "vsframework_path": script_path}

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
