import os
from kubernetes import client, config
import json
import time
import datetime
import logging

logging.basicConfig(level=logging.DEBUG)

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
    "get_cohort_details",
    "get_pods_for_workload",
    "get_nodes_for_flavor",
    "remove_managed_fields"
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
                "status": item["status"],
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
                "resourceGroups": queue["spec"]["resourceGroups"],
                "admittedWorkloads": queue["status"]["admittedWorkloads"],
                "pendingWorkloads": queue["status"]["pendingWorkloads"],
                "reservingWorkloads": queue["status"]["reservingWorkloads"],
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
        return remove_managed_fields(queues)
    except client.ApiException as e:
        print(f"Error fetching queues: {e.status} {e.reason} - {e.body}")
        return {"error": e.body}

def get_workloads():
    """
    Retrieves all workloads along with their attached pods based on job-uid.
    """
    try:
        # Retrieve all workloads
        workloads = k8s_api.list_namespaced_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            namespace=namespace,
            plural="workloads"
        )
        workloads = remove_managed_fields(workloads)
        # Retrieve all pods in the namespace
        pods = remove_managed_fields(core_api.list_namespaced_pod(namespace=namespace))

        # Map pods by their `controller-uid` label for fast lookup
        pod_map = {}
        for pod in pods.items:
            job_uid = pod.metadata.labels.get("controller-uid")
            if job_uid:
                pod_entry = {
                    "name": pod.metadata.name,
                    # "phase": pod.status.phase,
                    # "conditions": pod.status.conditions  # Add the status.phase here
                    "status": recursive_to_dict(pod.status) if pod.status else {}  # Recursively convert status to dict
                }
                if job_uid in pod_map:
                    pod_map[job_uid].append(pod_entry)
                else:
                    pod_map[job_uid] = [pod_entry]

        # Attach the corresponding pods to each workload
        for workload in workloads['items']:
            job_uid = workload['metadata']['labels'].get("kueue.x-k8s.io/job-uid")
            workload['pods'] = pod_map.get(job_uid, [])
            
            # Add preemption details if available
            preempted = workload.get('status', {}).get('preempted', False)
            preemption_reason = workload.get('status', {}).get('preemptionReason', 'None')

            workload['preemption'] = {
                'preempted': preempted,
                'reason': preemption_reason
            }
            start_time = time.time()
            print(f"DEBUG: about to return workloads:\n {json.dumps(workloads)}")
            print(f"DEBUG: Print time: {time.time() - start_time} seconds")
        return workloads
    except client.ApiException as e:
        print(f"Error fetching workloads: {e.status} {e.reason} - {e.body}")
        return {"error": e.body}


def slim_down_pod_status(pod_status):
    return {
        "phase": pod_status.get("phase"),
        "conditions": pod_status.get("conditions"),
        "containerStatuses": [
            {
                "name": c["name"],
                "state": c["state"],
                "ready": c["ready"]
            }
            for c in pod_status.get("containerStatuses", [])
        ]
    }

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
        this_flavor = k8s_api.get_cluster_custom_object(
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

        matching_nodes = get_nodes_for_flavor(flavor_name)

        return {
            "name": flavor_name,
            "details": this_flavor.get("spec", {}),
            "queues": queues_using_flavor,
            "nodes": matching_nodes
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
            if workload.get("spec", {}).get("queueName") == queue_name
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

        # Gather names of local queues that use this cluster queue
        queues_using_cluster_queue = [
            {
                "name": queue["metadata"]["name"],
                "reservation": queue.get("status", {}).get("flavorsReservation"),
                "usage": queue.get("status", {}).get("flavorUsage")
            }
            for queue in local_queues.get("items", [])
            if queue.get("spec", {}).get("clusterQueue") == cluster_queue_name
        ]

        # Attach the `queues` information to the returned data
        cluster_queue_details = {
            **cluster_queue,
            "queues": queues_using_cluster_queue
        }
        return cluster_queue_details

    except client.ApiException as e:
        print(f"Error fetching details for cluster queue {cluster_queue_name}: {e}")
        return None



def get_cohorts():
    """
    Retrieves a list of unique cohorts from all cluster queues, including the cluster queues participating in each cohort.
    """
    try:
        # Retrieve all cluster queues
        cluster_queues = k8s_api.list_cluster_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            plural="clusterqueues"
        )

        # Organize cluster queues by cohort
        cohorts = {}
        for queue in cluster_queues.get("items", []):
            cohort_name = queue.get("spec", {}).get("cohort")
            if cohort_name:
                if cohort_name not in cohorts:
                    cohorts[cohort_name] = {"name": cohort_name, "clusterQueues": []}
                cohorts[cohort_name]["clusterQueues"].append({"name": queue["metadata"]["name"]})

        # Convert the dictionary to a list
        return list(cohorts.values())

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



def get_pods_for_workload(job_uid: str):
    """
    Retrieves pods with the label `controller: {job_uid}`.
    """
    try:
        pods = core_api.list_namespaced_pod(
            namespace=namespace,
            label_selector=f"controller-uid={job_uid}"
        )
        return [
            {
                "name": pod.metadata.name,
                "status": pod.status.phase
            }
            for pod in pods.items
        ]
    except client.ApiException as e:
        print(f"Error fetching pods for job_uid {job_uid}: {e}")
        return []




def get_nodes_for_flavor(flavor_name: str):
    """
    Retrieves nodes that match the given ResourceFlavor.
    """
    try:
        # Fetch the specified ResourceFlavor
        flavor = k8s_api.get_cluster_custom_object(
            group="kueue.x-k8s.io",
            version="v1beta1",
            plural="resourceflavors",
            name=flavor_name
        )

        # Extract the nodeLabels and nodeTaints criteria from the flavor spec
        node_labels = flavor.get("spec", {}).get("nodeLabels", {})
        node_taints = flavor.get("spec", {}).get("nodeTaints", [])

        # List all nodes in the cluster
        all_nodes = core_api.list_node()
        
        # Filter nodes based on labels and taints
        matching_nodes = []
        for node in all_nodes.items:
            # Check if node has required labels
            node_labels_match = all(
                node.metadata.labels.get(key) == value
                for key, value in node_labels.items()
            )
            
            # Check if node has required taints
            node_taints_match = True
            if node_taints:
                node_taints_match = all(
                    any(
                        node_taint.key == taint["key"] and
                        node_taint.value == taint["value"] and
                        node_taint.effect == taint["effect"]
                        for node_taint in node.spec.taints or []
                    )
                    for taint in node_taints
                )
            
            if node_labels_match and node_taints_match:
                matching_nodes.append({
                    "name": node.metadata.name,
                    "labels": node.metadata.labels,
                    "taints": [taint.to_dict() for taint in (node.spec.taints or [])]
                })

        return matching_nodes

    except client.ApiException as e:
        print(f"Error fetching nodes for ResourceFlavor {flavor_name}: {e}")
        return []


def remove_managed_fields(obj):
    """
    Recursively removes 'managedFields' from dictionaries and lists.
    """
    if isinstance(obj, dict):
        obj.pop("managedFields", None)  # Remove 'managedFields' if present
        for key, value in obj.items():
            obj[key] = remove_managed_fields(value)  # Recursively apply to nested items
    elif isinstance(obj, list):
        obj = [remove_managed_fields(item) for item in obj]  # Recursively apply to each item in list
    return obj


def recursive_to_dict(obj):
    """
    Recursively converts Kubernetes API objects to dictionaries.
    Also handles datetime serialization to ISO format.
    """
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    elif hasattr(obj, "to_dict"):
        obj_dict = obj.to_dict()
        # Add debug log to see the structure
        logging.debug(f"Converting object with to_dict: {type(obj)}")
        return recursive_to_dict(obj_dict)
    elif isinstance(obj, list):
        return [recursive_to_dict(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: recursive_to_dict(v) for k, v in obj.items()}
    else:
        return obj