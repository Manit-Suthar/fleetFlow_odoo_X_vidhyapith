const pool = require("../config/db");

const VEHICLE_STATUS_MAP = {
  idle: "available",
  assigned: "in-trip",
  on_trip: "in-trip",
  in_progress: "in-trip",
};

const FIELD_ALIASES = {
  license_plate: ["license_plate", "plate_number", "registration_number", "vehicle_number"],
  model: ["model", "vehicle_name", "name"],
  type: ["vehicle_type", "type", "fleet_type"],
  capacity_kg: ["capacity_kg", "capacity", "max_payload", "payload_capacity", "max_load_kg"],
  odometer: ["odometer", "initial_odometer", "mileage"],
  status: ["status"],
};

let cachedVehicleMetadata = null;
const CAPACITY_TAG_REGEX = /\s*\[CAP:(\d+(?:\.\d+)?)KG\]\s*$/i;

const normalizeStatus = (status) => {
  if (!status) return undefined;
  const value = String(status).trim().toLowerCase();
  return VEHICLE_STATUS_MAP[value] || value;
};

const valueFromBody = (body, logicalField) => {
  const aliases = FIELD_ALIASES[logicalField] || [];
  for (const key of aliases) {
    if (body[key] !== undefined && body[key] !== null && body[key] !== "") return body[key];
  }
  return undefined;
};

const stripCapacityTag = (text) => String(text || "").replace(CAPACITY_TAG_REGEX, "").trim();

const extractCapacityFromText = (text) => {
  const match = String(text || "").match(CAPACITY_TAG_REGEX);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const withCapacityTag = (name, capacity) => `${stripCapacityTag(name)} [CAP:${Number(capacity)}KG]`;

const normalizeVehicle = (raw) => ({
  id: raw.id,
  license_plate: raw.license_plate || raw.plate_number || raw.registration_number || raw.vehicle_number || null,
  model: raw.model || raw.vehicle_name || raw.name || null,
  type: raw.vehicle_type || raw.type || raw.fleet_type || null,
  capacity_kg:
    raw.capacity_kg ??
    raw.capacity ??
    raw.max_payload ??
    raw.payload_capacity ??
    raw.max_load_kg ??
    extractCapacityFromText(raw.vehicle_name) ??
    extractCapacityFromText(raw.model) ??
    null,
  odometer: raw.odometer ?? raw.initial_odometer ?? raw.mileage ?? 0,
  status: raw.status,
  year: raw.year ?? null,
  fuel_type: raw.fuel_type ?? null,
  created_at: raw.created_at,
  updated_at: raw.updated_at,
});

const getVehicleMetadata = async (client = pool) => {
  if (cachedVehicleMetadata) return cachedVehicleMetadata;
  const result = await client.query(
    `
    SELECT
      column_name,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'vehicles'
    `
  );

  const byName = new Map();
  result.rows.forEach((row) => byName.set(row.column_name, row));
  cachedVehicleMetadata = { rows: result.rows, byName };
  return cachedVehicleMetadata;
};

const findExistingColumn = (metadata, logicalField) => {
  const aliases = FIELD_ALIASES[logicalField] || [];
  return aliases.find((name) => metadata.byName.has(name)) || null;
};

const fetchVehicleById = async (id) => {
  const result = await pool.query(`SELECT to_jsonb(v) AS vehicle FROM vehicles v WHERE id = $1`, [id]);
  return result.rows[0]?.vehicle || null;
};

const toInsertMap = (body, metadata) => {
  const map = new Map();

  const license = valueFromBody(body, "license_plate");
  const model = valueFromBody(body, "model");
  const type = valueFromBody(body, "type");
  const capacity = valueFromBody(body, "capacity_kg");
  const odometer = valueFromBody(body, "odometer");
  const status = normalizeStatus(valueFromBody(body, "status")) || "available";

  if (!license) return { error: "License plate is required" };
  if (!model) return { error: "Model is required" };
  if (!type) return { error: "Type is required" };
  if (capacity === undefined) return { error: "Capacity in Kg is required" };
  if (odometer === undefined) return { error: "Initial odometer is required" };

  const nCapacity = Number(capacity);
  if (!Number.isFinite(nCapacity) || nCapacity <= 0) return { error: "Capacity must be a positive number in Kg" };

  const nOdometer = Number(odometer);
  if (!Number.isFinite(nOdometer) || nOdometer < 0) return { error: "Initial odometer must be a non-negative number" };

  const setField = (logicalField, value) => {
    const col = findExistingColumn(metadata, logicalField);
    if (col) map.set(col, value);
  };

  setField("license_plate", license);
  setField("model", model);
  setField("type", type);
  setField("capacity_kg", nCapacity);
  setField("odometer", nOdometer);
  setField("status", status);

  // Keep model and vehicle_name in sync when both exist.
  if (metadata.byName.has("model")) map.set("model", stripCapacityTag(model));
  if (metadata.byName.has("vehicle_name")) map.set("vehicle_name", withCapacityTag(model, nCapacity));

  // Accept extra known columns from request if they exist in DB.
  const protectedKeys = new Set([
    ...FIELD_ALIASES.license_plate,
    ...FIELD_ALIASES.model,
    ...FIELD_ALIASES.type,
    ...FIELD_ALIASES.capacity_kg,
    ...FIELD_ALIASES.odometer,
    ...FIELD_ALIASES.status,
    "id",
    "created_at",
    "updated_at",
  ]);

  Object.entries(body).forEach(([key, value]) => {
    if (protectedKeys.has(key)) return;
    if (!metadata.byName.has(key)) return;
    if (value === undefined || value === null || value === "") return;
    map.set(key, value);
  });

  // Validate any remaining required DB columns.
  const missingRequired = metadata.rows
    .filter(
      (row) =>
        row.column_name !== "id" &&
        row.is_nullable === "NO" &&
        !row.column_default &&
        !map.has(row.column_name)
    )
    .map((row) => row.column_name);

  if (missingRequired.length) {
    return { error: `Missing required fields for vehicles table: ${missingRequired.join(", ")}` };
  }

  return { map };
};

exports.getVehicles = async (req, res) => {
  try {
    const metadata = await getVehicleMetadata();
    const statusColumn = findExistingColumn(metadata, "status");
    const typeColumn = findExistingColumn(metadata, "type");

    const where = [];
    const values = [];
    let idx = 1;

    if (req.query.status && statusColumn) {
      where.push(`LOWER(v.${statusColumn}) = LOWER($${idx})`);
      values.push(normalizeStatus(req.query.status));
      idx += 1;
    }

    const typeValue = typeof req.query.type === "string" ? req.query.type.trim() : "";
    if (typeValue && typeColumn) {
      where.push(`LOWER(TRIM(COALESCE(v.${typeColumn}::text, ''))) = LOWER(TRIM($${idx}))`);
      values.push(typeValue);
      idx += 1;
    }

    const result = await pool.query(
      `
      SELECT to_jsonb(v) AS vehicle
      FROM vehicles v
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY v.created_at DESC NULLS LAST, v.id DESC
      `,
      values
    );

    res.json(result.rows.map((row) => normalizeVehicle(row.vehicle)));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch vehicles", error: error.message });
  }
};

exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await fetchVehicleById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    return res.json(normalizeVehicle(vehicle));
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch vehicle", error: error.message });
  }
};

exports.createVehicle = async (req, res) => {
  const client = await pool.connect();
  try {
    const metadata = await getVehicleMetadata(client);
    const payload = toInsertMap(req.body, metadata);
    if (payload.error) return res.status(400).json({ message: payload.error });

    const columns = Array.from(payload.map.keys());
    const values = Array.from(payload.map.values());
    const placeholders = values.map((_, idx) => `$${idx + 1}`);

    const result = await client.query(
      `INSERT INTO vehicles (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING id`,
      values
    );

    const vehicle = await fetchVehicleById(result.rows[0].id);
    return res.status(201).json(normalizeVehicle(vehicle));
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "License plate already exists" });
    }
    return res.status(500).json({ message: "Failed to create vehicle", error: error.message });
  } finally {
    client.release();
  }
};

exports.updateVehicle = async (req, res) => {
  const client = await pool.connect();
  try {
    const metadata = await getVehicleMetadata(client);
    const updates = [];
    const values = [req.params.id];

    const setUpdate = (column, val) => {
      if (!column || val === undefined) return;
      updates.push(`${column} = $${values.length + 1}`);
      values.push(val);
    };

    const model = valueFromBody(req.body, "model");
    const capacity = valueFromBody(req.body, "capacity_kg");
    const odometer = valueFromBody(req.body, "odometer");

    if (capacity !== undefined) {
      const n = Number(capacity);
      if (!Number.isFinite(n) || n <= 0) {
        return res.status(400).json({ message: "Capacity must be a positive number in Kg" });
      }
      setUpdate(findExistingColumn(metadata, "capacity_kg"), n);
    }

    if (odometer !== undefined) {
      const n = Number(odometer);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ message: "Odometer must be a non-negative number" });
      }
      setUpdate(findExistingColumn(metadata, "odometer"), n);
    }

    setUpdate(findExistingColumn(metadata, "license_plate"), valueFromBody(req.body, "license_plate"));
    setUpdate(findExistingColumn(metadata, "type"), valueFromBody(req.body, "type"));
    setUpdate(findExistingColumn(metadata, "status"), normalizeStatus(valueFromBody(req.body, "status")));

    const current = await fetchVehicleById(req.params.id);
    if (!current) return res.status(404).json({ message: "Vehicle not found" });

    const currentCapacity = normalizeVehicle(current).capacity_kg;
    const nextCapacity = capacity !== undefined ? Number(capacity) : currentCapacity;
    const currentDisplayModel = current.model || stripCapacityTag(current.vehicle_name);
    const nextModel = model !== undefined ? stripCapacityTag(model) : currentDisplayModel;

    if (model !== undefined && metadata.byName.has("model")) setUpdate("model", nextModel);
    if (metadata.byName.has("vehicle_name") && nextModel && Number.isFinite(Number(nextCapacity))) {
      setUpdate("vehicle_name", withCapacityTag(nextModel, nextCapacity));
    }

    const protectedKeys = new Set([
      ...FIELD_ALIASES.license_plate,
      ...FIELD_ALIASES.model,
      ...FIELD_ALIASES.type,
      ...FIELD_ALIASES.capacity_kg,
      ...FIELD_ALIASES.odometer,
      ...FIELD_ALIASES.status,
      "id",
      "created_at",
      "updated_at",
    ]);

    Object.entries(req.body).forEach(([key, val]) => {
      if (protectedKeys.has(key)) return;
      if (!metadata.byName.has(key)) return;
      if (val === undefined || val === null || val === "") return;
      updates.push(`${key} = $${values.length + 1}`);
      values.push(val);
    });

    if (!updates.length) return res.status(400).json({ message: "No updatable fields provided" });
    if (metadata.byName.has("updated_at")) updates.push("updated_at = CURRENT_TIMESTAMP");

    const result = await client.query(
      `UPDATE vehicles SET ${updates.join(", ")} WHERE id = $1 RETURNING id`,
      values
    );

    if (!result.rows.length) return res.status(404).json({ message: "Vehicle not found" });
    const vehicle = await fetchVehicleById(req.params.id);
    return res.json(normalizeVehicle(vehicle));
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "License plate already exists" });
    }
    return res.status(500).json({ message: "Failed to update vehicle", error: error.message });
  } finally {
    client.release();
  }
};

exports.updateVehicleStatus = async (req, res) => {
  try {
    const metadata = await getVehicleMetadata();
    const statusColumn = findExistingColumn(metadata, "status");
    if (!statusColumn) {
      return res.status(500).json({ message: "Status column is missing in database schema" });
    }

    const status = normalizeStatus(req.body.status);
    if (!status) return res.status(400).json({ message: "status is required" });

    const result = await pool.query(`UPDATE vehicles SET ${statusColumn} = $2 WHERE id = $1 RETURNING id`, [
      req.params.id,
      status,
    ]);
    if (!result.rows.length) return res.status(404).json({ message: "Vehicle not found" });

    const vehicle = await fetchVehicleById(req.params.id);
    return res.json(normalizeVehicle(vehicle));
  } catch (error) {
    return res.status(500).json({ message: "Failed to update vehicle status", error: error.message });
  }
};
