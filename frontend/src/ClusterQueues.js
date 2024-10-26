import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const ClusterQueues = () => {
  const [clusterQueues, setClusterQueues] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClusterQueues = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/cluster-queues`);
        setClusterQueues(response.data);
      } catch (error) {
        setError('Failed to fetch cluster queues');
        console.error("Error fetching cluster queues:", error);
      }
    };
    fetchClusterQueues();
  }, []);

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


