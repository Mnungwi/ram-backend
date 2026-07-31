const { ProjectStorekeeper, User, Project } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/response");

const STOREKEEPER_INCLUDE = [
  {
    model: User,
    as: "user",
    attributes: ["id", "firstName", "lastName", "email", "phone", "jobTitle", "department", "avatar", "isActive"],
  },
  {
    model: User,
    as: "assignedBy",
    attributes: ["id", "firstName", "lastName"],
  },
];

const STOREKEEPER_INCLUDE_WITH_PROJECT = [
  ...STOREKEEPER_INCLUDE,
  {
    model: Project,
    as: "project",
    attributes: ["id", "projectCode", "name", "status"],
  },
];

// GET /api/projects/:projectId/storekeepers
exports.listProjectStorekeepers = async (req, res, next) => {
  try {
    const { search } = req.query;

    const assignments = await ProjectStorekeeper.findAll({
      where: { projectId: req.params.projectId, isActive: true },
      include: STOREKEEPER_INCLUDE,
      order: [[{ model: User, as: "user" }, "firstName", "ASC"]],
    });

    const filtered = search
      ? assignments.filter((a) => {
          const text = `${a.user?.firstName || ""} ${a.user?.lastName || ""} ${a.user?.email || ""}`.toLowerCase();
          return text.includes(search.toLowerCase());
        })
      : assignments;

    return successResponse(res, { storekeepers: filtered });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:projectId/storekeepers — assign a user as storekeeper
exports.assignStorekeeperToProject = async (req, res, next) => {
  try {
    const { userId, notes } = req.body;
    if (!userId) return errorResponse(res, "userId required", 400);

    const user = await User.findByPk(userId);
    if (!user) return errorResponse(res, "User not found", 404);

    const existing = await ProjectStorekeeper.findOne({
      where: { projectId: req.params.projectId, userId },
    });
    if (existing) {
      if (existing.isActive)
        return errorResponse(
          res,
          "User is already assigned as storekeeper on this project",
          400,
        );
      await existing.update({
        isActive: true,
        notes,
        assignedById: req.userId,
      });
      const full = await ProjectStorekeeper.findByPk(existing.id, {
        include: STOREKEEPER_INCLUDE,
      });
      return successResponse(
        res,
        { assignment: full },
        "Storekeeper re-activated for project",
      );
    }

    const assignment = await ProjectStorekeeper.create({
      projectId: req.params.projectId,
      userId,
      assignedById: req.userId,
      notes,
    });

    const full = await ProjectStorekeeper.findByPk(assignment.id, {
      include: STOREKEEPER_INCLUDE,
    });

    return successResponse(
      res,
      { assignment: full },
      "Storekeeper assigned to project",
      201,
    );
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:projectId/storekeepers/:assignmentId
exports.updateProjectStorekeeper = async (req, res, next) => {
  try {
    const assignment = await ProjectStorekeeper.findOne({
      where: { id: req.params.assignmentId, projectId: req.params.projectId },
    });
    if (!assignment) return errorResponse(res, "Assignment not found", 404);
    await assignment.update({ notes: req.body.notes });
    const full = await ProjectStorekeeper.findByPk(assignment.id, {
      include: STOREKEEPER_INCLUDE,
    });
    return successResponse(res, { assignment: full }, "Updated");
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:projectId/storekeepers/:assignmentId
exports.removeStorekeeperFromProject = async (req, res, next) => {
  try {
    const assignment = await ProjectStorekeeper.findOne({
      where: { id: req.params.assignmentId, projectId: req.params.projectId },
    });
    if (!assignment) return errorResponse(res, "Assignment not found", 404);
    await assignment.update({ isActive: false });
    return successResponse(res, null, "Storekeeper removed from project");
  } catch (err) {
    next(err);
  }
};

// ══════════════════════════════════════════════════════════════
// GLOBAL / ADMINISTRATION — All Storekeepers (across all projects)
// ══════════════════════════════════════════════════════════════

// GET /api/storekeepers — list every storekeeper assignment, any project, any status
exports.listAllStorekeepers = async (req, res, next) => {
  try {
    const { search, projectId, isActive } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const assignments = await ProjectStorekeeper.findAll({
      where,
      include: STOREKEEPER_INCLUDE_WITH_PROJECT,
      order: [["assignedAt", "DESC"]],
    });

    const filtered = search
      ? assignments.filter((a) => {
          const text = `${a.user?.firstName || ""} ${a.user?.lastName || ""} ${a.user?.email || ""} ${a.project?.name || ""} ${a.project?.projectCode || ""}`.toLowerCase();
          return text.includes(search.toLowerCase());
        })
      : assignments;

    return successResponse(res, { storekeepers: filtered });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/storekeepers/:assignmentId/status — activate / deactivate
exports.setStorekeeperStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== "boolean")
      return errorResponse(res, "isActive (boolean) is required", 400);

    const assignment = await ProjectStorekeeper.findByPk(req.params.assignmentId);
    if (!assignment) return errorResponse(res, "Assignment not found", 404);

    await assignment.update({ isActive });

    const full = await ProjectStorekeeper.findByPk(assignment.id, {
      include: STOREKEEPER_INCLUDE_WITH_PROJECT,
    });

    return successResponse(
      res,
      { assignment: full },
      isActive ? "Storekeeper activated" : "Storekeeper deactivated",
    );
  } catch (err) {
    next(err);
  }
};
