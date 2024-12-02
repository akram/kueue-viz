package handlers

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
)

func WorkloadsWebSocketHandler(dynamicClient dynamic.Interface, k8sClient *kubernetes.Clientset) gin.HandlerFunc {
	return GenericWebSocketHandler(dynamicClient, WorkloadsGVR(), "", func() (interface{}, error) {
		workloads, err := fetchWorkloads(dynamicClient)
		result := map[string]interface{}{
			"workloads": workloads,
		}
		return result, err
	})
}

func WorkloadDetailsWebSocketHandler(dynamicClient dynamic.Interface) gin.HandlerFunc {
	return func(c *gin.Context) {
		namespace := c.Param("namespace")
		workloadName := c.Param("workload_name")
		GenericWebSocketHandler(dynamicClient, WorkloadsGVR(), namespace, func() (interface{}, error) {
			return fetchWorkloadDetails(dynamicClient, namespace, workloadName)
		})(c)
	}
}

// Fetch all resource flavors
func fetchWorkloads(dynamicClient dynamic.Interface) (interface{}, error) {
	result, err := dynamicClient.Resource(WorkloadsGVR()).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching resource flavors: %v", err)
	}
	return result, nil
}

func fetchWorkloadDetails(dynamicClient dynamic.Interface, namespace, workloadName string) (interface{}, error) {
	result, err := dynamicClient.Resource(WorkloadsGVR()).Namespace(namespace).Get(context.TODO(), workloadName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching details for workload %s: %v", workloadName, err)
	}
	return result.Object, nil
}

func WorkloadEventsWebSocketHandler(dynamicClient dynamic.Interface) gin.HandlerFunc {
	return func(c *gin.Context) {
		namespace := c.Param("namespace")
		workloadName := c.Param("workload_name")

		GenericWebSocketHandler(dynamicClient, EventsGVR(), namespace, func() (interface{}, error) {
			return fetchWorkloadEvents(dynamicClient, namespace, workloadName)
		})(c)
	}
}

func fetchWorkloadEvents(dynamicClient dynamic.Interface, namespace, workloadName string) (interface{}, error) {
	result, err := dynamicClient.Resource(EventsGVR()).Namespace(namespace).List(context.TODO(), metav1.ListOptions{
		FieldSelector: fmt.Sprintf("involvedObject.name=%s", workloadName),
	})
	if err != nil {
		return nil, fmt.Errorf("error fetching events for workload %s: %v", workloadName, err)
	}

	var events []map[string]interface{}
	for _, item := range result.Items {
		events = append(events, item.Object)
	}
	return events, nil
}
