import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useWebSocket from './useWebSocket';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';

const ClusterQueues = () => {
  const { data: items, error } = useWebSocket('ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/workloads');
  const [workloads, setWorkloads] = useState([]);

  useEffect(() => {
    if (items && Array.isArray(items)) {
      setWorkloads(items);
    }
  }, [items]);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Workloads</Typography>
      {workloads.length === 0 ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Local Queue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workloads.map((workload) => (
                <TableRow key={workload.name}>
                  <TableCell>{workload.name}</TableCell>
                  <TableCell>
                        <Link to={`/local-queue/${workload.spec.queueName}`}>{workload.spec.queueName}</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default Workloads;
