
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Grid, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
  const [queues, setQueues] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.error("REACT_APP_BACKEND_URL:", `${process.env.REACT_APP_BACKEND_URL}`);
        const response = await axios.get('http://backend-kueue-viz.apps.rosa.akram.s25d.p3.openshiftapps.com/kueue/status');
        setQueues(response.data.queues.items || []);
        setWorkloads(response.data.workloads.items || []);
        // Check for preempted workloads and trigger a notification
        response.data.workloads.items.forEach(workload => {
          if (workload.preemption?.preempted) {
            toast.error(`Workload ${workload.metadata.name} was preempted: ${workload.preemption.reason}`);
          }
        });
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
    <>
      <ToastContainer />
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

      {/* Display a table with workload details */}
      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Workloads
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Preempted</TableCell>
              <TableCell>Preemption Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workloads.map(workload => (
              <TableRow key={workload.metadata.name}>
                <TableCell>{workload.metadata.name}</TableCell>
                <TableCell>{workload.status?.state || "Unknown"}</TableCell>
                <TableCell>{workload.preemption?.preempted ? "Yes" : "No"}</TableCell>
                <TableCell>{workload.preemption?.reason || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default Dashboard;