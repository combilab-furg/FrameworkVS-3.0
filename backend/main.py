
# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import docking, file_upload
from api import docking, analysis, file_upload
from api import docking  # 
from api import convert
from routes import advanced_analysis

app = FastAPI(title="FrameworkVS 3.0 Backend")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(docking.router, prefix="/docking")
app.include_router(analysis.router, prefix="/analysis")
app.include_router(file_upload.router, prefix="/files")
app.include_router(docking.router, prefix="/docking")
app.include_router(convert.router, prefix="/convert")
app.include_router(advanced_analysis.router)
@app.get("/")
def read_root():
    return {"message": "FrameworkVS 3.0 Backend is running!"}
