# StateLens

StateLens is a small full-stack project for modeling system behavior from event sequences. It turns events into states, transitions, and anomaly patterns, making it useful for debugging workflows, understanding systems, and exploring edge cases.

## Features

- Add a scenario name and event sequence
- Automatically derive unique states
- Show state-to-state transitions
- Detect repeating-state and loop-style anomalies
- Save scenarios in SQLite
- Simple responsive frontend

## Tech stack

- Node.js
- Express
- SQLite via `better-sqlite3`
- Plain HTML/CSS/JavaScript frontend

## Run locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000
```

## Example input

```text
start
verify
login
success
```

## Project structure

```text
state-lens/
├── app.js
├── database.js
├── server.js
├── package.json
├── public/
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── README.md
└── .gitignore
```

## License

MIT
