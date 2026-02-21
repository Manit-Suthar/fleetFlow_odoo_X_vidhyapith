import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./FleetPages.css";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/v1`;

const initialForm = {
  license_plate: "",
  model: "",
  type: "",
  capacity_kg: "",
  odometer: "",
  status: "available",
};

const statusClass = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "available" || value === "idle") return "badge success";
  if (value === "in-trip" || value === "assigned") return "badge warning";
  if (value === "maintenance") return "badge danger";
  return "badge";
};

function VehicleRegistry() {
  const [vehicles, setVehicles] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuState, setMenuState] = useState({ id: null, top: 0, left: 0 });
  const [form, setForm] = useState(initialForm);
  const triggerRefs = useRef({});
  const menuRef = useRef(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const { data } = await axios.get(`${API_BASE}/vehicles`, { params });
      setVehicles(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTypes = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/vehicles`);
      const types = [...new Set((data || []).map((v) => String(v.type || "").trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      );
      setAllTypes(types);
    } catch {
      // Keep current type options if this call fails.
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchAllTypes();
  }, []);

  const typeOptions = useMemo(() => allTypes, [allTypes]);

  const startAdd = () => {
    setEditing(null);
    setForm(initialForm);
    setError("");
    setShowModal(true);
  };

  const startEdit = (vehicle) => {
    setMenuState({ id: null, top: 0, left: 0 });
    setEditing(vehicle);
    setError("");
    setForm({
      license_plate: vehicle.license_plate || "",
      model: vehicle.model || "",
      type: vehicle.type || "",
      capacity_kg: vehicle.capacity_kg ?? vehicle.capacity ?? "",
      odometer: vehicle.odometer ?? "",
      status: vehicle.status || "available",
    });
    setShowModal(true);
  };

  const saveVehicle = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        license_plate: form.license_plate?.trim(),
        model: form.model?.trim(),
        type: form.type?.trim(),
        capacity_kg: form.capacity_kg ? Number(form.capacity_kg) : null,
        odometer: form.odometer ? Number(form.odometer) : 0,
        status: form.status,
      };

      if (!payload.license_plate || !payload.model || !payload.type) {
        setError("License plate, model and type are required");
        return;
      }
      if (!payload.capacity_kg || payload.capacity_kg <= 0) {
        setError("Capacity must be a positive number in Kg");
        return;
      }
      if (payload.odometer < 0) {
        setError("Odometer must be a non-negative number");
        return;
      }

      if (editing) {
        await axios.put(`${API_BASE}/vehicles/${editing.id}`, payload);
      } else {
        await axios.post(`${API_BASE}/vehicles`, payload);
      }

      setShowModal(false);
      setMenuState({ id: null, top: 0, left: 0 });
      await Promise.all([fetchVehicles(), fetchAllTypes()]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save vehicle");
    }
  };

  const setVehicleStatus = async (id, status) => {
    try {
      setError("");
      await axios.patch(`${API_BASE}/vehicles/${id}/status`, { status });
      setMenuState({ id: null, top: 0, left: 0 });
      await fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  const openMenuFor = (vehicleId) => {
    const trigger = triggerRefs.current[vehicleId];
    if (!trigger) return;
    if (menuState.id === vehicleId) {
      setMenuState({ id: null, top: 0, left: 0 });
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 190;
    const menuHeight = 180;
    const viewportPadding = 8;
    const canOpenUp = rect.top >= menuHeight + viewportPadding;
    const shouldOpenUp = window.innerHeight - rect.bottom < menuHeight && canOpenUp;
    const top = shouldOpenUp ? rect.top - menuHeight - 4 : rect.bottom + 4;
    const left = Math.min(
      Math.max(viewportPadding, rect.right - menuWidth),
      window.innerWidth - menuWidth - viewportPadding
    );

    setMenuState({ id: vehicleId, top, left });
  };

  useEffect(() => {
    if (!menuState.id) return undefined;

    const closeMenu = () => setMenuState({ id: null, top: 0, left: 0 });
    const onDocClick = (event) => {
      const target = event.target;
      if (menuRef.current?.contains(target)) return;
      const isTrigger = Object.values(triggerRefs.current).some((node) => node?.contains(target));
      if (isTrigger) return;
      closeMenu();
    };
    const onEsc = (event) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);

    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuState.id]);

  const activeVehicle = useMemo(() => vehicles.find((v) => v.id === menuState.id) || null, [vehicles, menuState.id]);

  return (
    <section className="fleet-page panel">
      <div className="panel-header">
        <div className="panel-heading">
          <h2>Vehicle Registry</h2>
          <p className="panel-subtitle">Manage your active fleet, status and payload readiness</p>
        </div>
        <button className="primary-btn" onClick={startAdd}>
          New Vehicle
        </button>
      </div>

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="in-trip">In Trip</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>License Plate</th>
              <th>Model</th>
              <th>Type</th>
              <th>Capacity (Kg)</th>
              <th>Odometer</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading vehicles...</td>
              </tr>
            ) : vehicles.length === 0 ? (
              <tr>
                <td colSpan={7}>No vehicles found</td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.license_plate}</td>
                  <td>{vehicle.model || "-"}</td>
                  <td>{vehicle.type || "-"}</td>
                  <td>{vehicle.capacity_kg ?? vehicle.capacity ?? "-"}</td>
                  <td>{vehicle.odometer ?? "-"}</td>
                  <td>
                    <span className={statusClass(vehicle.status)}>{vehicle.status}</span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="icon-btn cool-trigger"
                      ref={(el) => {
                        triggerRefs.current[vehicle.id] = el;
                      }}
                      onClick={() => openMenuFor(vehicle.id)}
                      title="Actions"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="5" r="1.8" />
                        <circle cx="12" cy="12" r="1.8" />
                        <circle cx="12" cy="19" r="1.8" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeVehicle ? (
        <div
          ref={menuRef}
          className="menu cool-menu floating-menu"
          style={{ top: `${menuState.top}px`, left: `${menuState.left}px` }}
        >
          <button onClick={() => startEdit(activeVehicle)}>
            <span className="menu-dot blue" /> Edit Vehicle
          </button>
          <button onClick={() => setVehicleStatus(activeVehicle.id, "in-trip")}>
            <span className="menu-dot amber" /> Mark In Trip
          </button>
          <button onClick={() => setVehicleStatus(activeVehicle.id, "available")}>
            <span className="menu-dot green" /> Mark Available
          </button>
          <button onClick={() => setVehicleStatus(activeVehicle.id, "maintenance")}>
            <span className="menu-dot red" /> Maintenance
          </button>
        </div>
      ) : null}

      {showModal ? (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? "Edit Vehicle" : "New Vehicle Registration"}</h3>
            <form onSubmit={saveVehicle} className="form-grid">
              <label>
                License Plate *
                <input
                  required
                  value={form.license_plate}
                  onChange={(e) => setForm((prev) => ({ ...prev, license_plate: e.target.value }))}
                />
              </label>
              <label>
                Model *
                <input required value={form.model} onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))} />
              </label>
              <label>
                Type *
                <input required value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))} />
              </label>
              <label>
                Capacity (Kg) *
                <input
                  type="number"
                  min="1"
                  required
                  value={form.capacity_kg}
                  onChange={(e) => setForm((prev) => ({ ...prev, capacity_kg: e.target.value }))}
                />
              </label>
              <label>
                Odometer *
                <input
                  type="number"
                  min="0"
                  required
                  value={form.odometer}
                  onChange={(e) => setForm((prev) => ({ ...prev, odometer: e.target.value }))}
                />
              </label>
              <label>
                Status
                <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                  <option value="available">Available</option>
                  <option value="in-trip">In Trip</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="submit" className="primary-btn">
                  Save
                </button>
                <button type="button" className="ghost-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default VehicleRegistry;
