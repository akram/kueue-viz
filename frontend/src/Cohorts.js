import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, IconButton, Collapse } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import useWebSocket from './useWebSocket';
import './App.css';

const Cohorts = () => {
  const { data: cohorts, error } = useWebSocket('ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/cohorts');
  const [cohortList, setCohortList] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    if (cohorts && Array.isArray(cohorts)) {
      setCohortList(cohorts);
    }
  }, [cohorts]);

  const toggleRow = (cohortName) => {
    setExpandedRows((prev) => ({
      ...prev,
      [cohortName]: !prev[cohortName],
    }));
  };

  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Cohorts</Typography>
      {cohortList.length === 0 ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Number of Queues</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cohortList.map((cohort) => {
                const isExpanded = expandedRows[cohort.name];
                return (
                  <React.Fragment key={cohort.name}>
                    <TableRow>
                      <TableCell>
                        <IconButton onClick={() => toggleRow(cohort.name)}>
                          {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Link to={`/cohort/${cohort.name}`}>{cohort.name}</Link>
                      </TableCell>
                      <TableCell>{cohort.clusterQueues ? cohort.clusterQueues.length : 0}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={3} style={{ paddingBottom: 0, paddingTop: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Cluster Queue Name</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {cohort.clusterQueues && cohort.clusterQueues.length > 0 ? (
                                cohort.clusterQueues.map((queue) => (
                                  <TableRow key={queue.name}>
                                    <TableCell>
                                      <Link to={`/cluster-queue/${queue.name}`}>{queue.name}</Link>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell>No cluster queues found for this cohort.</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default Cohorts;
