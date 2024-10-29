import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useWebSocket from './useWebSocket';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';

const ClusterQueues = () => {
  const { data: clusterQueues, error } = useWebSocket('ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/cluster-queues');
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    if (clusterQueues && Array.isArray(clusterQueues)) {
      setQueues(clusterQueues);
    }
  }, [clusterQueues]);

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Cluster Queues</Typography>
      {queues.length === 0 ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Flavors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queues.map((queue) => (
                <TableRow key={queue.name}>
                  <TableCell>{queue.name}</TableCell>
                  <TableCell>
                    {queue.flavors.map((flavor, index) => (
                      <React.Fragment key={flavor}>
                        <Link to={`/resource-flavor/${flavor}`}>{flavor}</Link>
                        {index < queue.flavors.length - 1 && ', '}
                      </React.Fragment>
                    ))}
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

export default ClusterQueues;
