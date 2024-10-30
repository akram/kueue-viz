import os
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, Dict, Any, List, Callable
from k8s_client import *
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Kueue Visualization API", version="1.0")
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")  # Default to localhost for local testing

# Allow CORS for the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://frontend-kueue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class KueueStatusResponse(BaseModel):
    queues: Optional[Dict[str, Any]] = None
    workloads: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class LocalQueue(BaseModel):
    name: str
    status: str
    # Add more fields as required

class ClusterQueue(BaseModel):
    name: str
    flavor: str
    # Add more fields as required

@app.get("/kueue/status", response_model=KueueStatusResponse)
async def get_kueue_status():
    """
    Fetches the current status of Kueue queues and workloads.
    """
    queues = get_queues()
    workloads = get_workloads()
    flavors = get_resource_flavors()

    # Combine errors if resources are not found
    if "error" in queues or "error" in workloads or "error" in flavors :
        error_message = queues.get("error", "") + workloads.get("error", "") + flavors.get("error", "")
        return {"error": error_message}

    return {"queues": queues, "workloads": workloads, "flavors": flavors}


@app.get("/local-queues", response_model=List[LocalQueue])
async def get_local_queues_endpoint():
    """
    Fetches details about local queues.
    """
    return get_local_queues()  # Calls the function defined in k8s_client

@app.get("/cluster-queues", response_model=List[ClusterQueue])
async def get_cluster_queues_endpoint():
    """
    Fetches details about cluster queues and their flavors.
    """
    return get_cluster_queues()  # Calls the function defined in k8s_client


@app.get("/kueue/workload/{workload_name}")
async def get_workload_detail(workload_name: str):
    workload = get_workload_by_name(workload_name)
    if workload is None:
        raise HTTPException(status_code=404, detail="Workload not found")
    return workload


@app.get("/kueue/workload/{workload_name}/events")
async def get_workload_events(workload_name: str):
    events = get_events_by_workload_name(workload_name)
    return events

# Generic WebSocket setup
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, endpoint: str):
        await websocket.accept()
        if endpoint not in self.active_connections:
            self.active_connections[endpoint] = []
        self.active_connections[endpoint].append(websocket)

    def disconnect(self, websocket: WebSocket, endpoint: str):
        if endpoint in self.active_connections:
            self.active_connections[endpoint].remove(websocket)

    async def broadcast(self, message: dict, endpoint: str):
        for connection in self.active_connections.get(endpoint, []):
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error sending message on {endpoint}: {e}")
                self.disconnect(connection, endpoint)

manager = ConnectionManager()

async def websocket_handler(websocket: WebSocket, data_fetcher: Callable, endpoint: str, interval: int = 5):
    """
    Generic WebSocket handler to fetch data and broadcast updates.
    
    Parameters:
    - websocket: WebSocket instance
    - data_fetcher: Callable function to fetch data
    - endpoint: Unique endpoint identifier for managing connections
    - interval: Polling interval in seconds
    """
    await manager.connect(websocket, endpoint)
    try:
        while True:
            # Fetch data periodically and broadcast it
            data = data_fetcher()
            await manager.broadcast(data, endpoint)
            await asyncio.sleep(interval)  # Polling interval
    except WebSocketDisconnect:
        manager.disconnect(websocket, endpoint)
    except Exception as e:
        print(f"Unhandled exception in WebSocket endpoint {endpoint}: {e}")
        manager.disconnect(websocket, endpoint)


@app.websocket("/ws/kueue")
async def websocket_kueue(websocket: WebSocket):
    await websocket_handler(websocket, lambda: {"queues": get_queues(), "clusterQueues": get_cluster_queues(), "workloads": get_workloads(), "flavors": get_resource_flavors()}, "/ws/kueue")

@app.websocket("/ws/workloads")
async def websocket_kueue(websocket: WebSocket):
    await websocket_handler(websocket,  lambda: {"workloads": get_workloads()}, "/ws/workloads")

@app.websocket("/ws/local-queues")
async def websocket_local_queues(websocket: WebSocket):
    await websocket_handler(websocket, get_local_queues, "/ws/local-queues")

@app.websocket("/ws/cluster-queues")
async def websocket_cluster_queues(websocket: WebSocket):
    await websocket_handler(websocket, get_cluster_queues, "/ws/cluster-queues")

@app.websocket("/ws/cluster-queue/{cluster_queue_name}")
async def websocket_resource_flavor_details(websocket: WebSocket, cluster_queue_name: str):
    await websocket_handler(websocket, lambda: get_cluster_queue_details(cluster_queue_name), f"/ws/cluster-queue/{cluster_queue_name}")



# New WebSocket endpoint for individual workload updates
@app.websocket("/ws/workload/{workload_name}")
async def websocket_workload(websocket: WebSocket, workload_name: str):
    await websocket_handler(websocket, lambda: get_workload_by_name(workload_name), f"/ws/workload/{workload_name}")

@app.websocket("/ws/workload/{workload_name}/events")
async def websocket_workload_events(websocket: WebSocket, workload_name: str):
    await manager.connect(websocket, f"/ws/workload/{workload_name}/events")
    try:
        while True:
            events = get_events_by_workload_name(workload_name)
            await manager.broadcast(events, f"/ws/workload/{workload_name}/events")
            await asyncio.sleep(5)  # Polling interval for new events
    except WebSocketDisconnect:
        manager.disconnect(websocket, f"/ws/workload/{workload_name}/events")
    except Exception as e:
        print(f"Unhandled exception in WebSocket events endpoint for {workload_name}: {e}")
        manager.disconnect(websocket, f"/ws/workload/{workload_name}/events")

@app.websocket("/ws/resource-flavors")
async def websocket_resource_flavors(websocket: WebSocket):
    await websocket_handler(websocket, get_resource_flavors, "/ws/resource-flavors")

@app.websocket("/ws/resource-flavor/{flavor_name}")
async def websocket_resource_flavor_details(websocket: WebSocket, flavor_name: str):
    await websocket_handler(websocket, lambda: get_resource_flavor_details(flavor_name), f"/ws/resource-flavor/{flavor_name}")

@app.websocket("/ws/local-queue/{queue_name}")
async def websocket_local_queue_details(websocket: WebSocket, queue_name: str):
    await websocket_handler(websocket, lambda: get_local_queue_details(queue_name), f"/ws/local-queue/{queue_name}")

@app.websocket("/ws/local-queue/{queue_name}/workloads")
async def websocket_local_queue_workloads(websocket: WebSocket, queue_name: str):
    await websocket_handler(websocket, lambda: get_admitted_workloads(queue_name), f"/ws/local-queue/{queue_name}/workloads")

@app.websocket("/ws/cohorts")
async def websocket_cohorts(websocket: WebSocket):
        await websocket_handler(websocket, get_cohorts,"/ws/cohorts")


@app.websocket("/ws/cohort/{cohort_name}")
async def websocket_cohort_details(websocket: WebSocket, cohort_name: str):
    await websocket_handler(websocket, lambda: get_cohort_details(cohort_name),f"/ws/cohort/{cohort_name}")

