const express = require('express');
const { getQueueStatus } = require('./k8sClient');

const app = express();
const port = 3000;

app.get('/kueue/status', async (req, res) => {
  try {
    const status = await getQueueStatus("default");  // Adjust namespace as needed
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Kueue service is running on port ${port}`);
});


