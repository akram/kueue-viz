import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const WorkloadsList = ({ workloads }) => {
  return (
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
          {workloads.map((workload) => (
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
  );
};

export default WorkloadsList;


