package handlers

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
	v1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/dynamic"
)

// ResourceFlavorsWebSocketHandler streams all resource flavors
func ResourceFlavorsWebSocketHandler(dynamicClient dynamic.Interface) gin.HandlerFunc {

	return GenericWebSocketHandler(dynamicClient, ResourceFlavorsGVR(), "", func() (interface{}, error) {
		return fetchResourceFlavors(dynamicClient)
	})
}

// ResourceFlavorDetailsWebSocketHandler streams details for a specific resource flavor
func ResourceFlavorDetailsWebSocketHandler(dynamicClient dynamic.Interface) gin.HandlerFunc {
	return func(c *gin.Context) {
		flavorName := c.Param("flavor_name")
		GenericWebSocketHandler(dynamicClient, ResourceFlavorsGVR(), "", func() (interface{}, error) {
			return fetchResourceFlavorDetails(dynamicClient, flavorName)
		})(c)
	}
}

// Fetch all resource flavors
func fetchResourceFlavors(dynamicClient dynamic.Interface) (interface{}, error) {
	result, err := dynamicClient.Resource(ResourceFlavorsGVR()).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching resource flavors: %v", err)
	}

	var flavors []map[string]interface{}
	for _, item := range result.Items {
		object := item.Object
		object["name"] = item.GetName()
		spec, _ := item.Object["spec"].(map[string]interface{})
		object["details"] = spec

		flavors = append(flavors, object)
	}
	return flavors, nil
}

// Fetch details for a specific Resource Flavor
func fetchResourceFlavorDetails(dynamicClient dynamic.Interface, flavorName string) (map[string]interface{}, error) {

	// Fetch the specific ResourceFlavor
	resourceFlavor, err := dynamicClient.Resource(ResourceFlavorGVR()).Get(context.TODO(), flavorName, metav1.GetOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching resource flavor %s: %v", flavorName, err)
	}

	// List all ClusterQueues
	clusterQueues, err := dynamicClient.Resource(ClusterQueueGVR()).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching cluster queues: %v", err)
	}

	var queuesUsingFlavor []map[string]interface{}

	// Iterate through each ClusterQueue to see if it uses the specified flavor
	for _, queue := range clusterQueues.Items {
		queueName := queue.GetName()
		spec, specExists := queue.Object["spec"].(map[string]interface{})
		if !specExists {
			continue
		}
		resourceGroups, _ := spec["resourceGroups"].([]interface{})

		// Check each resource group and flavor
		for _, group := range resourceGroups {
			groupMap, ok := group.(map[string]interface{})
			if !ok {
				continue
			}
			flavors, _ := groupMap["flavors"].([]interface{})
			for _, f := range flavors {
				flavor, ok := f.(map[string]interface{})
				if !ok {
					continue
				}
				if flavor["name"] == flavorName {
					// Collect resource and quota information
					var quotaInfo []map[string]interface{}
					resources, _ := flavor["resources"].([]interface{})
					for _, r := range resources {
						resource, ok := r.(map[string]interface{})
						if !ok {
							continue
						}
						quotaInfo = append(quotaInfo, map[string]interface{}{
							"resource":     resource["name"],
							"nominalQuota": resource["nominalQuota"],
						})
					}
					queuesUsingFlavor = append(queuesUsingFlavor, map[string]interface{}{
						"queueName": queueName,
						"quota":     quotaInfo,
					})
					break
				}
			}
		}
	}

	// Get nodes matching the flavor
	matchingNodes, err := getNodesForFlavor(dynamicClient, flavorName)
	if err != nil {
		return nil, fmt.Errorf("error fetching nodes for flavor %s: %v", flavorName, err)
	}

	// Build the response
	result := map[string]interface{}{
		"name":    flavorName,
		"details": resourceFlavor.Object["spec"],
		"queues":  queuesUsingFlavor,
		"nodes":   matchingNodes,
	}

	return result, nil
}

// getNodesForFlavor retrieves a list of nodes that match a specific resource flavor.
func getNodesForFlavor(dynamicClient dynamic.Interface, flavorName string) ([]map[string]interface{}, error) {
	// List all nodes
	nodeList, err := dynamicClient.Resource(NodeGVR()).List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("error fetching nodes: %v", err)
	}

	var matchingNodes []map[string]interface{}

	// Iterate through each node to find matches for the flavor
	for _, node := range nodeList.Items {
		nodeName := node.GetName()

		// Convert the unstructured node object to the corev1.Node type
		nodeObj := &v1.Node{}
		err := runtime.DefaultUnstructuredConverter.FromUnstructured(node.Object, nodeObj)
		if err != nil {
			return nil, fmt.Errorf("error converting node %s to corev1.Node: %v", nodeName, err)
		}

		// Check if the node has a label matching the resource flavor
		if nodeObj.Labels != nil {
			if _, exists := nodeObj.Labels["flavor.kueue.x-k8s.io/"+flavorName]; exists {
				matchingNodes = append(matchingNodes, map[string]interface{}{
					"name":   nodeName,
					"labels": nodeObj.Labels,
				})
			}
		}
	}

	return matchingNodes, nil
}
