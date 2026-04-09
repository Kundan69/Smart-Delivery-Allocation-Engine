document.addEventListener('DOMContentLoaded', () => {

  const allocateBtn = document.getElementById('allocate-btn');
  const resetBtn    = document.getElementById('reset-btn');
  const exportBtn   = document.getElementById('export-btn');
  const themeBtn    = document.getElementById('theme-btn');
  const jsonInput   = document.getElementById('json-input');
  const slotsContainer = document.getElementById('slots-container');
  const resultsBody = document.getElementById('results-body');
  const toast       = document.getElementById('toast');
  const toastMsg    = document.getElementById('toast-msg');

  const statTotal      = document.getElementById('stat-total');
  const statAssigned   = document.getElementById('stat-assigned');
  const statUnassigned = document.getElementById('stat-unassigned');
  const statSlots      = document.getElementById('stat-slots');

  let lastResult = null;
  const defaultInput = jsonInput.value;

  // auto resize textarea
  function autoResize() {
    jsonInput.style.height = 'auto';
    jsonInput.style.height = jsonInput.scrollHeight + 'px';
  }
  autoResize();
  jsonInput.addEventListener('input', autoResize);

  // dark/light toggle
  themeBtn.addEventListener('click', () => {
    document.getElementById('app').classList.toggle('dark');
  });

  allocateBtn.addEventListener('click', runAllocation);
  resetBtn.addEventListener('click', resetApp);
  exportBtn.addEventListener('click', exportResults);

  async function runAllocation() {
    allocateBtn.disabled = true;
    allocateBtn.innerText = 'Processing...';

    try {
      let inputData;
      try {
        inputData = JSON.parse(jsonInput.value);
      } catch (e) {
        throw new Error('JSON is not valid, check your input.');
      }

      if (!inputData.slots || !inputData.orders) {
        throw new Error('Need both slots and orders in the JSON.');
      }

      const res = await fetch('/api/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputData)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      lastResult = data.result;
      showToast('Done!');
      renderDashboard(inputData.slots, data.result);

    } catch (err) {
      showToast(err.message, true);
    }

    allocateBtn.disabled = false;
    allocateBtn.innerText = 'Run Algorithm';
  }

  function renderDashboard(slots, results) {
    const total      = results.length;
    const assigned   = results.filter(r => r.assignedSlot !== 'Unassigned').length;
    const unassigned = total - assigned;

    // count usage per slot
    const usage = {};
    slots.forEach(s => {
      usage[s.slotId] = { used: 0, max: s.capacity, time: s.time };
    });
    results.forEach(r => {
      if (r.assignedSlot !== 'Unassigned' && usage[r.assignedSlot]) {
        usage[r.assignedSlot].used++;
      }
    });

    animateValue(statTotal, total);
    animateValue(statAssigned, assigned);
    animateValue(statUnassigned, unassigned);
    animateValue(statSlots, slots.length);

    // render slot cards
    slotsContainer.innerHTML = '';
    slots.forEach(slot => {
      const u = usage[slot.slotId];
      const pct = u.max === 0 ? 0 : Math.min(100, (u.used / u.max) * 100);

      let barClass = '';
      if (pct >= 100) barClass = 'full';
      else if (pct >= 75) barClass = 'warn';

      const card = document.createElement('div');
      card.className = 'slot-card';
      card.innerHTML = `
        <div class="slot-top">
          <span class="slot-id">${slot.slotId}</span>
          <span class="slot-time">${slot.time}</span>
        </div>
        <div class="pbar-bg">
          <div class="pbar ${barClass}" style="width:0%"></div>
        </div>
        <div class="slot-count">${u.used} / ${u.max} used</div>
      `;
      slotsContainer.appendChild(card);

      setTimeout(() => {
        card.querySelector('.pbar').style.width = pct + '%';
      }, 100);
    });

    if (slots.length === 0) {
      slotsContainer.innerHTML = '<div class="empty-msg">No slots provided.</div>';
    }

    // render table
    resultsBody.innerHTML = '';
    results.forEach((item, i) => {
      const tr = document.createElement('tr');
      tr.style.opacity = '0';
      tr.style.transition = 'opacity .3s ease';

      const pClass = item.priority === 'High' ? 'bh' : item.priority === 'Medium' ? 'bm' : 'bl';
      const ok = item.assignedSlot !== 'Unassigned';

      tr.innerHTML = `
        <td><b>${item.orderId}</b></td>
        <td><span class="badge ${pClass}">${item.priority}</span></td>
        <td><span class="${ok ? 'ok' : 'no'}">${ok ? 'Success' : 'Failed'}</span></td>
        <td><span class="${ok ? 'slot-tag' : 'unassigned'}">${item.assignedSlot}</span></td>
      `;

      resultsBody.appendChild(tr);
      setTimeout(() => { tr.style.opacity = '1'; }, 50 * i);
    });
  }

  function animateValue(el, end, duration = 700) {
    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      el.innerHTML = Math.floor(progress * end);
      if (progress < 1) requestAnimationFrame(step);
      else el.innerHTML = end;
    }
    requestAnimationFrame(step);
  }

  function resetApp() {
    jsonInput.value = defaultInput;
    autoResize();
    statTotal.innerText = '0';
    statAssigned.innerText = '0';
    statUnassigned.innerText = '0';
    statSlots.innerText = '0';
    slotsContainer.innerHTML = '<div class="empty-msg">Awaiting execution...</div>';
    resultsBody.innerHTML = '<tr><td colspan="4" class="empty-msg">Press Run Algorithm to start.</td></tr>';
    lastResult = null;
    showToast('Reset done.');
  }

  function exportResults() {
    if (!lastResult) {
      showToast('Run the algorithm first.', true);
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(lastResult, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', 'results.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast('Downloaded.');
  }

  let toastTimer;
  function showToast(msg, isError = false) {
    toastMsg.innerText = msg;
    toast.className = 'toast' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.className = 'toast hidden'; }, 3500);
  }

});