
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Grid, Paper, Typography } from '@mui/material';

const Dashboard = () => {
  const [queues, setQueues] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.error("AAAAAAAAAAA:", `${process.env.REACT_APP_BACKEND_URL}`);
        const response = await axios.get('http://backend-kueue-viz.apps.rosa.akram.s25d.p3.openshiftapps.com/kueue/status');
        setQueues(response.data.queues.items || []);
        setWorkloads(response.data.workloads.items || []);
      } catch (error) {
        setError('Failed to fetch data');
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Typography variant="h6">Loading...</Typography>;
  if (error) return <Typography variant="h6" color="error">{error}</Typography>;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={4}>
        <Paper elevation={3} style={{ padding: '16px' }}>
          <Typography variant="h6">Total Queues</Typography>
          <Typography variant="h3">{queues.length}</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Paper elevation={3} style={{ padding: '16px' }}>
          <Typography variant="h6">Total Workloads</Typography>
          <Typography variant="h3">{workloads.length}</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6} md={4}>
        <Paper elevation={3} style={{ padding: '16px' }}>
          <Typography variant="h6">Pending Workloads</Typography>
          <Typography variant="h3">
            {workloads.filter(wl => wl.status?.state === "Pending").length}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;


