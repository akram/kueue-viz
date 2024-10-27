import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const LocalQueues = () => {
  const [localQueues, setLocalQueues] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocalQueues = async () => {
      try {
        const response = await axios.get(`http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/local-queues`);
        setLocalQueues(response.data);
      } catch (error) {
        setError('Failed to fetch local queues');
        console.error("Error fetching local queues:", error);
      }
    };
    fetchLocalQueues();
  }, []);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Local Queues
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
            {localQueues.map(queue => (
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

export default LocalQueues;

