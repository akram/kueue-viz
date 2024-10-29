import React, { useState, useEffect } from 'react';
import useWebSocket from './useWebSocket';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';

const LocalQueues = () => {
  const { data: localQueues, error } = useWebSocket('ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/local-queues');
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    if (localQueues && Array.isArray(localQueues)) {
      setQueues(localQueues);
    }
  }, [localQueues]);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Local Queues</Typography>
      {queues.length === 0 ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queues.map((queue) => (
                <TableRow key={queue.name}>
                  <TableCell>{queue.name}</TableCell>
                  <TableCell>{queue.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default LocalQueues;
