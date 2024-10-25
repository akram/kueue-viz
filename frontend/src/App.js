import React from 'react';
import { Container, Typography } from '@mui/material';
import Dashboard from './Dashboard';

function App() {
  return (
    <Container maxWidth="lg">
      <Typography variant="h2" align="center" gutterBottom>
        Kueue Dashboard
      </Typography>
      <Dashboard />
    </Container>
  );
}

export default App;


