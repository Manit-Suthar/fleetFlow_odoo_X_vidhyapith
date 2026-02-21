import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/v1`;
const REOPEN_MINUTES = 20;

const initialForm = {
  vehicle_id: "",
  driver_id: "",
  cargo_weight: "",
  origin: "",
  destination: "",
  distance_km: "",
  fuel_used: "",
  notes: "",
};

const statusBadgeClass = (status) => {
  if (status === "scheduled") return "badge badge-primary";
  if (status === "in-progress") return "badge badge-info";
  if (status === "completed") return "badge badge-success";
  if (status === "cancelled") return "badge badge-danger";
  return "badge";
};

const statusLabelMap = {
  scheduled: "Dispatched",
  "in-progress": "On way",
  completed: "Completed",
  cancelled: "Cancelled",
};

function TripDispatcher() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [actionLoadingTripId, setActionLoadingTripId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get(`${API_BASE}/trips`);
      setTrips(data.trips || []);
      setVehicles(data.availableVehicles || []);
      setDrivers(data.eligibleDrivers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load trips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTrips = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...trips];

    if (statusFilter) {
      rows = rows.filter((trip) => trip.status === statusFilter);
    }

    if (q) {
      rows = rows.filter((trip) => {
        const bag = [
          trip.id,
          trip.origin,
          trip.destination,
          trip.status,
          trip.vehicle?.type,
          trip.vehicle?.model,
          trip.vehicle?.license_plate,
          trip.driver?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return bag.includes(q);
      });
    }

    rows.sort((a, b) => {
      if (sortBy === "oldest") return a.id - b.id;
      if (sortBy === "status") return String(a.status).localeCompare(String(b.status));
      if (sortBy === "origin") return String(a.origin).localeCompare(String(b.origin));
      if (sortBy === "destination") return String(a.destination).localeCompare(String(b.destination));
      return b.id - a.id;
    });
    return rows;
  }, [trips, search, statusFilter, sortBy]);

  const canUndo = (trip) => {
    if (!trip || !["completed", "cancelled"].includes(trip.status)) return false;
    const base = trip.end_date || trip.updated_at || trip.created_at;
    if (!base) return false;
    const mins = (Date.now() - new Date(base).getTime()) / 60000;
    return mins <= REOPEN_MINUTES;
  };

  const submitTrip = async (e) => {
    e.preventDefault();
    try {
      setModalError("");
      const payload = {
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_weight: Number(form.cargo_weight),
        origin: form.origin?.trim(),
        destination: form.destination?.trim(),
        distance_km: form.distance_km ? Number(form.distance_km) : null,
        fuel_used: form.fuel_used ? Number(form.fuel_used) : null,
        notes: form.notes || null,
      };

      if (!payload.vehicle_id || !payload.driver_id || !payload.origin || !payload.destination) {
        setModalError("Vehicle, driver, origin and destination are required");
        return;
      }
      if (!Number.isFinite(payload.cargo_weight) || payload.cargo_weight <= 0) {
        setModalError("Cargo weight must be a positive number in Kg");
        return;
      }

      await axios.post(`${API_BASE}/trips`, payload);
      setShowModal(false);
      setModalError("");
      setForm(initialForm);
      await loadData();
    } catch (err) {
      setModalError(err.response?.data?.message || "Failed to dispatch trip");
    }
  };

  const transitionTrip = async (trip, action) => {
    try {
      setError("");
      setActionLoadingTripId(trip.id);

      if (action === "complete" && !window.confirm("Mark this trip as completed?")) return;
      if (action === "cancel" && !window.confirm("Cancel this trip?")) return;

      await axios.post(`${API_BASE}/trips/${trip.id}/transition`, { action });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update trip status");
    } finally {
      setActionLoadingTripId(null);
    }
  };

  const undoTrip = async (trip) => {
    try {
      setError("");
      setActionLoadingTripId(trip.id);
      const targetStatus = trip.status === "completed" ? "in-progress" : "scheduled";
      await axios.post(`${API_BASE}/trips/${trip.id}/transition`, { status: targetStatus });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to undo trip action");
    } finally {
      setActionLoadingTripId(null);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div className="panel-heading">
          <h2>Trip Dispatcher & Management</h2>
          <p className="panel-subtitle">Dispatch, track, and complete jobs from one control desk</p>
        </div>
        <button
          className="primary-btn"
          onClick={() => {
            setModalError("");
            setShowModal(true);
          }}
        >
          New Trip
        </button>
      </div>

      <div className="dispatcher-controls">
        <input
          className="dispatcher-search"
          placeholder="Search by route, vehicle, driver, or trip ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="latest">Sort: Latest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="status">Sort: Status</option>
          <option value="origin">Sort: Origin</option>
          <option value="destination">Sort: Destination</option>
        </select>
      </div>

      {error ? <p className="error">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Status</th>
              <th>Lifecycle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>Loading trips...</td>
              </tr>
            ) : filteredTrips.length === 0 ? (
              <tr>
                <td colSpan={7}>No trips found</td>
              </tr>
            ) : (
              filteredTrips.map((trip) => (
                <tr key={trip.id}>
                  <td>{trip.id}</td>
                  <td>{trip.vehicle?.license_plate || trip.vehicle?.type || "-"}</td>
                  <td>{trip.driver?.name || "-"}</td>
                  <td>{trip.origin}</td>
                  <td>{trip.destination}</td>
                  <td>
                    <span className={statusBadgeClass(trip.status)}>{statusLabelMap[trip.status] || trip.status}</span>
                  </td>
                  <td className="lifecycle-cell">
                    <button
                      className="ghost-btn compact"
                      disabled={trip.status !== "scheduled" || actionLoadingTripId === trip.id}
                      onClick={() => transitionTrip(trip, "start")}
                    >
                      Start
                    </button>
                    <button
                      className="ghost-btn compact"
                      disabled={trip.status !== "in-progress" || actionLoadingTripId === trip.id}
                      onClick={() => transitionTrip(trip, "complete")}
                    >
                      Complete
                    </button>
                    <button
                      className="ghost-btn compact danger"
                      disabled={!["scheduled", "in-progress"].includes(trip.status) || actionLoadingTripId === trip.id}
                      onClick={() => transitionTrip(trip, "cancel")}
                    >
                      Cancel
                    </button>
                    {canUndo(trip) ? (
                      <button
                        className="ghost-btn compact"
                        disabled={actionLoadingTripId === trip.id}
                        onClick={() => undoTrip(trip)}
                        title={`Reopen within ${REOPEN_MINUTES} minutes`}
                      >
                        Undo
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal ? (
        <div
          className="modal-backdrop"
          onClick={() => {
            setModalError("");
            setShowModal(false);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>New Trip Form</h3>
            {modalError ? <p className="error">{modalError}</p> : null}
            <form onSubmit={submitTrip} className="form-grid">
              <label>
                Select Vehicle *
                <select
                  required
                  value={form.vehicle_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, vehicle_id: e.target.value }))}
                >
                  <option value="">Choose vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Cargo Weight (Kg) *
                <input
                  type="number"
                  min="1"
                  required
                  value={form.cargo_weight}
                  onChange={(e) => setForm((prev) => ({ ...prev, cargo_weight: e.target.value }))}
                />
              </label>

              <label>
                Select Driver *
                <select
                  required
                  value={form.driver_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, driver_id: e.target.value }))}
                >
                  <option value="">Choose driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Origin Address *
                <input required value={form.origin} onChange={(e) => setForm((prev) => ({ ...prev, origin: e.target.value }))} />
              </label>

              <label>
                Destination *
                <input
                  required
                  value={form.destination}
                  onChange={(e) => setForm((prev) => ({ ...prev, destination: e.target.value }))}
                />
              </label>

              <label>
                Distance (Km)
                <input
                  type="number"
                  min="0"
                  value={form.distance_km}
                  onChange={(e) => setForm((prev) => ({ ...prev, distance_km: e.target.value }))}
                />
              </label>

              <label>
                Estimated Fuel Cost
                <input
                  type="number"
                  min="0"
                  value={form.fuel_used}
                  onChange={(e) => setForm((prev) => ({ ...prev, fuel_used: e.target.value }))}
                />
              </label>

              <label>
                Notes
                <input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </label>

              <div className="modal-actions">
                <button type="submit" className="primary-btn">
                  Confirm & Dispatch Trip
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setModalError("");
                    setShowModal(false);
                  }}
                >
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

export default TripDispatcher;
