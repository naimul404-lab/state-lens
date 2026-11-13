const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'data', 'state-lens.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id INTEGER NOT NULL,
    event_name TEXT NOT NULL,
    step_index INTEGER NOT NULL,
    FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_events_scenario_id ON events(scenario_id);
`);

function listScenarios() {
  return db.prepare('SELECT * FROM scenarios ORDER BY created_at DESC').all();
}

function getScenarioById(id) {
  const scenario = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id);
  if (!scenario) return null;
  const events = db.prepare('SELECT event_name, step_index FROM events WHERE scenario_id = ? ORDER BY step_index').all(id);
  return {
    ...scenario,
    events: events.map((event) => event.event_name)
  };
}

function createScenarioWithEvents(name, eventList) {
  const insertScenario = db.prepare('INSERT INTO scenarios (name) VALUES (?)');
  const insertEvent = db.prepare('INSERT INTO events (scenario_id, event_name, step_index) VALUES (?, ?, ?)');

  const tx = db.transaction(() => {
    const result = insertScenario.run(name);
    for (let i = 0; i < eventList.length; i += 1) {
      insertEvent.run(result.lastInsertRowid, eventList[i], i);
    }
    return getScenarioById(result.lastInsertRowid);
  });

  return tx();
}

module.exports = {
  listScenarios,
  getScenarioById,
  createScenarioWithEvents
};
