import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Paper, CircularProgress, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import useWebSocket from './useWebSocket';
import axios from 'axios';

const WorkloadDetail = () => {
  const { workloadName } = useParams();
  const url = `ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/workload/${workloadName}`;
  const { data: workload, error } = useWebSocket(url);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventError, setEventError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/kueue/workload/${workloadName}/events`);
        const sortedEvents = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setEvents(sortedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEventError('Failed to fetch events');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [workloadName]);

  if (!workload) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Workload Detail: {workloadName}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body1"><strong>Queue Name:</strong> {workload.spec?.queueName || 'N/A'}</Typography>
          <Typography variant="body1"><strong>Status:</strong> {workload.status?.state || 'Unknown'}</Typography>
          <Typography variant="body1"><strong>Priority:</strong> {workload.spec?.priority || 'N/A'}</Typography>
          <Typography variant="body1"><strong>Priority Class Name:</strong> {workload.spec?.priorityClassName || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="body1"><strong>Owner Reference:</strong></Typography>
          <Typography variant="body2">API Version: {workload.ownerReferences?.[0]?.apiVersion || 'N/A'}</Typography>
          <Typography variant="body2">Kind: {workload.ownerReferences?.[0]?.kind || 'N/A'}</Typography>
          <Typography variant="body2">Name: {workload.ownerReferences?.[0]?.name || 'N/A'}</Typography>
          <Typography variant="body2">UID: {workload.ownerReferences?.[0]?.uid || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1"><strong>Pod Sets Count:</strong> {workload.spec?.podSets?.[0]?.count || 'N/A'}</Typography>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Events
      </Typography>

      {loadingEvents ? (
        <CircularProgress />
      ) : eventError ? (
        <Typography color="error">{eventError}</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Message</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.name}>
                  <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                  <TableCell>{event.type}</TableCell>
                  <TableCell>{event.reason}</TableCell>
                  <TableCell>{event.message}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default WorkloadDetail;
