import { useEffect, useState } from 'react';

const useWebSocket = (url) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(`Connected to WebSocket: ${url}`);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("WebSocket message received:", message); // Log incoming data
      setData(message);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError("WebSocket connection error");
      ws.close();
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Clean up WebSocket connection on component unmount
    return () => {
      ws.close();
    };
  }, [url]);

  return { data, error };
};

export default useWebSocket;
