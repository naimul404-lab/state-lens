const path = require('node:path');
const express = require('express');
const { listScenarios, createScenario, getScenarioById, createScenarioWithEvents } = require('./database');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function analyzeEvents(events) {
  const normalized = (events || []).map((event) => String(event).trim()).filter(Boolean);
  const uniqueStates = [...new Set(normalized)];
  const transitions = [];
  const anomalies = [];

  for (let i = 1; i < normalized.length; i += 1) {
    const from = normalized[i - 1];
    const to = normalized[i];
    transitions.push({ from, to });

    if (from === to) {
      anomalies.push({ type: 'repeated-state', message: `State "${from}" repeated consecutively.` });
    }
  }

  for (let i = 2; i < normalized.length; i += 1) {
    if (normalized[i - 2] === normalized[i] && normalized[i - 1] !== normalized[i]) {
      anomalies.push({ type: 'loop-pattern', message: `Pattern suggests a loop: ${normalized[i - 2]} -> ${normalized[i - 1]} -> ${normalized[i]}.` });
    }
  }

  if (normalized.length > 0 && normalized[0] === normalized[normalized.length - 1]) {
    anomalies.push({ type: 'circular-end', message: 'The sequence begins and ends in the same state.' });
  }

  return {
    totalEvents: normalized.length,
    uniqueStates,
    transitions,
    anomalies,
    summary: {
      stateCount: uniqueStates.length,
      transitionCount: transitions.length,
      anomalyCount: anomalies.length
    }
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'StateLens' });
});

app.get('/api/scenarios', (_req, res) => {
  res.json({ data: listScenarios() });
});

app.get('/api/scenarios/:id', (req, res) => {
  const scenario = getScenarioById(Number(req.params.id));
  if (!scenario) {
    return res.status(404).json({ error: 'Scenario not found.' });
  }
  res.json({ data: scenario });
});

app.post('/api/scenarios', (req, res) => {
  const { name, events } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Scenario name is required.' });
  }
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'At least one event is required.' });
  }

  const normalizedEvents = events.map((event) => String(event).trim()).filter(Boolean);
  if (normalizedEvents.length === 0) {
    return res.status(400).json({ error: 'Events must contain valid names.' });
  }

  const scenario = createScenarioWithEvents(name.trim(), normalizedEvents);
  const analysis = analyzeEvents(normalizedEvents);
  res.status(201).json({ data: { ...scenario, analysis } });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

module.exports = app;
