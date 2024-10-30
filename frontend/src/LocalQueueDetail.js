import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Paper, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import useWebSocket from './useWebSocket';
import { Link } from 'react-router-dom';


const LocalQueueDetail = () => {
  const { queueName } = useParams();
  const queueUrl = `ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/local-queue/${queueName}`;
  const workloadsUrl = `ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/local-queue/${queueName}/workloads`;

  const { data: queueData, error: queueError } = useWebSocket(queueUrl);
  const { data: workloadsData, error: workloadsError } = useWebSocket(workloadsUrl);

  const [queue, setQueue] = useState(null);
  const [workloads, setWorkloads] = useState([]);

  useEffect(() => {
    if (queueData) setQueue(queueData);
  }, [queueData]);

  useEffect(() => {
    if (workloadsData) setWorkloads(workloadsData);
  }, [workloadsData]);

  if (!queue) return <CircularProgress />;
  if (queueError) return <Typography color="error">{queueError}</Typography>;
  if (workloadsError) return <Typography color="error">{workloadsError}</Typography>;

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Local Queue Detail: {queueName}</Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body1"><strong>Name:</strong> {queue.metadata?.name}</Typography>
          <Typography variant="body1"><strong>Namespace:</strong> {queue.metadata?.namespace}</Typography>
          <Typography variant="body1"><strong>UID:</strong> {queue.metadata?.uid}</Typography>
          <Typography variant="body1"><strong>Creation Timestamp:</strong> {new Date(queue.metadata?.creationTimestamp).toLocaleString()}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body1"><strong>Cluster Queue:</strong> {queue.spec?.clusterQueue}</Typography>
          <Typography variant="body1"><strong>Admitted Workloads:</strong> {queue.status?.admittedWorkloads}</Typography>
          <Typography variant="body1"><strong>Pending Workloads:</strong> {queue.status?.pendingWorkloads}</Typography>
          <Typography variant="body1"><strong>Reserving Workloads:</strong> {queue.status?.reservingWorkloads}</Typography>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>Conditions</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Last Transition Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queue.status?.conditions?.map((condition, index) => (
              <TableRow key={index}>
                <TableCell>{condition.type}</TableCell>
                <TableCell>{condition.status}</TableCell>
                <TableCell>{condition.reason}</TableCell>
                <TableCell>{new Date(condition.lastTransitionTime).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>Flavor Usage</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Flavor Name</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queue.status?.flavorUsage?.map((flavor, index) => (
              flavor.resources.map((resource, resIndex) => (
                <TableRow key={`${index}-${resIndex}`}>
                  <TableCell>{flavor.name}</TableCell>
                  <TableCell>{resource.name}</TableCell>
                  <TableCell>{resource.total}</TableCell>
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>Flavors Reservation</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Flavor Name</TableCell>
              <TableCell>Resource</TableCell>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queue.status?.flavorsReservation?.map((flavor, index) => (
              flavor.resources.map((resource, resIndex) => (
                <TableRow key={`${index}-${resIndex}`}>
                  <TableCell>{flavor.name}</TableCell>
                  <TableCell>{resource.name}</TableCell>
                  <TableCell>{resource.total}</TableCell>
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>Admitted Workloads</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workloads.map((workload) => (
              <TableRow key={workload.metadata.name}>
                <TableCell>{workload.metadata.name}</TableCell>
                <TableCell>{workload.status?.state || "Unknown"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default LocalQueueDetail;
