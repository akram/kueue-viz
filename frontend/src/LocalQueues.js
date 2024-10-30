import { CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useWebSocket from './useWebSocket';


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
                <TableCell>Pending Workloads</TableCell>
                <TableCell>Reserving Workloads</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queues.map((queue) => (
                <TableRow key={queue.name}>
                  <TableCell><Link to={`/local-queue/${queue.name}`}>{queue.name}</Link></TableCell>
                  <TableCell>{queue.pendingWorkloads}</TableCell>
                  <TableCell>{queue.reservingWorkloads}</TableCell>
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
