import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './Dashboard';
import LocalQueues from './LocalQueues';
import ClusterQueues from './ClusterQueues';
import ResourceFlavors from './ResourceFlavors';
import ResourceFlavorDetail from './ResourceFlavorDetail';
import Workloads from './Workloads';
import WorkloadDetail from './WorkloadDetail';
import LocalQueueDetail from './LocalQueueDetail';
import Navbar from './Navbar';

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

        <Route path="/workload/:workloadName" element={<WorkloadDetail />} />
        <Route path="/local-queue/:queueName" element={<LocalQueueDetail />} />
        <Route path="/cluster-queue/:clusterQueueName" element={<WorkloadDetail />} />
        <Route path="/resource-flavor/:flavorName" element={<ResourceFlavorDetail />} />
      </Routes>
    </Router>
  );
};

export default App;
