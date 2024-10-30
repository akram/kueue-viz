import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import ClusterQueues from './ClusterQueues';
import CohortDetail from './CohortDetail';
import Cohorts from './Cohorts';
import Dashboard from './Dashboard';
import LocalQueueDetail from './LocalQueueDetail';
import LocalQueues from './LocalQueues';
import Navbar from './Navbar';
import ResourceFlavorDetail from './ResourceFlavorDetail';
import ResourceFlavors from './ResourceFlavors';
import WorkloadDetail from './WorkloadDetail';
import Workloads from './Workloads';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workloads" element={<Workloads/>} />
        <Route path="/local-queues" element={<LocalQueues />} />
        <Route path="/cluster-queues" element={<ClusterQueues />} />
        <Route path="/resource-flavors" element={<ResourceFlavors />} />
        <Route path="/cohorts" element={<Cohorts />} />


        <Route path="/workload/:workloadName" element={<WorkloadDetail />} />
        <Route path="/local-queue/:queueName" element={<LocalQueueDetail />} />
        <Route path="/cluster-queue/:clusterQueueName" element={<WorkloadDetail />} />
        <Route path="/resource-flavor/:flavorName" element={<ResourceFlavorDetail />} />
        <Route path="/cohort/:cohortName" element={<CohortDetail />} />

      </Routes>
    </Router>
  );
};

export default App;
