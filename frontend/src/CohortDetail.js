import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import useWebSocket from './useWebSocket';

const CohortDetail = () => {
  const { cohortName } = useParams();
  const url = `ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/cohort/${cohortName}`;
  const { data: cohortData, error } = useWebSocket(url);

  const [cohortDetails, setCohortDetails] = useState(null);

  useEffect(() => {
    if (cohortData) {
      setCohortDetails(cohortData);
    }
  }, [cohortData]);

  if (error) return <Typography color="error">{error}</Typography>;

  if (!cohortDetails) {
    return (
      <Paper style={{ padding: '16px', marginTop: '20px' }}>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Cohort Detail: {cohortName}</Typography>
      <Typography variant="body1"><strong>Number of Cluster Queues:</strong> {cohortDetails.clusterQueues.length}</Typography>

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Cluster Queues in Cohort
      </Typography>
      {cohortDetails.clusterQueues.length === 0 ? (
        <Typography>No cluster queues are part of this cohort.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Queue Name</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cohortDetails.clusterQueues.map((queue) => (
                <TableRow key={queue.name}>
                  <TableCell>{queue.name}</TableCell>
                  <TableCell>{JSON.stringify(queue.spec)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default CohortDetail;
