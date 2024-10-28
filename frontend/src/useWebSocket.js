import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const useWebSocket = (url) => {
  const [data, setData] = useState({ queues: [], workloads: [] });  // Default to empty arrays for both queues and workloads
  const [error, setError] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(`Connected to WebSocket at ${url}`);
    };

    ws.onmessage = (event) => {
      try {
        const receivedData = JSON.parse(event.data);
        
        // Ensure received data has the expected structure
        setData({
          queues: Array.isArray(receivedData.queues) ? receivedData.queues : [],
          workloads: Array.isArray(receivedData.workloads) ? receivedData.workloads : []
        });
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
        setError("Error parsing data from WebSocket");
      }
    };

    ws.onerror = (err) => {
      console.error(`WebSocket error at ${url}:`, err);
      setError(`WebSocket connection error at ${url}`);
      ws.close();
    };

    ws.onclose = () => {
      console.log(`WebSocket connection closed at ${url}`);
    };

    // Clean up WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, [url]);

  return { data, error };
};

export default useWebSocket;
