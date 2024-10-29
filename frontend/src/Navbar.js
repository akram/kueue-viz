import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Button } from '@mui/material';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Link to="/" className="navbar-link">
          <img src="/kueue-viz.png" className="navbar-logo" />
          <Typography variant="h6" component="div">Kueue Viz</Typography>
        </Link>        
        <Button color="inherit" component={Link} to="/">Dashboard</Button>
        <Button color="inherit" component={Link} to="/local-queues">Local Queues</Button>
        <Button color="inherit" component={Link} to="/cluster-queues">Cluster Queues</Button>
        <Button color="inherit" component={Link} to="/resource-flavors">Resource Flavors</Button>

      </Toolbar>
    </AppBar>
  );
};

export default Navbar;


