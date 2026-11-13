const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "data", "db.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "smart-security-desk" });
});

app.get("/api/cameras", (req, res) => {
  res.json(readDB().cameras);
});

app.patch("/api/cameras/:id", (req, res) => {
  const db = readDB();
  const camera = db.cameras.find(x => x.id === req.params.id);

  if (!camera) {
    return res.status(404).json({ error: "Camera not found" });
  }

  if (req.body.status && !["online", "offline"].includes(req.body.status)) {
    return res.status(400).json({ error: "Invalid camera status" });
  }

  Object.assign(camera, req.body, { updatedAt: new Date().toISOString() });
  writeDB(db);
  res.json(camera);
});

app.get("/api/events", (req, res) => {
  const db = readDB();
  let items = [...db.events];

  if (req.query.severity) {
    items = items.filter(x => x.severity === req.query.severity);
  }

  if (req.query.cameraId) {
    items = items.filter(x => x.cameraId === req.query.cameraId);
  }

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

app.post("/api/events", (req, res) => {
  const db = readDB();
  const { type, cameraId, severity, message } = req.body;

  if (!type || !cameraId || !severity || !message) {
    return res.status(400).json({
      error: "type, cameraId, severity, message are required"
    });
  }

  const event = {
    id: Date.now(),
    type,
    cameraId,
    severity,
    message,
    createdAt: new Date().toISOString()
  };

  db.events.push(event);
  writeDB(db);
  res.status(201).json(event);
});

app.get("/api/incidents", (req, res) => {
  const db = readDB();
  let items = [...db.incidents];

  if (req.query.status) {
    items = items.filter(x => x.status === req.query.status);
  }

  if (req.query.severity) {
    items = items.filter(x => x.severity === req.query.severity);
  }

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

app.post("/api/incidents", (req, res) => {
  const db = readDB();
  const { title, cameraId, severity, description = "" } = req.body;

  if (!title || !cameraId || !severity) {
    return res.status(400).json({
      error: "title, cameraId, severity are required"
    });
  }

  const incident = {
    id: Date.now(),
    title,
    cameraId,
    severity,
    description,
    status: "new",
    assignee: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.incidents.push(incident);
  writeDB(db);
  res.status(201).json(incident);
});

app.patch("/api/incidents/:id", (req, res) => {
  const db = readDB();
  const incident = db.incidents.find(x => String(x.id) === req.params.id);

  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }

  const allowed = ["new", "in_progress", "resolved"];

  if (req.body.status && !allowed.includes(req.body.status)) {
    return res.status(400).json({ error: "Invalid incident status" });
  }

  Object.assign(incident, req.body, { updatedAt: new Date().toISOString() });
  writeDB(db);
  res.json(incident);
});

app.listen(PORT, () => {
  console.log('Smart Security Desk: http://localhost:${PORT}');
});