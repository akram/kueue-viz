import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const ClusterQueues = () => {
  // Initialize WebSocket connection
  const { data: clusterQueues, error } = useWebSocket(`http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/cluster-queues`);
  // Display toast notifications if a specific condition is met
  clusterQueues.forEach(queue => {
    if (queue.flavor === "new") {
      toast.info(`Cluster queue ${queue.name} has a new flavor.`);
    }
  });
  const headers = ["Name", "Flavor"];
  const renderRow = (queue) => (
    <>
      <TableCell>{queue.name}</TableCell>
      <TableCell>{queue.flavor}</TableCell>
    </>
  );
  return (
    <div>
      <ToastContainer />
      <Typography variant="h4" gutterBottom>
        Cluster Queues and Flavors
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <DataTable headers={headers} data={clusterQueues} renderRow={renderRow} />
    </div>
  );
};

export default ClusterQueues;


