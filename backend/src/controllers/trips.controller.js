const pool = require("../config/db");

const VEHICLE_AVAILABLE = new Set(["available", "idle"]);
const DRIVER_AVAILABLE = new Set(["available", "idle", "off-duty"]);
const TERMINAL_STATUS = new Set(["completed", "cancelled"]);
const CAPACITY_TAG_REGEX = /\[CAP:(\d+(?:\.\d+)?)KG\]/i;
const REVERSIBLE_WINDOW_MINUTES = 20;

const STATUS_ACTION_MAP = {
  dispatch: "scheduled",
  start: "in-progress",
  complete: "completed",
  cancel: "cancelled",
};

let cachedTripHistoryColumns = null;

const isValidDate = (value) => value && !Number.isNaN(new Date(value).valueOf());

const parseTripStatus = (action, explicitStatus) => {
  if (explicitStatus) return String(explicitStatus).toLowerCase();
  if (action && STATUS_ACTION_MAP[action]) return STATUS_ACTION_MAP[action];
  return null;
};

const parseCapacity = (vehicle) => {
  const raw =
    vehicle.capacity_kg ??
    vehicle.capacity ??
    vehicle.max_payload ??
    vehicle.payload_capacity ??
    vehicle.max_load_kg;
  if (raw === null || raw === undefined) {
    const fromName = String(vehicle.vehicle_name || "").match(CAPACITY_TAG_REGEX)?.[1];
    const fromModel = String(vehicle.model || "").match(CAPACITY_TAG_REGEX)?.[1];
    const parsedTagged = Number(fromName || fromModel);
    if (Number.isFinite(parsedTagged)) return parsedTagged;
  }
  if (raw === null || raw === undefined) return Number.POSITIVE_INFINITY;
  const n = Number(raw);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
};

const eligibleByLicense = (driver, vehicle) => {
  const driverLicenseType = driver.license_type || driver.license_class || driver.permit_type;
  const vehicleType = vehicle.vehicle_type || vehicle.type;
  if (!driverLicenseType || !vehicleType) return true;
  return String(driverLicenseType).toLowerCase().includes(String(vehicleType).toLowerCase());
};

const formatTrip = (trip, vehicle, driver) => ({
  id: trip.id,
  vehicle_id: trip.vehicle_id,
  driver_id: trip.driver_id,
  origin: trip.origin,
  destination: trip.destination,
  start_date: trip.start_date,
  end_date: trip.end_date,
  distance_km: trip.distance_km,
  fuel_used: trip.fuel_used,
  status: trip.status,
  notes: trip.notes,
  cargo_weight: trip.cargo_weight ?? null,
  created_at: trip.created_at,
  updated_at: trip.updated_at,
  vehicle: vehicle
    ? {
        id: vehicle.id,
        license_plate: vehicle.license_plate,
        model: vehicle.model || vehicle.vehicle_name || null,
        type: vehicle.vehicle_type || vehicle.type || null,
      }
    : null,
  driver: driver
    ? {
        id: driver.id,
        name: driver.name || null,
        license_number: driver.license_number || null,
      }
    : null,
});

const getTripHistoryColumns = async (client) => {
  if (cachedTripHistoryColumns) return cachedTripHistoryColumns;
  const result = await client.query(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'trip_history'
    `
  );
  cachedTripHistoryColumns = new Set(result.rows.map((row) => row.column_name));
  return cachedTripHistoryColumns;
};

const insertTripHistory = async (client, { tripId, previousStatus, newStatus, note }) => {
  const columns = await getTripHistoryColumns(client);
  if (!columns.has("trip_id")) return;

  const payload = [];
  const values = [];
  let idx = 1;
  const push = (column, value) => {
    if (!columns.has(column)) return;
    payload.push(column);
    values.push(value);
    idx += 1;
  };

  push("trip_id", tripId);
  push("previous_status", previousStatus ?? null);
  push("old_status", previousStatus ?? null);
  push("new_status", newStatus);
  push("status", newStatus);
  push("action", newStatus);
  push("note", note ?? null);
  push("remarks", note ?? null);

  let changedAtExpression = null;
  if (columns.has("changed_at")) {
    payload.push("changed_at");
    changedAtExpression = "CURRENT_TIMESTAMP";
  } else if (columns.has("created_at")) {
    payload.push("created_at");
    changedAtExpression = "CURRENT_TIMESTAMP";
  }

  if (!payload.length) return;

  const placeholders = [];
  let valueIndex = 1;
  payload.forEach((column) => {
    if (column === "changed_at" || column === "created_at") {
      placeholders.push(changedAtExpression);
    } else {
      placeholders.push(`$${valueIndex}`);
      valueIndex += 1;
    }
  });

  await client.query(`INSERT INTO trip_history (${payload.join(", ")}) VALUES (${placeholders.join(", ")})`, values);
};

exports.getTrips = async (_req, res) => {
  try {
    const [tripsResult, vehiclesResult, driversResult] = await Promise.all([
      pool.query(`SELECT to_jsonb(t) AS trip FROM trips t ORDER BY t.created_at DESC`),
      pool.query(`SELECT to_jsonb(v) AS vehicle FROM vehicles v`),
      pool.query(`SELECT to_jsonb(d) AS driver FROM drivers d`),
    ]);

    const vehicles = new Map(vehiclesResult.rows.map((row) => [row.vehicle.id, row.vehicle]));
    const drivers = new Map(driversResult.rows.map((row) => [row.driver.id, row.driver]));

    const trips = tripsResult.rows.map((row) => {
      const trip = row.trip;
      return formatTrip(trip, vehicles.get(trip.vehicle_id), drivers.get(trip.driver_id));
    });

    const availableVehicles = vehiclesResult.rows
      .map((row) => row.vehicle)
      .filter((v) => VEHICLE_AVAILABLE.has(String(v.status || "").toLowerCase()))
      .map((v) => ({
        id: v.id,
        label: `${v.license_plate} - ${v.model || v.vehicle_name || "Vehicle"}`,
        type: v.vehicle_type || null,
      }));

    const eligibleDrivers = driversResult.rows
      .map((row) => row.driver)
      .filter((d) => DRIVER_AVAILABLE.has(String(d.status || "").toLowerCase()))
      .filter((d) => !d.license_expiry || new Date(d.license_expiry) >= new Date())
      .map((d) => ({
        id: d.id,
        label: `${d.name}${d.license_number ? ` (${d.license_number})` : ""}`,
      }));

    return res.json({ trips, availableVehicles, eligibleDrivers });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch trips", error: error.message });
  }
};

exports.createTrip = async (req, res) => {
  const client = await pool.connect();
  try {
    const { vehicle_id, driver_id, origin, destination, cargo_weight, start_date, end_date, notes, distance_km, fuel_used } =
      req.body;

    if (!vehicle_id || !driver_id || !origin || !destination) {
      return res.status(400).json({ message: "vehicle_id, driver_id, origin and destination are required" });
    }

    const cargo = Number(cargo_weight);
    if (!Number.isFinite(cargo) || cargo <= 0) {
      return res.status(400).json({ message: "Cargo weight must be a positive number in Kg" });
    }

    await client.query("BEGIN");

    const vehicleResult = await client.query(`SELECT to_jsonb(v) AS vehicle FROM vehicles v WHERE id = $1 FOR UPDATE`, [
      vehicle_id,
    ]);
    if (!vehicleResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Vehicle not found" });
    }
    const vehicle = vehicleResult.rows[0].vehicle;

    if (!VEHICLE_AVAILABLE.has(String(vehicle.status || "").toLowerCase())) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Vehicle already assigned" });
    }

    const driverResult = await client.query(`SELECT to_jsonb(d) AS driver FROM drivers d WHERE id = $1 FOR UPDATE`, [
      driver_id,
    ]);
    if (!driverResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Driver not found" });
    }
    const driver = driverResult.rows[0].driver;

    const expired = isValidDate(driver.license_expiry) && new Date(driver.license_expiry) < new Date();
    const eligible =
      DRIVER_AVAILABLE.has(String(driver.status || "").toLowerCase()) &&
      !expired &&
      eligibleByLicense(driver, vehicle);
    if (!eligible) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Driver not eligible" });
    }

    const capacity = parseCapacity(vehicle);
    if (Number.isFinite(cargo) && cargo > capacity) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Cargo exceeds vehicle capacity" });
    }

    const tripInsert = await client.query(
      `
      INSERT INTO trips (
        vehicle_id,
        driver_id,
        origin,
        destination,
        start_date,
        end_date,
        distance_km,
        fuel_used,
        status,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', $9)
      RETURNING *
      `,
      [
        vehicle_id,
        driver_id,
        origin,
        destination,
        start_date ?? null,
        end_date ?? null,
        distance_km ?? null,
        fuel_used ?? null,
        notes ?? null,
      ]
    );

    await client.query(`UPDATE vehicles SET status = 'in-trip', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [vehicle_id]);
    await client.query(`UPDATE drivers SET status = 'on-trip', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [driver_id]);

    await insertTripHistory(client, {
      tripId: tripInsert.rows[0].id,
      previousStatus: null,
      newStatus: "scheduled",
      note: "Trip dispatched",
    });

    await client.query("COMMIT");
    return res.status(201).json(tripInsert.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to create trip", error: error.message });
  } finally {
    client.release();
  }
};

exports.transitionTrip = async (req, res) => {
  const client = await pool.connect();
  try {
    const targetStatus = parseTripStatus(req.body.action, req.body.status);
    if (!targetStatus) {
      return res.status(400).json({ message: "action or status is required" });
    }

    await client.query("BEGIN");
    const tripResult = await client.query(`SELECT * FROM trips WHERE id = $1 FOR UPDATE`, [req.params.id]);
    if (!tripResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Trip not found" });
    }

    const trip = tripResult.rows[0];
    const fromStatus = String(trip.status || "").toLowerCase();
    const allowed = {
      scheduled: ["in-progress", "cancelled", "scheduled"],
      "in-progress": ["completed", "cancelled", "in-progress"],
      completed: ["in-progress"],
      cancelled: ["scheduled"],
    };

    if (!allowed[fromStatus]?.includes(targetStatus)) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: `Invalid transition: ${fromStatus} -> ${targetStatus}` });
    }

    const isReopen = (fromStatus === "completed" && targetStatus === "in-progress") || (fromStatus === "cancelled" && targetStatus === "scheduled");
    if (isReopen) {
      const baseTime = trip.end_date || trip.updated_at || trip.created_at;
      const minutesSinceTerminal = (Date.now() - new Date(baseTime).getTime()) / 60000;
      if (minutesSinceTerminal > REVERSIBLE_WINDOW_MINUTES) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: `Reopen window expired (${REVERSIBLE_WINDOW_MINUTES} minutes)` });
      }

      const assignmentCheck = await client.query(
        `
        SELECT id
        FROM trips
        WHERE id <> $1
          AND status IN ('scheduled', 'in-progress')
          AND (vehicle_id = $2 OR driver_id = $3)
        LIMIT 1
        `,
        [trip.id, trip.vehicle_id, trip.driver_id]
      );
      if (assignmentCheck.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "Cannot reopen: driver or vehicle already assigned to another active trip" });
      }

      const vehicleState = await client.query(`SELECT status FROM vehicles WHERE id = $1 FOR UPDATE`, [trip.vehicle_id]);
      const driverState = await client.query(`SELECT status FROM drivers WHERE id = $1 FOR UPDATE`, [trip.driver_id]);
      const vehicleStatus = String(vehicleState.rows[0]?.status || "").toLowerCase();
      const driverStatus = String(driverState.rows[0]?.status || "").toLowerCase();
      if (!["available", "idle"].includes(vehicleStatus) || !["available", "idle", "off-duty"].includes(driverStatus)) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "Cannot reopen: vehicle or driver is currently unavailable" });
      }
    }

    const shouldStartNow = targetStatus === "in-progress";
    const shouldEndNow = targetStatus === "completed" || targetStatus === "cancelled";
    const shouldClearEndDate = isReopen && targetStatus === "in-progress";

    const updatedTrip = await client.query(
      `
      UPDATE trips
      SET
        status = $2,
        start_date = CASE WHEN $3 AND start_date IS NULL THEN CURRENT_TIMESTAMP ELSE start_date END,
        end_date = CASE WHEN $4 THEN CURRENT_TIMESTAMP WHEN $5 THEN NULL ELSE end_date END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [trip.id, targetStatus, shouldStartNow, shouldEndNow, shouldClearEndDate]
    );

    if (targetStatus === "in-progress") {
      await client.query(`UPDATE vehicles SET status = 'in-trip', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [
        trip.vehicle_id,
      ]);
      await client.query(`UPDATE drivers SET status = 'on-trip', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [
        trip.driver_id,
      ]);
    } else if (TERMINAL_STATUS.has(targetStatus)) {
      await client.query(`UPDATE vehicles SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [
        trip.vehicle_id,
      ]);
      await client.query(`UPDATE drivers SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [
        trip.driver_id,
      ]);
    }

    await insertTripHistory(client, {
      tripId: trip.id,
      previousStatus: fromStatus,
      newStatus: targetStatus,
      note: `Trip moved to ${targetStatus}`,
    });

    await client.query("COMMIT");
    return res.json(updatedTrip.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ message: "Failed to transition trip", error: error.message });
  } finally {
    client.release();
  }
};
