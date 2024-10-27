import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const ClusterQueues = () => {
    // Initialize WebSocket connection
    const { data: localQueues, error } = useWebSocket(`http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/cluster-queues`);

    // Display toast notifications if a specific condition is met
    localQueues.forEach(queue => {
      if (queue.status === "updated") {
        toast.info(`Local queue ${queue.name} has been updated.`);
      }
    });

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Cluster Queues and Flavors
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Flavor</TableCell>
              {/* Add more columns as needed */}
            </TableRow>
          </TableHead>
          <TableBody>
            {clusterQueues.map(queue => (
              <TableRow key={queue.name}>
                <TableCell>{queue.name}</TableCell>
                <TableCell>{queue.flavor}</TableCell>
                {/* Add more cells as needed */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ClusterQueues;


