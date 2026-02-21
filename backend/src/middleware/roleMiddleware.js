// RBAC — Role-Based Access Control Config
// Defines which roles can access which routes/resources

const ROLES = {
    FLEET_MANAGER: "fleet_manager",
    DISPATCHER: "dispatcher",
    SAFETY_OFFICER: "safety_officer",
    FINANCIAL_ANALYST: "financial_analyst",
};

// Page-level access rules
const PAGE_ACCESS = {
    // Page 2: Command Center — all roles, but different data
    dashboard: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],

    // Page 3: Vehicle Registry
    vehicles: {
        view: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER],
        create: [ROLES.FLEET_MANAGER],
        update: [ROLES.FLEET_MANAGER],
        delete: [ROLES.FLEET_MANAGER],
    },

    // Page 4: Trip Dispatcher
    trips: {
        view: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
        create: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
        update: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER],
        delete: [ROLES.FLEET_MANAGER],
    },

    // Page 5: Maintenance & Service Logs
    maintenance: {
        view: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
        create: [ROLES.FLEET_MANAGER],
        update: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
        delete: [ROLES.FLEET_MANAGER],
    },

    // Page 6: Expense & Fuel Logging
    expenses: {
        view: [ROLES.FLEET_MANAGER, ROLES.FINANCIAL_ANALYST],
        create: [ROLES.FINANCIAL_ANALYST],
        update: [ROLES.FINANCIAL_ANALYST],
        delete: [ROLES.FLEET_MANAGER],
    },

    // Page 7: Driver Performance & Safety Profiles
    drivers: {
        view: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER],
        create: [ROLES.FLEET_MANAGER],
        update: [ROLES.FLEET_MANAGER, ROLES.SAFETY_OFFICER],
        delete: [ROLES.FLEET_MANAGER],
    },

    // Page 8: Analytics & Reports
    analytics: {
        view: [ROLES.FLEET_MANAGER, ROLES.DISPATCHER, ROLES.SAFETY_OFFICER, ROLES.FINANCIAL_ANALYST],
    },
};

// Middleware: check if user's role can access a resource with a given action
const checkAccess = (resource, action = "view") => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const access = PAGE_ACCESS[resource];
        if (!access) {
            return res.status(500).json({ error: "Unknown resource" });
        }

        // If access is an array (like dashboard), just check membership
        const allowedRoles = Array.isArray(access) ? access : access[action];

        if (!allowedRoles || !allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: "Access denied",
                message: `Role '${userRole}' cannot ${action} ${resource}`,
            });
        }

        next();
    };
};

module.exports = { ROLES, PAGE_ACCESS, checkAccess };
