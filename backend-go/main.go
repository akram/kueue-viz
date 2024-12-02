package main

import (
	"fmt"
	"log"

	"github.com/akram/kueue-viz-go/handlers"
	"github.com/gin-gonic/gin"

	"net/http"
	_ "net/http/pprof"
)

func main() {
	go func() {
		err := http.ListenAndServe("localhost:6060", nil)
		fmt.Println("Listen for pprof on port 6060")
		log.Println(err)
	}()

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
