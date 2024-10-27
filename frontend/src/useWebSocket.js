import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const useWebSocket = (url) => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(`Connected to WebSocket at ${url}`);
    };

    ws.onmessage = (event) => {
      const receivedData = JSON.parse(event.data);
      setData(receivedData);
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


