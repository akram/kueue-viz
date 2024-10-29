import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = () => {
  const [queues, setQueues] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const processWorkloadData = (data) => {
    setQueues(data.queues.items || []);
    setWorkloads(data.workloads.items || []);

    // Check for preempted workloads and trigger a notification
    data.workloads.items.forEach(workload => {
      if (workload.preemption?.preempted) {
        toast.error(`Workload ${workload.metadata.name} was preempted: ${workload.preemption.reason}`);
      }
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/kueue/status');
        processWorkloadData(response.data);
      } catch (error) {
        setError('Failed to fetch data');
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const ws = new WebSocket(`ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/kueue`);

    ws.onopen = () => {
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      processWorkloadData(data);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      setError("WebSocket connection error");
      ws.close();
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  if (loading) return <Typography variant="h6">Loading...</Typography>;
  if (error) return <Typography variant="h6" color="error">{error}</Typography>;

  return (
    <>
      <ToastContainer />
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={3} style={{ padding: '16px' }}>
            <Typography variant="h6">Total Local Queues</Typography>
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
              <TableCell>Queue Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Preempted</TableCell>
              <TableCell>Preemption Reason</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Priority Class Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workloads.map(workload => (
              <TableRow key={workload.metadata.name}>
                <TableCell>
                  <Tooltip
                    title={
                      <div>
                        <div><strong>Pod Sets Count:</strong> {workload.spec?.podSets?.[0]?.count || 'N/A'}</div>
                        <div><strong>Owner Reference: {workload.ownerReferences?.[0]?.uid || 'N/A'}</strong></div>
                        <div>API Version: {workload.ownerReferences?.[0]?.apiVersion || 'N/A'}</div>
                        <div>Kind: {workload.ownerReferences?.[0]?.kind || 'N/A'}</div>
                        <div>Name: {workload.ownerReferences?.[0]?.name || 'N/A'}</div>
                      </div>
                    }
                    arrow
                  >
                    <Link to={`/workload/${workload.metadata.name}`}>
                      <span style={{ cursor: 'pointer', textDecoration: 'underline', color: 'blue' }}>
                        {workload.metadata.name}
                      </span>
                    </Link>
                  </Tooltip>
                </TableCell>
                <TableCell>{workload.spec.queueName}</TableCell>
                <TableCell>{workload.status?.state || "Unknown"}</TableCell>
                <TableCell>{workload.preemption?.preempted ? "Yes" : "No"}</TableCell>
                <TableCell>{workload.preemption?.reason || "N/A"}</TableCell>
                <TableCell>{workload.spec.priority}</TableCell>
                <TableCell>{workload.spec.priorityClassName}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default Dashboard;