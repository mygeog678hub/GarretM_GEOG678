import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ✅ Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png"
});

function App() {
  // ---------------- STATE ----------------
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [sites, setSites] = useState([]);

  const [newEmployee, setNewEmployee] = useState("");
  const [newAsset, setNewAsset] = useState("");
  const [newSite, setNewSite] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const [activeSiteId, setActiveSiteId] = useState(null);

  const employeeRef = useRef();
  const assetRef = useRef();
  const siteRef = useRef();

  // ---------------- HELPERS ----------------
  const getEmployeesAtSite = (siteId) =>
    employees.filter((e) => e.siteId === siteId);

  const getAssetsForEmployees = (emps) =>
    assets.filter((a) =>
      emps.some((e) => e.id === a.assignedTo)
    );

  // ---------------- GEOCODING ----------------
  const fetchCoordinates = async (location) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&countrycodes=us&limit=1`
      );
      const data = await res.json();

      if (!data.length) return null;

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    } catch {
      return null;
    }
  };

  // ---------------- ADD SITE ----------------
  const handleAddSite = async () => {
    if (!newSite || !newLocation) return;

    const coords = await fetchCoordinates(newLocation);

    if (!coords) {
      alert("Location not found");
      return;
    }

    const isDuplicate = sites.some(
      (s) =>
        Math.abs(s.lat - coords.lat) < 0.01 &&
        Math.abs(s.lng - coords.lng) < 0.01 &&
        s.name.toLowerCase() === newSite.toLowerCase()
    );

    if (isDuplicate) {
      alert("Duplicate site");
      return;
    }

    const id = Date.now();

    setSites([
      ...sites,
      { id, name: newSite, location: newLocation, ...coords }
    ]);

    setActiveSiteId(id);

    setNewSite("");
    setNewLocation("");
    siteRef.current.focus();
  };

  // ---------------- DELETE SITE ----------------
  const handleDeleteSite = (id) => {
    setSites(sites.filter((s) => s.id !== id));
    if (id === activeSiteId) setActiveSiteId(null);
  };

  // ---------------- MAP CONTROL ----------------
  const MapController = () => {
    const map = useMap();

    useEffect(() => {
      if (!activeSiteId) return;

      const site = sites.find((s) => s.id === activeSiteId);
      if (site) map.flyTo([site.lat, site.lng], 12);
    }, [activeSiteId]);

    return null;
  };

  const HomeButton = () => {
    const map = useMap();
    return (
      <button
        onClick={() => map.setView([31.3, -96.8], 6)}
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          zIndex: 1000,
          padding: "8px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: 5
        }}
      >
        Home
      </button>
    );
  };

  // ---------------- UI ----------------
  const card = {
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 8,
    background: "white"
  };

  return (
    <div style={{ padding: 20, background: "#f5f7fa" }}>
      <h1>Workforce Dashboard <span style={{fontSize: 14}}>v3</span></h1>

      {/* 2x2 GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20
      }}>

        {/* EMPLOYEES */}
<div style={card}>
  <h3>Employees</h3>

  {employees.map((emp) => (
    <div key={emp.id} style={{ marginBottom: 6 }}>
      {emp.name}

      <select
        value={emp.siteId || ""}
        onChange={(e) => {
          const siteId = Number(e.target.value) || null;

          setEmployees(
            employees.map((eItem) =>
              eItem.id === emp.id
                ? { ...eItem, siteId }
                : eItem
            )
          );
        }}
        style={{ marginLeft: 10 }}
      >
        <option value="">No Site</option>

        {sites.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  ))}

  <form
    onSubmit={(e) => {
      e.preventDefault();
      if (!newEmployee) return;

      setEmployees([
        ...employees,
        {
          id: Date.now(),
          name: newEmployee,
          siteId: null
        }
      ]);

      setNewEmployee("");
      employeeRef.current.focus();
    }}
  >
    <input
      ref={employeeRef}
      value={newEmployee}
      onChange={(e) => setNewEmployee(e.target.value)}
      placeholder="Add employee"
    />
    <button>Add</button>
  </form>
</div>

        {/* ASSETS */}
<div style={card}>
  <h3>Assets</h3>

  {assets.map((asset) => (
    <div key={asset.id} style={{ marginBottom: 6 }}>
      {asset.name}

      <select
        value={asset.assignedTo || ""}
        onChange={(e) => {
          const assignedTo = Number(e.target.value) || null;

          setAssets(
            assets.map((a) =>
              a.id === asset.id
                ? { ...a, assignedTo }
                : a
            )
          );
        }}
        style={{ marginLeft: 10 }}
      >
        <option value="">Unassigned</option>

        {employees.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
    </div>
  ))}

  <form
    onSubmit={(e) => {
      e.preventDefault();
      if (!newAsset) return;

      setAssets([
        ...assets,
        {
          id: Date.now(),
          name: newAsset,
          assignedTo: null
        }
      ]);

      setNewAsset("");
      assetRef.current.focus();
    }}
  >
    <input
      ref={assetRef}
      value={newAsset}
      onChange={(e) => setNewAsset(e.target.value)}
      placeholder="Add asset"
    />
    <button>Add</button>
  </form>
</div>
        {/* JOB SITES */}
        <div style={card}>
          <h3>Job Sites</h3>

          <div style={{ fontSize: 12, color: "#666" }}>
            Example: Site A — Houston, TX<br />
            Example: Site B — Dallas, TX
          </div>

          {sites.map((s) => (
            <div key={s.id} style={{ marginTop: 6 }}>
              <span onClick={() => setActiveSiteId(s.id)} style={{ cursor: "pointer" }}>
                {s.name} — {s.location}
              </span>
              <button onClick={() => handleDeleteSite(s.id)}>Delete</button>
            </div>
          ))}

          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddSite();
          }}>
            <input
              ref={siteRef}
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              placeholder="Site name"
            />
            <input
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="City, State"
            />
            <button>Add</button>
          </form>
        </div>

        {/* SUMMARY */}
        <div style={card}>
          <h3>Summary</h3>
          <p>Employees: {employees.length}</p>
          <p>Assets: {assets.length}</p>
          <p>Sites: {sites.length}</p>
        </div>
      </div>

      {/* MAP */}
      <div style={{ height: 500, marginTop: 20 }}>
        <MapContainer center={[31, -96]} zoom={6} style={{ height: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <HomeButton />
          <MapController />

          {sites.map((s) => {
  const employeesAtSite = employees.filter(
    (e) => e.siteId === s.id
  );

  const assetsAtSite = assets.filter((a) =>
    employeesAtSite.some((e) => e.id === a.assignedTo)
  );

  return (
    <Marker key={s.id} position={[s.lat, s.lng]}>
      <Popup>
        <strong>{s.name}</strong>
        <br />
        {s.location}

        <hr />

        <strong>Employees:</strong>
        <ul>
          {employeesAtSite.length === 0 ? (
            <li>None</li>
          ) : (
            employeesAtSite.map((e) => (
              <li key={e.id}>{e.name}</li>
            ))
          )}
        </ul>

        <strong>Assets:</strong>
        <ul>
          {assetsAtSite.length === 0 ? (
            <li>None</li>
          ) : (
            assetsAtSite.map((a) => (
              <li key={a.id}>{a.name}</li>
            ))
          )}
        </ul>

        <button
          onClick={() => handleDeleteSite(s.id)}
          style={{
            marginTop: 8,
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: 4,
            padding: "4px 8px",
            cursor: "pointer"
          }}
        >
          Delete Site
        </button>
      </Popup>
    </Marker>
  );
})}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;