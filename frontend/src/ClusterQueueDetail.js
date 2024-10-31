import { CircularProgress, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useWebSocket from './useWebSocket';

const ClusterQueueDetail = () => {
  const { clusterQueueName } = useParams();
  const url = `ws://backend-keue-viz.apps.rosa.akram.q1gr.p3.openshiftapps.com/ws/cluster-queue/${clusterQueueName}`;
  const { data: clusterQueueData, error } = useWebSocket(url);

  const [clusterQueue, setClusterQueue] = useState(null);

  useEffect(() => {
    if (clusterQueueData) setClusterQueue(clusterQueueData);
  }, [clusterQueueData]);

  if (error) return <Typography color="error">{error}</Typography>;

  if (!clusterQueue) {
    return (
      <Paper style={{ padding: '16px', marginTop: '20px' }}>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Paper>
    );
  }

  return (
    <Paper style={{ padding: '16px', marginTop: '20px' }}>
      <Typography variant="h4" gutterBottom>Cluster Queue Detail: {clusterQueueName}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography variant="body1"><strong>Name:</strong> {clusterQueue.metadata?.name}</Typography>
          <Typography variant="body1"><strong>UID:</strong> {clusterQueue.metadata?.uid}</Typography>
          <Typography variant="body1"><strong>Creation Timestamp:</strong> {new Date(clusterQueue.metadata?.creationTimestamp).toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
          <Typography variant="body1"><strong>Admitted Workloads:</strong> {clusterQueue.status?.admittedWorkloads}</Typography>
          <Typography variant="body1"><strong>Reserving Workloads:</strong> {clusterQueue.status?.reservingWorkloads}</Typography>
          <Typography variant="body1"><strong>Pending Workloads:</strong> {clusterQueue.status?.pendingWorkloads}</Typography>
        </Grid>
      </Grid>



      {/* Resource Groups Section */}
      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Resource Groups
      </Typography>
      
      {clusterQueue.resourceGroups && clusterQueue.resourceGroups.length === 0 ? (
        <Typography>No resource groups defined for this cluster queue.</Typography>
      ) : (
        <TableContainer component={Paper} style={{ marginTop: '20px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Covered Resources</TableCell>
                <TableCell>Flavor</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Nominal Quota</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clusterQueue.spec.resourceGroups.map((group, groupIndex) => (
                <React.Fragment key={`resourceGroup-${groupIndex}`}>
                  {group.flavors.map((flavor, flavorIndex) => (
                    <React.Fragment key={`${groupIndex}-${flavor.name}`}>
                      {flavor.resources.map((resource, resourceIndex) => (
                        <TableRow key={`${groupIndex}-${flavor.name}-${resource.name}`}>
                          {/* Display Covered Resources with rowSpan across all flavors and resources in this group */}
                          {flavorIndex === 0 && resourceIndex === 0 && (
                            <TableCell rowSpan={group.flavors.reduce((acc, f) => acc + f.resources.length, 0)}>
                              {group.coveredResources.join(', ')}
                            </TableCell>
                          )}

                          {/* Display Flavor Name with rowSpan across its resources */}
                          {resourceIndex === 0 && (
                            <TableCell rowSpan={flavor.resources.length}>
                              {flavor.name}
                            </TableCell>
                          )}

                          {/* Display Resource Name and Nominal Quota */}
                          <TableCell>{resource.name}</TableCell>
                          <TableCell>{resource.nominalQuota}</TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}





      <Typography variant="h5" gutterBottom style={{ marginTop: '20px' }}>
        Local Queues Using This Cluster Queue
      </Typography>
      
      {clusterQueue.queues && clusterQueue.queues.length === 0 ? (
        <Typography>No local queues are using this cluster queue.</Typography>
      ) : (
        <TableContainer component={Paper} style={{ marginTop: '20px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Queue Name</TableCell>
                <TableCell>Flavor</TableCell>
                <TableCell>Resource</TableCell>
                <TableCell>Reservation</TableCell>
                <TableCell>Usage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clusterQueue.queues.map((queue) => (
                <React.Fragment key={queue.name}>
                  {queue.reservation?.map((reservation, resIndex) => (
                    <React.Fragment key={`${queue.name}-reservation-${resIndex}`}>
                      {reservation.resources?.map((resource, resResourceIndex) => (
                        <TableRow key={`${queue.name}-${reservation.name}-${resource.name}`}>
                          {/* Display Queue Name with rowSpan across all flavors and resources */}
                          {resIndex === 0 && resResourceIndex === 0 && (
                            <TableCell rowSpan={queue.reservation.reduce((acc, flavor) => acc + (flavor.resources?.length || 0), 0)}>
                              {queue.name}
                            </TableCell>
                          )}

                          {/* Display Flavor Name with rowSpan across its resources */}
                          {resResourceIndex === 0 && (
                            <TableCell rowSpan={reservation.resources?.length || 1}>
                              {reservation.name}
                            </TableCell>
                          )}

                          {/* Display Resource Name, Reservation, and Usage */}
                          <TableCell>{resource.name}</TableCell>
                          <TableCell>{resource.total}</TableCell>
                          <TableCell>
                            {queue.usage?.find((usage) => usage.name === reservation.name)
                              ?.resources?.find((res) => res.name === resource.name)?.total || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ClusterQueueDetail;
