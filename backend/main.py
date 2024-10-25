import os
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, Dict, Any
from k8s_client import get_queues, get_workloads
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Kueue Visualization API", version="1.0")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")  # Default to localhost for local testing

# Allow CORS for the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://frontend-kueue-viz.apps.rosa.akram.s25d.p3.openshiftapps.com"],
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


# WebSocket setup
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/kueue")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Fetch data periodically and broadcast it
            data = {
                "queues": get_queues(),
                "workloads": get_workloads()
            }
            await manager.broadcast(data)
            await asyncio.sleep(5)  # Polling interval: 5 seconds
    except WebSocketDisconnect:
        manager.disconnect(websocket)
