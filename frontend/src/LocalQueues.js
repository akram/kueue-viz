import { TableCell, Typography } from '@mui/material';
import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from './DataTable';
import useWebSocket from './useWebSocket';

const LocalQueues = () => {
  // Initialize WebSocket connection
  const { data, error } = useWebSocket(`http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/local-queues`);

  // Display toast notifications if a specific condition is met
  data.localQueues.forEach(queue => {
    if (queue.status === "updated") {
      toast.info(`Local queue ${queue.name} has been updated.`);
    }
  });

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
      {error && <Typography color="error">{error}</Typography>}
      <DataTable headers={headers} data={localQueues} renderRow={renderRow} />
    </div>
  );
};
export default LocalQueues;

