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
	Items          []map[string]interface{} `json:"items"`
	WorkloadsByUID map[string]string        `json:"workloads_by_uid"`
}

// WorkloadsDashboardWebSocketHandler streams workloads along with attached pod details
func WorkloadsDashboardWebSocketHandler(dynamicClient dynamic.Interface, k8sClient *kubernetes.Clientset) gin.HandlerFunc {
	return func(c *gin.Context) {
		GenericWebSocketHandler(dynamicClient, schema.GroupVersionResource{}, "", func() (interface{}, error) {
			return fetchWorkloadsDashboardData(dynamicClient)
		})(c)
	}
}

func fetchWorkloadsDashboardData(dynamicClient dynamic.Interface) ([]interface{}, error) {
	workloadList, err := dynamicClient.Resource(WorkloadsGVR()).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching workloads: %v", err)
	}

	workloadsByUID := make(map[string]string)
	var processedWorkloads []map[string]interface{}

	for _, workload := range workloadList.Items {
		metadata, _, _ := unstructured.NestedMap(workload.Object, "metadata")
		status, _, _ := unstructured.NestedMap(workload.Object, "status")
		labels, _, _ := unstructured.NestedStringMap(metadata, "labels")
		namespace := metadata["namespace"].(string)
		workloadName := metadata["name"].(string)
		workloadUID := metadata["uid"].(string)
		jobUID := labels["kueue.x-k8s.io/job-uid"]

		podList, err := dynamicClient.Resource(PodsGVR()).Namespace(namespace).List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			return nil, fmt.Errorf("error fetching pods in namespace %s: %v", namespace, err)
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

		// Serialize pods as {} when no pods exist
		var serializedPods interface{}
		if len(workloadPods) == 0 {
			serializedPods = map[string]interface{}{} // Empty object
		} else {
			serializedPods = workloadPods
		}

		preempted := false
		if preemptedVal, ok := status["preempted"].(bool); ok {
			preempted = preemptedVal
		} else {
			preempted = false // Default to false if not found or not a bool
		}

		preemptionReason := "None"
		if reason, ok := status["preemptionReason"].(string); ok {
			preemptionReason = reason
		}

		processedWorkload := map[string]interface{}{
			"name":       workloadName,
			"namespace":  namespace,
			"pods":       serializedPods,
			"preemption": map[string]interface{}{"preempted": preempted, "reason": preemptionReason},
		}
		processedWorkloads = append(processedWorkloads, processedWorkload)
		workloadsByUID[workloadUID] = workloadName
	}

	workloadResponse := &WorkloadResponse{
		Items:          processedWorkloads,
		WorkloadsByUID: workloadsByUID,
	}

	return []interface{}{&workloadResponse}, nil

}
