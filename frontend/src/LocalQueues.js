import { TableCell, Typography } from '@mui/material';
import React, { useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from './DataTable';
import useWebSocket from './useWebSocket';

const LocalQueues = () => {
  // Initialize WebSocket connection
  const { data, error, reconnect } = useWebSocket(`http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/local-queues`);
  
  // Display toast notifications if a specific condition is met
  useEffect(() => {
    if (data?.localQueues) {
      data.localQueues.forEach(queue => {
        if (queue.status === "updated") {
          toast.info(`Local queue ${queue.name} has been updated.`);
        }
      });
    }
  }, [data]);

  const headers = ["Name", "Status"];
  const renderRow = (queue) => (
    <>
      <TableCell>{queue.name}</TableCell>
      <TableCell>{queue.status}</TableCell>
    </>
  );

  return (
    <div>
      <ToastContainer />
      <Typography variant="h4" gutterBottom>
        Local Queues
      </Typography>
      {error ? (
        <Typography variant="body1" color="error">
          Connection error. Trying to reconnect...
        </Typography>
      ) : data?.localQueues ? (
        <DataTable headers={headers} rows={data.localQueues} renderRow={renderRow} />
      ) : (
        <Typography variant="body1">Loading local queues...</Typography>
      )}
    </div>
  );
};

export default LocalQueues;
