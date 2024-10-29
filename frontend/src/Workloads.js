import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography } from '@mui/material';
import WorkloadsList from './WorkloadsList';
import useWebSocket from './useWebSocket';




const Workloads = () => {
  const [workloads, setWorkloads] = useState([]);
  const { data: items, error } = useWebSocket('ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/cluster-queues');
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    if (items && Array.isArray(items)) {
      setWorkloads(items);
    }
  }, [items]);

  if (error) return <Typography variant="h6" color="error">{error}</Typography>;
  return (
    <>
      <Typography variant="h5" gutterBottom>All Workloads</Typography>
      <WorkloadsList workloads={workloads} />
    </>
  );
};

export default Workloads;
