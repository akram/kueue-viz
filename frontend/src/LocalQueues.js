import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';

const LocalQueues = () => {
  const [localQueues, setLocalQueues] = useState([]);
  const [error, setError] = useState(null);

  // http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/
  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket(`http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/local-queues`);

    ws.onopen = () => {
      console.log("Connected to WebSocket for local queues");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLocalQueues(data);

      // Optionally, display a toast notification for certain events
      data.forEach(queue => {
        if (queue.status === "updated") {
          toast.info(`Local queue ${queue.name} has been updated.`);
        }
      });
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
  }, []);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Local Queues
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              {/* Add more columns as needed */}
            </TableRow>
          </TableHead>
          <TableBody>
            {localQueues.map(queue => (
              <TableRow key={queue.name}>
                <TableCell>{queue.name}</TableCell>
                <TableCell>{queue.status}</TableCell>
                {/* Add more cells as needed */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default LocalQueues;

