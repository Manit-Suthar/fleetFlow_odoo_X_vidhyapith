import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import VehicleRegistry from "./pages/fleet/VehicleRegistry";
import TripDispatcher from "./pages/fleet/TripDispatcher";
import "./App.css";

function FleetLayout() {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <h1>FleetFlow</h1>
        <nav>
          <NavLink to="/fleet/vehicles" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Vehicle Registry
          </NavLink>
          <NavLink to="/fleet/trips" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Trip Dispatcher
          </NavLink>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/fleet/vehicles" element={<VehicleRegistry />} />
          <Route path="/fleet/trips" element={<TripDispatcher />} />
          <Route path="*" element={<Navigate to="/fleet/vehicles" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <FleetLayout />
    </BrowserRouter>
  );
}

export default App;
