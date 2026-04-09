function allocateDeliveries(data) {
  const slots = data.slots || [];
  const orders = data.orders || [];

  // store how much space each slot has left
  const capacity = {};
  const slotOrder = [];

  for (let i = 0; i < slots.length; i++) {
    capacity[slots[i].slotId] = slots[i].capacity;
    slotOrder.push(slots[i].slotId);
  }

  // high priority should go first
  const priority = { 'High': 3, 'Medium': 2, 'Low': 1 };

  const sorted = [...orders].sort((a, b) => {
    return (priority[b.priority] || 0) - (priority[a.priority] || 0);
  });

  const output = [];

  for (let i = 0; i < sorted.length; i++) {
    const order = sorted[i];
    let slot = null;

    // try preferred slot first
    if (capacity[order.preferredSlotId] > 0) {
      slot = order.preferredSlotId;
    } else {
      // preferred is full or doesnt exist, find next available
      for (let j = 0; j < slotOrder.length; j++) {
        if (capacity[slotOrder[j]] > 0) {
          slot = slotOrder[j];
          break;
        }
      }
    }

    if (slot) {
      capacity[slot]--;
      output.push({ orderId: order.orderId, priority: order.priority, assignedSlot: slot });
    } else {
      output.push({ orderId: order.orderId, priority: order.priority, assignedSlot: 'Unassigned' });
    }
  }

  return output;
}

if (require.main === module) {
  const test = {
    slots: [
      { slotId: "S1", time: "9-11", capacity: 2 },
      { slotId: "S2", time: "11-1", capacity: 1 }
    ],
    orders: [
      { orderId: "O1", preferredSlotId: "S2", priority: "Low" },
      { orderId: "O2", preferredSlotId: "S1", priority: "High" },
      { orderId: "O3", preferredSlotId: "S1", priority: "Medium" },
      { orderId: "O4", preferredSlotId: "S3", priority: "High" },
      { orderId: "O5", preferredSlotId: "S2", priority: "High" }
    ]
  };
  console.log(JSON.stringify(allocateDeliveries(test), null, 2));
}

module.exports = { allocateDeliveries };