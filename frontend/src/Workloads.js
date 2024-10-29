import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography } from '@mui/material';
import WorkloadsList from './WorkloadsList';
import useWebSocket from './useWebSocket';




const Workloads = () => {
  const [workloads, setWorkloads] = useState([]);
  const { data: workloadsData, error } = useWebSocket('ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/workloads');
  useEffect(() => {
      setWorkloads(workloadsData?.items);
  }, [workloadsData]);

  if (error) return <Typography variant="h6" color="error">{error}</Typography>;
  return (
    <>
      <Typography variant="h5" gutterBottom>All Workloads</Typography>
      <WorkloadsList workloads={workloads} />
    </>
  );
};

export default Workloads;
