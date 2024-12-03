package handlers

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

// ClusterQueuesWebSocketHandler streams all cluster queues
func ClusterQueuesWebSocketHandler(dynamicClient dynamic.Interface) gin.HandlerFunc {
	clusterQueuesGVR := schema.GroupVersionResource{
		Group:    "kueue.x-k8s.io",
		Version:  "v1beta1",
		Resource: "clusterqueues",
	}

	return GenericWebSocketHandler(dynamicClient, clusterQueuesGVR, "", func() (interface{}, error) {
		return fetchClusterQueues(dynamicClient)
	})
}

// ClusterQueueDetailsWebSocketHandler streams details for a specific cluster queue
func ClusterQueueDetailsWebSocketHandler(dynamicClient dynamic.Interface) gin.HandlerFunc {
	return func(c *gin.Context) {
		clusterQueueName := c.Param("cluster_queue_name")
		clusterQueuesGVR := schema.GroupVersionResource{
			Group:    "kueue.x-k8s.io",
			Version:  "v1beta1",
			Resource: "clusterqueues",
		}

		GenericWebSocketHandler(dynamicClient, clusterQueuesGVR, "", func() (interface{}, error) {
			return fetchClusterQueueDetails(dynamicClient, clusterQueueName)
		})(c)
	}
}

// Fetch all cluster queues
func fetchClusterQueues(dynamicClient dynamic.Interface) ([]map[string]interface{}, error) {
	// Fetch the list of ClusterQueue objects
	clusterQueues, err := dynamicClient.Resource(ClusterQueueGVR()).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching cluster queues: %v", err)
	}

	// Process the ClusterQueue objects
	var result []map[string]interface{}
	for _, item := range clusterQueues.Items {
		// Extract relevant fields
		name := item.GetName()
		spec, specExists := item.Object["spec"].(map[string]interface{})
		status, statusExists := item.Object["status"].(map[string]interface{})

		var cohort string
		var resourceGroups []interface{}
		if specExists {
			cohort, _ = spec["cohort"].(string)
			resourceGroups, _ = spec["resourceGroups"].([]interface{})
		}

		var admittedWorkloads, pendingWorkloads, reservingWorkloads int64
		if statusExists {
			admittedWorkloads, _ = status["admittedWorkloads"].(int64)
			pendingWorkloads, _ = status["pendingWorkloads"].(int64)
			reservingWorkloads, _ = status["reservingWorkloads"].(int64)
		}

		// Extract flavors from resourceGroups
		var flavors []string
		for _, rg := range resourceGroups {
			rgMap, ok := rg.(map[string]interface{})
			if !ok {
				continue
			}
			flavorsList, _ := rgMap["flavors"].([]interface{})
			for _, flavor := range flavorsList {
				flavorMap, ok := flavor.(map[string]interface{})
				if !ok {
					continue
				}
				if flavorName, ok := flavorMap["name"].(string); ok {
					flavors = append(flavors, flavorName)
				}
			}
		}

		// Add the cluster queue to the result list
		result = append(result, map[string]interface{}{
			"name":               name,
			"cohort":             cohort,
			"resourceGroups":     resourceGroups,
			"admittedWorkloads":  admittedWorkloads,
			"pendingWorkloads":   pendingWorkloads,
			"reservingWorkloads": reservingWorkloads,
			"flavors":            flavors,
		})
	}

	return result, nil
}

// Fetch details for a specific cluster queue
func fetchClusterQueueDetails(dynamicClient dynamic.Interface, clusterQueueName string) (map[string]interface{}, error) {

	// Fetch the specific ClusterQueue
	clusterQueue, err := dynamicClient.Resource(ClusterQueueGVR()).Get(context.TODO(), clusterQueueName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching cluster queue %s: %v", clusterQueueName, err)
	}

	// Retrieve all LocalQueues
	localQueues, err := dynamicClient.Resource(LocalQueuesGVR()).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching local queues: %v", err)
	}

	// Filter LocalQueues based on the ClusterQueue name
	var queuesUsingClusterQueue []map[string]interface{}
	for _, item := range localQueues.Items {
		spec, specExists := item.Object["spec"].(map[string]interface{})
		if !specExists {
			continue
		}
		clusterQueueRef, _ := spec["clusterQueue"].(string)
		if clusterQueueRef != clusterQueueName {
			continue
		}

		// Extract relevant fields
		namespace := item.GetNamespace()
		name := item.GetName()
		status, statusExists := item.Object["status"].(map[string]interface{})

		var reservation, usage interface{}
		if statusExists {
			reservation = status["flavorsReservation"]
			usage = status["flavorUsage"]
		}

		queuesUsingClusterQueue = append(queuesUsingClusterQueue, map[string]interface{}{
			"namespace":   namespace,
			"name":        name,
			"reservation": reservation,
			"usage":       usage,
		})
	}

	// Attach the queues information to the ClusterQueue details
	clusterQueueDetails := clusterQueue.Object
	clusterQueueDetails["queues"] = queuesUsingClusterQueue

	return clusterQueueDetails, nil
}

func fetchClusterQueuesList(dynamicClient dynamic.Interface) (*unstructured.UnstructuredList, error) {
	clusterQueues, err := dynamicClient.Resource(ClusterQueueGVR()).List(context.TODO(), metav1.ListOptions{})
	return clusterQueues, err
}
