import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import 'react-toastify/dist/ReactToastify.css';
import { toast, ToastContainer } from 'react-toastify';
import useWebSocket from './useWebSocket';

const ClusterQueues = () => {
    // Initialize WebSocket connection
    const { data: clusterQueues, error } = useWebSocket(`http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/cluster-queues`);

    // Display toast notifications if a specific condition is met
    clusterQueues.forEach(queue => {
      if (queue.status === "updated") {
        toast.info(`Cluster queue ${queue.name} has been updated.`);
      }
    });

    return (
      <div>
        <Typography variant="h4" gutterBottom>
          Cluster Queues
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
              {clusterQueues.map(queue => (
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

  export default ClusterQueues;

