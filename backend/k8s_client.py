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
    "get_resource_flavor_details",
    "get_admitted_workloads",
    "get_local_queue_details",
    "get_cluster_queue_details",
    "get_cohorts",
    "get_cohort_details"
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
                "cohort": queue["spec"]["cohort"],
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

from kubernetes import client, config

# Load Kubernetes configuration for in-cluster access
config.load_incluster_config()
k8s_api = client.CustomObjectsApi()

def get_resource_flavor_details(flavor_name: str):
    """
    Retrieves details of a specific resource flavor, including queues using it.
    """
    try:
        # Fetch the specified resource flavor details
        flavor = k8s_api.get_cluster_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            plural="resourceflavors",
            name=flavor_name
        )
        
        # List all cluster queues to find which ones use this flavor
        cluster_queues = k8s_api.list_cluster_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            plural="clusterqueues"
        )

        queues_using_flavor = []

        # Iterate through each cluster queue to see if it uses the specified flavor
        for queue in cluster_queues.get("items", []):
            queue_name = queue.get("metadata", {}).get("name", "Unnamed Queue")
            resource_groups = queue.get("spec", {}).get("resourceGroups", [])
            
            for resource_group in resource_groups:
                for flavor in resource_group.get("flavors", []):
                    if flavor.get("name") == flavor_name:
                        # Collect resource and quota information for this queue
                        quota_info = [
                            {
                                "resource": resource.get("name", "Unknown Resource"),
                                "nominalQuota": resource.get("nominalQuota", "N/A")
                            }
                            for resource in flavor.get("resources", [])
                        ]
                        queues_using_flavor.append({
                            "queueName": queue_name,
                            "quota": quota_info
                        })
                        break  # Stop searching once the flavor is found in this queue

        return {
            "name": flavor.get("metadata", {}).get("name", "Unknown Flavor"),
            "details": flavor.get("spec", {}),
            "queues": queues_using_flavor
        }

    except client.ApiException as e:
        print(f"Error fetching resource flavor details for {flavor_name}: {e}")
        return None




def get_local_queue_details(queue_name: str):
    """
    Retrieves detailed information about a specific LocalQueue.
    """
    try:
        # Fetch the LocalQueue object
        local_queue = k8s_api.get_namespaced_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            namespace=namespace,
            plural="localqueues",
            name=queue_name
        )
        return {
            "metadata": {
                "name": local_queue["metadata"]["name"],
                "namespace": local_queue["metadata"]["namespace"],
                "uid": local_queue["metadata"]["uid"],
                "creationTimestamp": local_queue["metadata"]["creationTimestamp"],
            },
            "spec": local_queue.get("spec", {}),
            "status": local_queue.get("status", {}),
        }
    except client.ApiException as e:
        print(f"Error fetching LocalQueue details for {queue_name}: {e}")
        return {"error": f"Could not retrieve details for LocalQueue {queue_name}"}


def get_admitted_workloads(queue_name: str):
    """
    Retrieves all workloads admitted into the specified LocalQueue.
    """
    try:
        # List all workloads in the namespace
        workloads = k8s_api.list_namespaced_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            namespace=namespace,
            plural="workloads"
        )

        # Filter workloads that are admitted to the specified queue
        admitted_workloads = [
            {
                "metadata": {
                    "name": workload["metadata"]["name"],
                    "namespace": workload["metadata"]["namespace"],
                },
                "status": workload.get("status", {}),
            }
            for workload in workloads.get("items", [])
            if workload.get("status", {}).get("admission", {}).get("queueName") == queue_name
        ]

        return admitted_workloads
    except client.ApiException as e:
        print(f"Error fetching admitted workloads for LocalQueue {queue_name}: {e}")
        return {"error": f"Could not retrieve admitted workloads for LocalQueue {queue_name}"}


def get_cluster_queue_details(cluster_queue_name: str):
    """
    Retrieves details of a specific cluster queue, including the local queues using it and their quotas.
    """
    try:
        # Fetch the specific cluster queue
        cluster_queue = k8s_api.get_cluster_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            plural="clusterqueues",
            name=cluster_queue_name
        )

        # Retrieve all local queues and filter based on clusterQueue name
        local_queues = k8s_api.list_namespaced_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            namespace=namespace,
            plural="localqueues"
        )

        # Filter local queues that use this cluster queue and get quotas
        queues_using_cluster_queue = [
            {
                "queueName": queue["metadata"]["name"],
                "quota": queue.get("spec", {}).get("quota", [])
            }
            for queue in local_queues.get("items", [])
            if queue.get("spec", {}).get("clusterQueue") == cluster_queue_name
        ]

        return {
            "name": cluster_queue["metadata"]["name"],
            "details": cluster_queue.get("spec", {}),
            "queues": queues_using_cluster_queue
        }

    except client.ApiException as e:
        print(f"Error fetching details for cluster queue {cluster_queue_name}: {e}")
        return None



def get_cohorts():
    """
    Retrieves a list of unique cohorts from all cluster queues.
    """
    try:
        cluster_queues = k8s_api.list_cluster_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            plural="clusterqueues"
        )

        # Extract unique cohort names
        cohorts = set(
            queue.get("spec", {}).get("cohort", None)
            for queue in cluster_queues.get("items", [])
            if queue.get("spec", {}).get("cohort")
        )

        # Return cohorts as a list of dictionaries
        return [{"name": cohort} for cohort in cohorts if cohort]

    except client.ApiException as e:
        print(f"Error fetching cohorts: {e}")
        return []


def get_cohort_details(cohort_name: str):
    """
    Retrieves details for a specific cohort, including all cluster queues in that cohort.
    """
    try:
        cluster_queues = k8s_api.list_cluster_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            plural="clusterqueues"
        )

        # Filter cluster queues that are part of the specified cohort
        cohort_cluster_queues = [
            {
                "name": queue["metadata"]["name"],
                "spec": queue.get("spec", {}),
                "status": queue.get("status", {})
            }
            for queue in cluster_queues.get("items", [])
            if queue.get("spec", {}).get("cohort") == cohort_name
        ]

        return {
            "cohort": cohort_name,
            "clusterQueues": cohort_cluster_queues
        }

    except client.ApiException as e:
        print(f"Error fetching details for cohort {cohort_name}: {e}")
        return None
