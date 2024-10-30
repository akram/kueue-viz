import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './Dashboard';
import LocalQueues from './LocalQueues';
import ClusterQueues from './ClusterQueues';
import Navbar from './Navbar';

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/local-queues" element={<LocalQueues />} />
        <Route path="/cluster-queues" element={<ClusterQueues />} />
      </Routes>
    </Router>
  );
};

export default App;

