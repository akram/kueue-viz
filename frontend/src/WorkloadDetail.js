import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Typography, Paper, CircularProgress, Grid } from '@mui/material';

const WorkloadDetail = () => {
  const { workloadName } = useParams();
  const [workload, setWorkload] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkloadDetail = async () => {
      try {
        const response = await axios.get(`http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/kueue/workload/${workloadName}`);
        setWorkload(response.data);
      } catch (error) {
        setError('Failed to fetch workload details');
        console.error("Error fetching workload details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkloadDetail();
  }, [workloadName]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Workload Detail: {workload.metadata.name}</Typography>
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
