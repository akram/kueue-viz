import { CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import useWebSocket from './useWebSocket';
import './App.css';

const Workloads = () => {
  const { data: data, error } = useWebSocket('ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/kueue');
  const [workloads, setWorkloads] = useState([]);
  useEffect(() => {
    setWorkloads(data?.workloads?.items || []);
  }, [data]);

  if (error) return <Typography color="error">{error}</Typography>;
  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      {/* Display a table with workload details */}
      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>Workloads</Typography>
      {workloads.length === 0 ? (
        <CircularProgress />
      ) : (
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
                <TableCell><Link to={`/local-queue/${workload.spec.queueName}`}>{workload.spec.queueName}</Link></TableCell>
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
      )}
    </Paper>
  );
};

export default Workloads;