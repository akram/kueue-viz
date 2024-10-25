import os
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional, Dict, Any
from k8s_client import get_queues, get_workloads
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Kueue Visualization API", version="1.0")


frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")  # Default to localhost for local testing

# Allow CORS for the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url,"http://frontend-kueue-viz.apps.rosa.akram.s25d.p3.openshiftapps.com"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class KueueStatusResponse(BaseModel):
    queues: Optional[Dict[str, Any]] = None
    workloads: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@app.get("/kueue/status", response_model=KueueStatusResponse)
async def get_kueue_status():
    """
    Fetches the current status of Kueue queues and workloads.
    """
    queues = get_queues()
    workloads = get_workloads()

    # Combine errors if resources are not found
    if "error" in queues or "error" in workloads:
        error_message = queues.get("error", "") + workloads.get("error", "")
        return {"error": error_message}

    return {"queues": queues, "workloads": workloads}




