import os
from kubernetes import client, config

# Load Kubernetes configuration for in-cluster access
config.load_incluster_config()
k8s_api = client.CustomObjectsApi()
core_api = client.CoreV1Api()

__all__ = [
    "get_queues",
    "get_workloads",
    "get_local_queues",
    "get_cluster_queues",
    "get_workload_by_name",
    "get_events_by_workload_name",
    "get_resource_flavors",
    "get_resource_flavor_details"
]

# Determine the namespace dynamically from the mounted file
def get_namespace():
    try:
        with open("/var/run/secrets/kubernetes.io/serviceaccount/namespace") as f:
            return f.read().strip()
    except IOError:
        # Fallback to "default" if file is not found (useful for testing outside Kubernetes)
        return "default"

namespace = get_namespace()

def get_local_queues():
    """
    Retrieves local queues within a specific namespace.
    """
    try:
        # Assuming 'localqueues' is the plural name for the local queue custom resources
        local_queues = k8s_api.list_namespaced_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            namespace=namespace,
            plural="localqueues"
        )
        return [
            {
                "name": item["metadata"]["name"],
                "status": item.get("status", {}).get("state", "Unknown"),
                # Add more fields as required
            }
            for item in local_queues.get("items", [])
        ]
    except client.ApiException as e:
        print(f"Error fetching local queues: {e}")
        return []

def get_cluster_queues():
    """
    Retrieves cluster queues and their flavors across the cluster.
    """
    try:
        cluster_queues = k8s_api.list_cluster_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            plural="clusterqueues"
        )
        return [
            {
                "name": queue["metadata"]["name"],
                "flavors": [
                    flavor["name"]
                    for resource_group in queue.get("spec", {}).get("resourceGroups", [])
                    for flavor in resource_group.get("flavors", [])
                ]
            }
            for queue in cluster_queues.get("items", [])
        ]
    except client.ApiException as e:
        print(f"Error fetching cluster queues: {e}")
        return []


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

def get_workload_by_name(workload_name: str):
    try:
        workload = k8s_api.get_namespaced_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            namespace=namespace,
            plural="workloads",
            name=workload_name
        )
        # Add preemption details if available
        preempted = workload.get('status', {}).get('preempted', False)
        preemption_reason = workload.get('status', {}).get('preemptionReason', 'None')

        workload['preemption'] = {
            'preempted': preempted,
            'reason': preemption_reason
        }

        return workload
    except client.ApiException as e:
        print(f"Error fetching workload {workload_name}: {e}")
        return None

def get_events_by_workload_name(workload_name: str):
    """
    Retrieves events related to the given workload.
    """
    try:
        events = core_api.list_namespaced_event(
            namespace=namespace,
            field_selector=f"involvedObject.name={workload_name}"
        )
        return [
            {
                "name": event.metadata.name,
                "reason": event.reason,
                "message": event.message,
                "timestamp": event.last_timestamp.isoformat() if event.last_timestamp else None,
                "type": event.type,
            }
            for event in events.items
        ]
    except client.ApiException as e:
        print(f"Error fetching events for workload {workload_name}: {e}")
        return []

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

def get_resource_flavors():
    """
    Retrieves all resource flavors.
    """
    try:
        flavors = k8s_api.list_cluster_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            plural="resourceflavors"
        )
        return [
            {
                "name": item["metadata"]["name"],
                "details": item.get("spec", {}),
            }
            for item in flavors.get("items", [])
        ]
    except client.ApiException as e:
        print(f"Error fetching resource flavors: {e}")
        return []

def get_resource_flavor_details(flavor_name: str):
    """
    Retrieves details of a specific resource flavor, including queues using it.
    """
    try:
        # Get the specified resource flavor details
        flavor = k8s_api.get_cluster_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            plural="resourceflavors",
            name=flavor_name
        )
        
        # List all cluster queues to find the ones that use this flavor
        cluster_queues = get_cluster_queues()

        # Find queues that use the specified flavor
        queues_using_flavor = []
        print(f"Searching for queues using {flavor_name}")
        for queue in cluster_queues:
        print(f"Searching for queues using {flavor_name}: checking : {queue}")
            for resource_group in queue.get("spec", {}).get("resourceGroups", []):
                for flavor in resource_group.get("flavors", []):
                    if flavor.get("name") == flavor_name:
                        # Collect quota information
                        quota_info = [
                            {
                                "resource": resource.get("name"),
                                "nominalQuota": resource.get("nominalQuota")
                            }
                            for resource in flavor.get("resources", [])
                        ]
                        queues_using_flavor.append({
                            "queueName": queue["metadata"]["name"],
                            "quota": quota_info
                        })
                        break  # Stop searching if the flavor is already found in this queue

        return {
            "name": flavor["metadata"]["name"],
            "details": flavor.get("spec", {}),
            "queues": queues_using_flavor
        }
    except client.ApiException as e:
        print(f"Error fetching resource flavor details for {flavor_name}: {e}")
        return None
