package handlers

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin" // Import v1 for Pod and PodStatus
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
)

type WorkloadResponse struct {
	Items          []map[string]interface{} `json:"workloads"`
	WorkloadsByUID map[string]string        `json:"workloads_by_uid"`
}

// WorkloadsDashboardWebSocketHandler streams workloads along with attached pod details
func WorkloadsDashboardWebSocketHandler(dynamicClient dynamic.Interface, k8sClient *kubernetes.Clientset) gin.HandlerFunc {
	return func(c *gin.Context) {
		GenericWebSocketHandler(dynamicClient, schema.GroupVersionResource{}, "", func() (interface{}, error) {
			return fetchDashboardData(dynamicClient)
		})(c)
	}
}

func fetchDashboardData(dynamicClient dynamic.Interface) (map[string]interface{}, error) {
	resourceFlavors, _ := fetchResourceFlavors(dynamicClient)
	clusterQueues, _ := fetchClusterQueues(dynamicClient)
	localQueues, _ := fetchLocalQueues(dynamicClient)
	result := map[string]interface{}{
		"flavors":       resourceFlavors,
		"clusterQueues": clusterQueues,
		"queues":        localQueues,
		"workloads":     fetchWorkloadsDashboardData(dynamicClient),
	}
	return result, nil

}

func fetchWorkloadsDashboardData(dynamicClient dynamic.Interface) interface{} {
	workloadList, err := dynamicClient.Resource(WorkloadsGVR()).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		fmt.Printf("error fetching workloads: %v", err)
	}
	workloadsByUID := make(map[string]string)
	var processedWorkloads []unstructured.Unstructured
	for _, workload := range workloadList.Items {
		metadata, _, _ := unstructured.NestedMap(workload.Object, "metadata")
		labels, _, _ := unstructured.NestedStringMap(metadata, "labels")
		namespace := metadata["namespace"].(string)
		workloadName := metadata["name"].(string)
		workloadUID := metadata["uid"].(string)
		jobUID := labels["kueue.x-k8s.io/job-uid"]
		podList, err := dynamicClient.Resource(PodsGVR()).Namespace(namespace).List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			fmt.Printf("error fetching pods in namespace %s: %v", namespace, err)
			return nil
		}
		var workloadPods []map[string]interface{}
		for _, pod := range podList.Items {
			podLabels, _, _ := unstructured.NestedStringMap(pod.Object, "metadata", "labels")
			controllerUID := podLabels["controller-uid"]
			if controllerUID == jobUID {
				podDetails := map[string]interface{}{
					"name":   pod.Object["metadata"].(map[string]interface{})["name"],
					"status": pod.Object["status"],
				}
				workloadPods = append(workloadPods, podDetails)
			}
		}
		processedWorkloads = append(processedWorkloads, workload)
		workloadsByUID[workloadUID] = workloadName
	}
	workloads := map[string]interface{}{
		"items":            processedWorkloads,
		"workloads_by_uid": workloadsByUID,
	}
	return workloads
}

// removeManagedFields recursively removes "managedFields" from maps and slices.
func removeManagedFields(obj interface{}) interface{} {
	switch val := obj.(type) {
	case map[string]interface{}:
		// Remove "managedFields" if present
		delete(val, "managedFields")

		// Recursively apply to nested items
		for key, value := range val {
			val[key] = removeManagedFields(value)
		}
		return val

	case []interface{}:
		// Recursively apply to each item in the list
		for i, item := range val {
			val[i] = removeManagedFields(item)
		}
		return val

	default:
		// Return the object as is if it's neither a map nor a slice
		return obj
	}
}
