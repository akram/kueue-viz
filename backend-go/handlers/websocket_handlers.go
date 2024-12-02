package handlers

import (
	"encoding/json"
	log "log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all connections (adjust this for your security requirements)
		return true
	},
}

// GenericWebSocketHandler creates a WebSocket endpoint with periodic data updates
func GenericWebSocketHandler(dynamicClient dynamic.Interface, resource schema.GroupVersionResource, namespace string, dataFetcher func() (interface{}, error)) gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		log.Debug("WebSocket handler started at %v", startTime)

		// Upgrade the HTTP connection to a WebSocket connection
		connStart := time.Now()
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Debug("Failed to upgrade to WebSocket at %v: %v", time.Now(), err)
			return
		}
		defer conn.Close()
		log.Debug("WebSocket connection established at %v, took %v", time.Now(), time.Since(connStart))

		// Fetch the initial data and send it immediately
		fetchStart := time.Now()
		data, err := dataFetcher()
		if err != nil {
			log.Error("Error fetching data at %v: %v", time.Now(), err)
			return
		}
		log.Debug("Data fetched at %v, took %v", time.Now(), time.Since(fetchStart))

		// Marshal the fetched data into JSON
		marshalStart := time.Now()
		jsonData, err := json.Marshal(data)
		if err != nil {
			log.Error("Error marshaling data at %v: %v", time.Now(), err)
			return
		}
		log.Debug("Data marshaled into JSON at %v, took %v", time.Now(), time.Since(marshalStart))

		// Set write deadline to avoid blocking indefinitely
		conn.SetWriteDeadline(time.Now().Add(5 * time.Second))

		// Send the initial data to the WebSocket client immediately
		writeStart := time.Now()
		err = conn.WriteMessage(websocket.TextMessage, jsonData)
		if err != nil {
			log.Error("Error writing message at %v: %v", time.Now(), err)
			// If writing fails, break the loop and close the connection
			return
		}
		log.Debug("Initial message sent to client at %v, took %v", time.Now(), time.Since(writeStart))

		// Start a ticker for periodic updates (every 5 seconds)
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()

		// Continue sending updates every 5 seconds
		for range ticker.C {
			// Fetch the latest data
			fetchStart := time.Now()
			data, err := dataFetcher()
			if err != nil {
				log.Error("Error fetching data at %v: %v", time.Now(), err)
				continue
			}
			log.Debug("Data fetched at %v, took %v", time.Now(), time.Since(fetchStart))

			// Marshal the fetched data into JSON
			marshalStart := time.Now()
			jsonData, err := json.Marshal(data)
			if err != nil {
				log.Error("Error marshaling data at %v: %v", time.Now(), err)
				continue
			}
			log.Debug("Data marshaled into JSON at %v, took %v", time.Now(), time.Since(marshalStart))

			// Set write deadline to avoid blocking indefinitely
			conn.SetWriteDeadline(time.Now().Add(5 * time.Second))

			// Send the JSON data to the WebSocket client
			writeStart := time.Now()
			err = conn.WriteMessage(websocket.TextMessage, jsonData)
			if err != nil {
				log.Error("Error writing message at %v: %v", time.Now(), err)
				// If writing fails, break the loop and close the connection
				break
			}
			log.Debug("Message sent to client at %v, took %v", time.Now(), time.Since(writeStart))
		}

		log.Debug("WebSocket handler completed at %v, total time: %v", time.Now(), time.Since(startTime))
	}
}
