const { KubeConfig, CustomObjectsApi } = require('@kubernetes/client-node');

const kc = new KubeConfig();
kc.loadFromCluster(); // Load in-cluster config for OpenShift/Kubernetes
const k8sApi = kc.makeApiClient(CustomObjectsApi);

async function getQueues(namespace = 'default') {
  try {
    const response = await k8sApi.listNamespacedCustomObject(
      'kueue.x-k8s.io',
      'v1beta1',   // Updated API version
      namespace,
      'queues'
    );
    return response.body;
  } catch (error) {
    console.error(`Error fetching queues: ${error.message}`);
    return { error: error.message };
  }
}

async function getWorkloads(namespace = 'default') {
  try {
    const response = await k8sApi.listNamespacedCustomObject(
      'kueue.x-k8s.io',
      'v1beta1',   // Updated API version
      namespace,
      'workloads'
    );
    return response.body;
  } catch (error) {
    console.error(`Error fetching workloads: ${error.message}`);
    return { error: error.message };
  }
}

async function getQueueStatus(namespace = 'default') {
  const queues = await getQueues(namespace);
  const workloads = await getWorkloads(namespace);
  return { queues, workloads };
}

module.exports = { getQueues, getWorkloads, getQueueStatus };


