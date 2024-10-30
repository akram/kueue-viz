import { CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useWebSocket from './useWebSocket';

const ClusterQueueDetail = () => {
  const { clusterQueueName } = useParams();
  const url = `ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/cluster-queue/${clusterQueueName}`;

  const { data: clusterQueueData, error } = useWebSocket(url);

  const [clusterQueue, setClusterQueue] = useState(null);

  useEffect(() => {
    console.log("Received clusterQueue data:", clusterQueueData); // Debug line
    if (clusterQueueData) setClusterQueue(clusterQueueData);
  }, [clusterQueueData]);

  if (error) return <Typography color="error">{error}</Typography>;

  if (!clusterQueue) {
    console.log("Received empty clusterQueue data:", clusterQueueData); // Debug line
    return (
      <Paper style={{ padding: '16px', marginTop: '20px' }}>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Cluster Queue Detail: {clusterQueueName}</Typography>
      <Typography variant="body1"><strong>Details:</strong> {JSON.stringify(clusterQueue.spec)}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body1"><strong>Name:</strong> {clusterQueue.metadata?.name}</Typography>
          <Typography variant="body1"><strong>UID:</strong> {clusterQueue.metadata?.uid}</Typography>
          <Typography variant="body1"><strong>Creation Timestamp:</strong> {new Date(clusterQueue.metadata?.creationTimestamp).toLocaleString()}</Typography>
        </Grid>
      </Grid>
      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Local Queues Using This Cluster Queue
      </Typography>
      {clusterQueue.queues && clusterQueue.queues.length === 0 ? (
        <Typography>No local queues are using this clusterQueue.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Queue Name</TableCell>
                <TableCell>Reservation</TableCell>
                <TableCell>Usage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
            {clusterQueue.queues.map((queue) => (
              <TableRow>
                <TableCell>{queue.name}</TableCell>
                <TableCell>{JSON.stringify(queue.reservation)}</TableCell>
                <TableCell>{JSON.stringify(queue.usage)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ClusterQueueDetail;
