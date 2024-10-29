import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Paper, CircularProgress, Grid } from '@mui/material';
import useWebSocket from './useWebSocket';

const WorkloadDetail = () => {
  const { workloadName } = useParams();
  const { data: workload, error } = useWebSocket(`ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/workload/${workloadName}`);

  if (!workload) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Workload Detail: {workloadName}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body1"><strong>Queue Name:</strong> {workload.spec.queueName}</Typography>
          <Typography variant="body1"><strong>Status:</strong> {workload.status?.state || 'Unknown'}</Typography>
          <Typography variant="body1"><strong>Priority:</strong> {workload.spec.priority || 'N/A'}</Typography>
          <Typography variant="body1"><strong>Priority Class Name:</strong> {workload.spec.priorityClassName || 'N/A'}</Typography>
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
    </Paper>
  );
};

export default WorkloadDetail;
