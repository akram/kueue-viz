import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Button } from '@mui/material';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" component={Link} to="/">Dashboard</Button>
        <Button color="inherit" component={Link} to="/local-queues">Local Queues</Button>
        <Button color="inherit" component={Link} to="/cluster-queues">Cluster Queues</Button>
        <Button color="inherit" component={Link} to="/resource-flavors">Resource Flavors</Button>

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;


