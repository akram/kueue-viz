import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography } from '@mui/material';
import WorkloadsList from './WorkloadsList';

const Workloads = () => {
  const [workloads, setWorkloads] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/kueue/workloads');
        setWorkloads(response.data.items || []);
      } catch (error) {
        setError('Failed to fetch workloads');
        console.error("Error fetching workloads:", error);
      }
    };

    fetchData();
  }, []);

  if (error) return <Typography variant="h6" color="error">{error}</Typography>;

  return (
    <>
      <Typography variant="h5" gutterBottom>All Workloads</Typography>
      <WorkloadsList workloads={workloads} />
    </>
  );
};

export default Workloads;
