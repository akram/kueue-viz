import { Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography, IconButton, Collapse } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import useWebSocket from './useWebSocket';
import './App.css';

const Dashboard = () => {
  const [queues, setQueues] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: kueueData, error: kueueError } = useWebSocket('ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/kueue');

  useEffect(() => {
    if (kueueData) {
      setQueues(kueueData.queues.items || []);
      setWorkloads(kueueData.workloads.items || []);

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

      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Workloads
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="icon-column"></TableCell>
              <TableCell className="name-column">Name</TableCell>
              <TableCell className="pods-count-column">Pods Count</TableCell>
              <TableCell className="queue-name-column">Queue Name</TableCell>
              <TableCell className="admission-status-column">Admission Status</TableCell>
              <TableCell className="cluster-queue-column">Cluster Queue Admission</TableCell>
              <TableCell className="preempted-column">Preempted</TableCell>
              <TableCell className="priority-column">Priority</TableCell>
              <TableCell className="priority-class-column">Priority Class Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workloads.map((workload) => {
              const podCount = workload.spec?.podSets?.reduce((sum, podSet) => sum + (podSet.count || 0), 0) || 0;
              const isExpanded = expandedRows[workload.metadata.name];
              const pods = workload.pods || [];

              const preemptedCondition = workload.status?.conditions?.find(cond => cond.type === "Evicted" && cond.status === "True");
              const preemptedText = preemptedCondition ? `Yes: ${preemptedCondition.reason}` : "No";

              return (
                <React.Fragment key={workload.metadata.name}>
                  <TableRow>
                    <TableCell className="icon-column">
                      <IconButton onClick={() => toggleRow(workload.metadata.name)}>
                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell className="name-column">
                      <Link to={`/workload/${workload.metadata.name}`}>
                        {workload.metadata.name}
                      </Link>
                    </TableCell>
                    <TableCell className="pods-count-column">{podCount}</TableCell>
                    <TableCell className="queue-name-column">
                      <Link to={`/local-queue/${workload.spec.queueName}`}>{workload.spec.queueName}</Link>
                    </TableCell>
                    <TableCell className="admission-status-column">
                      {(() => {
                        const admittedCondition = workload.status?.conditions?.find(cond => cond.type === "Admitted");
                        const admissionStatus = admittedCondition && admittedCondition.status === "True" ? "Admitted" : "Not admitted";
                        return `${admissionStatus}: ${admittedCondition?.reason || "N/A"}`;
                      })()}
                    </TableCell>
                    <TableCell className="cluster-queue-column">
                      <Link to={`/cluster-queue/${workload.status?.admission?.clusterQueue}`}>
                        {workload.status?.admission?.clusterQueue || "N/A"}
                      </Link>
                    </TableCell>
                    <TableCell className="preempted-column">{preemptedText}</TableCell>
                    <TableCell className="priority-column">{workload.spec.priority || "N/A"}</TableCell>
                    <TableCell className="priority-class-column">{workload.spec.priorityClassName || "N/A"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={9} style={{ paddingBottom: 0, paddingTop: 0 }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell className="icon-column">|</TableCell>
                              <TableCell className="name-column">Pod Name</TableCell>
                              <TableCell className="pods-count-column">Status</TableCell>
                              <TableCell>Pending Reason</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {pods.map((pod) => {
                              const podPhase = pod.status?.phase;
                              const pendingCondition = pod.status?.conditions?.find(
                                cond => cond.type === "PodScheduled" && cond.status === "False"
                              );
                              return (
                                <TableRow key={pod.name}>
                                  <TableCell className="icon-column">
                                    <span style={{ color: '#888' }}>⎯</span>
                                  </TableCell>
                                  <TableCell className="name-column">{pod.name}</TableCell>
                                  <TableCell className="pods-count-column">{podPhase}</TableCell>
                                  <TableCell>
                                    {podPhase === "Pending" && pendingCondition ? (
                                      <Tooltip title={`${pendingCondition.reason}: ${pendingCondition.message}`}>
                                        <Typography color="error">{pendingCondition.reason}</Typography>
                                      </Tooltip>
                                    ) : (
                                      "N/A"
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
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
