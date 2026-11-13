const cameraList = document.querySelector("#cameraList");
const incidentList = document.querySelector("#incidentList");
const statusFilter = document.querySelector("#statusFilter");

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "API request failed");
  }
  return data;
}

async function loadCameras() {
  const cameras = await api("/api/cameras");
  cameraList.innerHTML = cameras.map(camera => `
    <article class="card">
      <h3>${camera.id}</h3>
      <p>${camera.name}</p>
      <p>${camera.location}</p>
      <strong class="${camera.status}">${camera.status.toUpperCase()}</strong>
      ${camera.previewUrl ? <p><a href="${camera.previewUrl}" target="_blank">Открыть поток</a></p> : ""}
    </article>
  `).join("");
}

async function loadIncidents() {
  const status = statusFilter.value;
  const url = status ? /api/incidents?status=${status} : "/api/incidents";
  const incidents = await api(url);

  if (incidents.length === 0) {
    incidentList.innerHTML = "<p>Инцидентов нет.</p>";
    return;
  }

  incidentList.innerHTML = incidents.map(item => `
    <article class="incident">
      <h3>${item.title}</h3>
      <p>${item.cameraId} · ${item.severity} · ${item.status}</p>
      <button onclick="setStatus('${item.id}','in_progress')">В работу</button>
      <button onclick="setStatus('${item.id}','resolved')">Решено</button>
    </article>
  `).join("");
}

async function setStatus(id, status) {
  await api(/api/incidents/${id}, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  await loadIncidents();
}

statusFilter.addEventListener("change", loadIncidents);

async function start() {
  try {
    await Promise.all([loadCameras(), loadIncidents()]);
  } catch (error) {
    alert(error.message);
  }
}

start();