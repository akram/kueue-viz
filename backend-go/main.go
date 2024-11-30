package main

import (
	"log"

	"github.com/akram/kueue-viz-go/handlers"
	"github.com/gin-gonic/gin"
)

func main() {
	k8sClient, dynamicClient, err := createK8sClient()
	if err != nil {
		log.Fatalf("Error creating Kubernetes client: %v", err)
	}

	r := gin.Default()
	handlers.InitializeWebSocketRoutes(r, dynamicClient, k8sClient)

	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
