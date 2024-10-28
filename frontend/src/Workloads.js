import { TableCell, Typography } from '@mui/material';
import React from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DataTable from './DataTable';
import useWebSocket from './useWebSocket';

const Workloads = () => {
  // Initialize WebSocket connection
  const { data: workloads, error } = useWebSocket(`http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/workloads`);

  // Display toast notifications if a specific condition is met
  workloads.forEach(item => {
    if (item.status === "updated") {
      toast.info(`Workload ${item.name} has been updated.`);
    }
  });

  const headers = ["Name", "Status"];
  const renderRow = (item) => (
    <>
      <TableCell>{item.name}</TableCell>
      <TableCell>{item.status}</TableCell>
    </>
  );

  return (
    <div>
      <ToastContainer />
      <Typography variant="h4" gutterBottom>
        Workloads
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <DataTable headers={headers} data={workloads} renderRow={renderRow} />
    </div>
  );
};
export default Workloads;

