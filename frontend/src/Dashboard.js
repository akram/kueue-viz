import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, IconButton, Collapse } from '@mui/material';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import useWebSocket from './useWebSocket';

const Dashboard = () => {
  const [queues, setQueues] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [podsData, setPodsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Main WebSocket for kueue/status data
  const { data: kueueData, error: kueueError } = useWebSocket('ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/kueue');

  // Process the workload data when received
  useEffect(() => {
    if (kueueData) {
      setQueues(kueueData.queues.items || []);
      setWorkloads(kueueData.workloads.items || []);

      // Trigger a notification for preempted workloads
      kueueData.workloads.items.forEach(workload => {
        if (workload.preemption?.preempted) {
          toast.error(`Workload ${workload.metadata.name} was preempted: ${workload.preemption.reason}`);
        }
      });
    }
    if (kueueError) setError("Failed to fetch data from WebSocket");
    setLoading(false);
  }, [kueueData, kueueError]);

  const toggleRow = (workloadName) => {
    setExpandedRows((prevExpandedRows) => ({
      ...prevExpandedRows,
      [workloadName]: !prevExpandedRows[workloadName],
    }));

    // Fetch pod data via WebSocket if not already fetched
    if (!podsData[workloadName]) {
      const { data: podData } = useWebSocket(`ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/workload/${workloadName}/pods`);
      setPodsData((prevPodsData) => ({
        ...prevPodsData,
        [workloadName]: podData,
      }));
    }
  };

  if (loading) return <Typography variant="h6">Loading...</Typography>;
  if (error) return <Typography variant="h6" color="error">{error}</Typography>;

  return (
    <>
      <ToastContainer />
      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper elevation={3} style={{ padding: '16px' }}>
            <Typography variant="h6">Total Cluster Local Queues</Typography>
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
              <TableCell></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Queue Name</TableCell>
              <TableCell>Admission Status</TableCell>
              <TableCell>Cluster Queue Admission</TableCell>
              <TableCell>Preempted</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Priority Class Name</TableCell>
              <TableCell>Pods Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workloads.map((workload) => {
              const podCount = workload.spec?.podSets?.reduce((sum, podSet) => sum + (podSet.count || 0), 0) || 0;
              const isExpanded = expandedRows[workload.metadata.name];
              const pods = podsData[workload.metadata.name] || [];

              return (
                <React.Fragment key={workload.metadata.name}>
                  <TableRow>
                    <TableCell>
                      <IconButton onClick={() => toggleRow(workload.metadata.name)}>
                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Link to={`/workload/${workload.metadata.name}`}>
                        {workload.metadata.name}
                      </Link>
                    </TableCell>
                    <TableCell><Link to={`/local-queue/${workload.spec.queueName}`}>{workload.spec.queueName}</Link></TableCell>
                    <TableCell>{podCount}</TableCell>
                    {/* Add additional cells as needed */}
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={9} style={{ paddingBottom: 0, paddingTop: 0 }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Pod Name</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {pods.map((pod) => (
                              <TableRow key={pod.name}>
                                <TableCell>{pod.name}</TableCell>
                                <TableCell>{pod.status}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default Dashboard;
