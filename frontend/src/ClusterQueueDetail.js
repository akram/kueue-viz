import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import useWebSocket from './useWebSocket';

const ClusterQueueDetail = () => {
  const { clusterQueueName } = useParams();
  const url = `ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/cluster-queue/${clusterQueueName}`;
  const { data: clusterQueueData, error } = useWebSocket(url);
  const [clusterQueue, setClusterQueue] = useState(null);

  useEffect(() => {
    console.log("Received clusterQueue data:", clusterQueueData); // Debug line
    if (clusterQueueData ) {
      setClusterQueue(clusterQueueData);
    }
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
      <Typography variant="body1"><strong>Details:</strong> {JSON.stringify(clusterQueue.details)}</Typography>

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Queues Using This Flavor
      </Typography>
      {clusterQueue.queues && clusterQueue.queues.length === 0 ? (
        <Typography>No queues are using this clusterQueue.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Queue Name</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Nominal Quota</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clusterQueue.queues?.map((queue) => (
                queue.quota.map((resource, index) => (
                  <TableRow key={`${queue.queueName}-${resource.resource}-${index}`}>
                    <TableCell>{queue.queueName}</TableCell>
                    <TableCell>{resource.resource}</TableCell>
                    <TableCell>{resource.nominalQuota}</TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ClusterQueueDetail;
