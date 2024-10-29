import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import useWebSocket from './useWebSocket';

const ResourceFlavorDetail = () => {
  const { flavorName } = useParams();
  const url = `ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/resource-flavor/${flavorName}`;
  const { data: flavorData, error } = useWebSocket(url);

  const [flavor, setFlavor] = useState(null);

  useEffect(() => {
    if (flavorData && flavorData.name) {
      console.log("Received flavor data:", flavorData); // Debug line
      setFlavor(flavorData);
    }
  }, [flavorData]);

  if (error) return <Typography color="error">{error}</Typography>;

  if (!flavor) {
    return (
      <Paper style={{ padding: '16px', marginTop: '20px' }}>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Resource Flavor Detail: {flavorName}</Typography>
      <Typography variant="body1"><strong>Details:</strong> {JSON.stringify(flavor.details, null, 2)}</Typography>

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Queues Using This Flavor
      </Typography>
      {flavor.queues && flavor.queues.length === 0 ? (
        <Typography>No queues are using this flavor.</Typography>
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
              {flavor.queues?.map((queue) => (
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
      <Typography variant="h5" gutterBottom>Node Compatibility Status</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Node Name</TableCell>
              <TableCell>Label Compatibility</TableCell>
              <TableCell>Taint Compatibility</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flavorData.nodes?.map((node) => (
              <TableRow key={node.nodeName}>
                <TableCell>{node.nodeName}</TableCell>
                <TableCell>{node.labelCompatible ? 'Compatible' : 'Incompatible'}</TableCell>
                <TableCell>{node.taintCompatible ? 'Compatible' : 'Incompatible'}</TableCell>
                <TableCell>{node.compatibilityStatus}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ResourceFlavorDetail;
