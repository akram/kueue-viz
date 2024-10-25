import os
from kubernetes import client, config

# Load Kubernetes configuration for in-cluster access
config.load_incluster_config()
k8s_api = client.CustomObjectsApi()

# Determine the namespace dynamically from the mounted file
def get_namespace():
    try:
        with open("/var/run/secrets/kubernetes.io/serviceaccount/namespace") as f:
            return f.read().strip()
    except IOError:
        # Fallback to "default" if file is not found (useful for testing outside Kubernetes)
        return "default"

namespace = get_namespace()

def get_queues():
    try:
        queues = k8s_api.list_namespaced_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            namespace=namespace,
            plural="localqueues"
        )
        return queues
    except client.ApiException as e:
        print(f"Error fetching queues: {e.status} {e.reason} - {e.body}")
        return {"error": e.body}

def get_workloads():
    try:
        workloads = k8s_api.list_namespaced_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            namespace=namespace,
            plural="workloads"
        )

        # Check if workloads are preempted and add preemption status/reason to each workload
        for workload in workloads['items']:
            preempted = workload.get('status', {}).get('preempted', False)
            preemption_reason = workload.get('status', {}).get('preemptionReason', 'None')

            workload['preemption'] = {
                'preempted': preempted,
                'reason': preemption_reason
            }

        return workloads
    except client.ApiException as e:
        print(f"Error fetching workloads: {e.status} {e.reason} - {e.body}")
        return {"error": e.body}



def get_queue_status(namespace: str = "default"):
    """
    Combines queue and workload data for a complete Kueue status.
    Args:
        namespace (str): The Kubernetes namespace to search for Kueue resources.
    Returns:
        dict: JSON response containing both queues and workloads.
    """
    return {
        "queues": get_queues(namespace),
        "workloads": get_workloads(namespace)
    }
