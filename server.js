const express = require('express');
const path = require('path');
const { allocateDeliveries } = require('./allocate');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'web','public')));

app.post('/api/allocate', (req, res) => {
  const data = req.body;

  // basic check
  if (!data.slots || !data.orders) {
    res.status(400).json({ success: false, error: 'need slots and orders' });
    return;
  }

  try {
    const result = allocateDeliveries(data);
    res.json({ success: true, result });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(3000, () => {
  console.log('running on http://localhost:3000');
});