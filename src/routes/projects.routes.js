const express = require("express");
const projectCtrl = require("../controllers/projectController");
const projectSupplierCtrl = require("../controllers/projectSupplierController");
const projectStakeholderCtrl = require("../controllers/projectStakeholderController");
const requisitionCtrl = require("../controllers/requisitionController");
const lpoCtrl = require("../controllers/lpoController");
const storeCtrl = require("../controllers/storeController");
const { authenticate, authorize } = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");
const {
  Activity,
  User,
  ProjectPhase,
  Report,
  Document,
  TeamMember,
  AuditLog,
} = require("../models/index");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  getPagination,
} = require("../utils/response");
const { Op } = require("sequelize");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/documents/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const router = express.Router();
router.use(authenticate);

// ── Projects CRUD ─────────────────────────────────────────
router.get("/", authorize(P.PROJECT_VIEW), projectCtrl.listProjects);
router.post("/", authorize(P.PROJECT_CREATE), projectCtrl.createProject);
router.get("/:projectId", authorize(P.PROJECT_VIEW), projectCtrl.getProject);
router.put(
  "/:projectId",
  authorize(P.PROJECT_UPDATE),
  projectCtrl.updateProject,
);
router.delete(
  "/:projectId",
  authorize(P.PROJECT_DELETE),
  projectCtrl.deleteProject,
);
router.get(
  "/:projectId/overview",
  authorize(P.PROJECT_VIEW),
  projectCtrl.getProjectOverview,
);

// ── Activities ────────────────────────────────────────────
router.get(
  "/:projectId/activities",
  authorize(P.PROJECT_VIEW),
  async (req, res) => {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { status, phaseId } = req.query;
      const where = { projectId: req.params.projectId };
      if (status) where.status = status;
      if (phaseId) where.phaseId = phaseId;
      const { count, rows } = await Activity.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "responsible",
            attributes: ["id", "firstName", "lastName"],
          },
          { model: ProjectPhase, as: "phase", attributes: ["id", "name"] },
        ],
        order: [["startDate", "ASC"]],
        limit,
        offset,
      });
      return paginatedResponse(res, rows, count, page, limit);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

router.post(
  "/:projectId/activities",
  authorize(P.PROJECT_CREATE),
  async (req, res) => {
    try {
      const activity = await Activity.create({
        ...req.body,
        projectId: req.params.projectId,
      });
      return successResponse(res, { activity }, "Activity created", 201);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

router.put(
  "/:projectId/activities/:activityId",
  authorize(P.PROJECT_UPDATE),
  async (req, res) => {
    try {
      const activity = await Activity.findOne({
        where: { id: req.params.activityId, projectId: req.params.projectId },
      });
      if (!activity) return errorResponse(res, "Activity not found", 404);
      await activity.update(req.body);
      return successResponse(res, { activity }, "Activity updated");
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

router.delete(
  "/:projectId/activities/:activityId",
  authorize(P.PROJECT_DELETE),
  async (req, res) => {
    try {
      const activity = await Activity.findOne({
        where: { id: req.params.activityId, projectId: req.params.projectId },
      });
      if (!activity) return errorResponse(res, "Activity not found", 404);
      await activity.destroy();
      return successResponse(res, null, "Activity deleted");
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── Contracts ─────────────────────────────────────────────
router.get(
  "/:projectId/contracts",
  authorize(P.PROJECT_VIEW),
  async (req, res) => {
    try {
      const contracts = await Contract.findAll({
        where: { projectId: req.params.projectId },
        order: [["createdAt", "DESC"]],
      });
      return successResponse(res, { contracts });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
router.post(
  "/:projectId/contracts",
  authorize(P.PROJECT_CREATE),
  async (req, res) => {
    try {
      const contract = await Contract.create({
        ...req.body,
        projectId: req.params.projectId,
      });
      return successResponse(res, { contract }, "Contract created", 201);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
router.put(
  "/:projectId/contracts/:contractId",
  authorize(P.PROJECT_UPDATE),
  async (req, res) => {
    try {
      const contract = await Contract.findOne({
        where: { id: req.params.contractId, projectId: req.params.projectId },
      });
      if (!contract) return errorResponse(res, "Not found", 404);
      await contract.update(req.body);
      return successResponse(res, { contract }, "Updated");
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
router.delete(
  "/:projectId/contracts/:contractId",
  authorize(P.PROJECT_DELETE),
  async (req, res) => {
    try {
      const contract = await Contract.findOne({
        where: { id: req.params.contractId, projectId: req.params.projectId },
      });
      if (!contract) return errorResponse(res, "Not found", 404);
      await contract.destroy();
      return successResponse(res, null, "Deleted");
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── Purchase Orders ───────────────────────────────────────
router.get(
  "/:projectId/purchase-orders",
  authorize(P.PROJECT_VIEW),
  async (req, res) => {
    try {
      const orders = await PurchaseOrder.findAll({
        where: { projectId: req.params.projectId },
        order: [["createdAt", "DESC"]],
      });
      return successResponse(res, { orders });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
router.post(
  "/:projectId/purchase-orders",
  authorize(P.PROJECT_CREATE),
  async (req, res) => {
    try {
      const order = await PurchaseOrder.create({
        ...req.body,
        projectId: req.params.projectId,
      });
      return successResponse(res, { order }, "Created", 201);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── Team ──────────────────────────────────────────────────
router.get("/:projectId/team", authorize(P.PROJECT_VIEW), async (req, res) => {
  try {
    const team = await TeamMember.findAll({
      where: { projectId: req.params.projectId },
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "firstName",
            "lastName",
            "email",
            "jobTitle",
            "avatar",
          ],
        },
      ],
    });
    return successResponse(res, { team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post(
  "/:projectId/team",
  authorize(P.PROJECT_CREATE),
  async (req, res) => {
    try {
      const member = await TeamMember.create({
        ...req.body,
        projectId: req.params.projectId,
      });
      return successResponse(res, { member }, "Added", 201);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
router.delete(
  "/:projectId/team/:memberId",
  authorize(P.PROJECT_DELETE),
  async (req, res) => {
    try {
      const member = await TeamMember.findOne({
        where: { id: req.params.memberId, projectId: req.params.projectId },
      });
      if (!member) return errorResponse(res, "Not found", 404);
      await member.destroy();
      return successResponse(res, null, "Removed");
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── Documents ─────────────────────────────────────────────
// (Note: Document endpoints have been moved to document.routes.js and document.controller.js)

// ── Reports ───────────────────────────────────────────────
router.get(
  "/:projectId/reports",
  authorize(P.PROJECT_VIEW),
  async (req, res) => {
    try {
      const reports = await Report.findAll({
        where: { projectId: req.params.projectId },
        include: [
          {
            model: User,
            as: "submittedByUser",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      return successResponse(res, { reports });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

router.post(
  "/:projectId/reports",
  authorize(P.PROJECT_UPDATE),
  async (req, res) => {
    try {
      const report = await Report.create({
        projectId: req.params.projectId,
        phaseId: req.body.phaseId || null,
        reportNo: req.body.reportNo || `REP-${Date.now()}`,
        title: req.body.title,
        type: req.body.type,
        period: req.body.period || null,
        content: req.body.content || null,
        status: req.body.status || "draft",
        progress: req.body.progress || 0,
        submittedById: req.userId || null,
        submittedOn: new Date(),
      });
      return successResponse(res, { report }, "Report created", 201);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.put(
  "/:projectId/reports/:reportId",
  authorize(P.PROJECT_UPDATE),
  async (req, res) => {
    try {
      const report = await Report.findOne({
        where: { id: req.params.reportId, projectId: req.params.projectId }
      });
      if (!report) return res.status(404).json({ success: false, message: "Report not found" });

      await report.update({
        phaseId: req.body.phaseId !== undefined ? req.body.phaseId : report.phaseId,
        reportNo: req.body.reportNo !== undefined ? req.body.reportNo : report.reportNo,
        title: req.body.title !== undefined ? req.body.title : report.title,
        type: req.body.type !== undefined ? req.body.type : report.type,
        period: req.body.period !== undefined ? req.body.period : report.period,
        content: req.body.content !== undefined ? req.body.content : report.content,
        status: req.body.status !== undefined ? req.body.status : report.status,
        progress: req.body.progress !== undefined ? req.body.progress : report.progress,
      });

      return successResponse(res, { report }, "Report updated");
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.post(
  "/:projectId/reports/:reportId/approve",
  authorize(P.PROJECT_UPDATE),
  async (req, res) => {
    try {
      const report = await Report.findOne({
        where: { id: req.params.reportId, projectId: req.params.projectId }
      });
      if (!report) return res.status(404).json({ success: false, message: "Report not found" });

      await report.update({
        status: "completed", // maps to dashboard completed status
        approvedById: req.userId,
      });

      return successResponse(res, { report }, "Report approved");
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.delete(
  "/:projectId/reports/:reportId",
  authorize(P.PROJECT_UPDATE),
  async (req, res) => {
    try {
      const report = await Report.findOne({
        where: { id: req.params.reportId, projectId: req.params.projectId }
      });
      if (!report) return res.status(404).json({ success: false, message: "Report not found" });

      await report.destroy();
      return successResponse(res, null, "Report deleted");
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── Audit Log ─────────────────────────────────────────────
router.get(
  "/:projectId/audit-log",
  authorize(P.PROJECT_VIEW),
  async (req, res) => {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { count, rows } = await AuditLog.findAndCountAll({
        where: { projectId: req.params.projectId },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
        order: [["createdAt", "DESC"]],
        limit,
        offset,
      });
      return paginatedResponse(res, rows, count, page, limit);
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

// ── Project Suppliers ─────────────────────────────────────
router.get(
  "/:projectId/suppliers",
  authorize(P.SUPPLIER_VIEW),
  projectSupplierCtrl.listProjectSuppliers,
);
router.post(
  "/:projectId/suppliers",
  authorize(P.SUPPLIER_CREATE),
  projectSupplierCtrl.addProjectSupplier,
);
router.put(
  "/:projectId/suppliers/:psId",
  authorize(P.SUPPLIER_UPDATE),
  projectSupplierCtrl.updateProjectSupplier,
);
router.delete(
  "/:projectId/suppliers/:psId",
  authorize(P.SUPPLIER_DELETE),
  projectSupplierCtrl.removeProjectSupplier,
);

// ── Project Stakeholders ──────────────────────────────────
router.get(
  "/:projectId/stakeholders",
  authorize(P.PROJECT_VIEW),
  projectStakeholderCtrl.listProjectStakeholders,
);
router.get(
  "/:projectId/stakeholders/signatories",
  authorize(P.PROJECT_VIEW),
  projectStakeholderCtrl.getSignatories,
);
router.post(
  "/:projectId/stakeholders",
  authorize(P.PROJECT_CREATE),
  projectStakeholderCtrl.addProjectStakeholder,
);
router.put(
  "/:projectId/stakeholders/:psId",
  authorize(P.PROJECT_UPDATE),
  projectStakeholderCtrl.updateProjectStakeholder,
);
router.delete(
  "/:projectId/stakeholders/:psId",
  authorize(P.PROJECT_DELETE),
  projectStakeholderCtrl.removeProjectStakeholder,
);

// ── Requisitions ──────────────────────────────────────────
router.get(
  "/:projectId/requisitions",
  authorize(P.REQUISITION_VIEW),
  requisitionCtrl.listRequisitions,
);
router.post(
  "/:projectId/requisitions",
  authorize(P.REQUISITION_CREATE),
  requisitionCtrl.createRequisition,
);
router.get(
  "/:projectId/requisitions/:reqId",
  authorize(P.REQUISITION_VIEW),
  requisitionCtrl.getRequisition,
);
router.put(
  "/:projectId/requisitions/:reqId",
  authorize(P.REQUISITION_UPDATE),
  requisitionCtrl.updateRequisition,
);
router.delete(
  "/:projectId/requisitions/:reqId",
  authorize(P.REQUISITION_DELETE),
  requisitionCtrl.deleteRequisition,
);
router.post(
  "/:projectId/requisitions/:reqId/submit",
  authorize(P.REQUISITION_SUBMIT),
  requisitionCtrl.submitRequisition,
);
router.post(
  "/:projectId/requisitions/:reqId/review",
  authorize(P.REQUISITION_REVIEW),
  requisitionCtrl.reviewRequisition,
);
router.post(
  "/:projectId/requisitions/:reqId/approve",
  authorize(P.REQUISITION_APPROVE),
  requisitionCtrl.approveRequisition,
);
router.post(
  "/:projectId/requisitions/:reqId/issue",
  authorize(P.REQUISITION_ISSUE),
  requisitionCtrl.issueRequisition,
);
router.post(
  "/:projectId/requisitions/:reqId/reject",
  authorize(P.REQUISITION_REJECT),
  requisitionCtrl.rejectRequisition,
);
router.post(
  "/:projectId/requisitions/:reqId/cancel",
  authorize(P.REQUISITION_UPDATE),
  requisitionCtrl.cancelRequisition,
);
router.post(
  "/:projectId/requisitions/:reqId/comments",
  authorize(P.REQUISITION_VIEW),
  requisitionCtrl.addComment,
);

// ── LPOs ─────────────────────────────────────────────────
router.get("/:projectId/lpos", authorize(P.LPO_VIEW), lpoCtrl.listLPOs);
router.post("/:projectId/lpos", authorize(P.LPO_CREATE), lpoCtrl.createLPO);
router.post(
  "/:projectId/lpos/from-requisition/:reqId",
  authorize(P.LPO_CREATE),
  lpoCtrl.createFromRequisition,
);
router.get("/:projectId/lpos/:lpoId", authorize(P.LPO_VIEW), lpoCtrl.getLPO);
router.put(
  "/:projectId/lpos/:lpoId",
  authorize(P.LPO_UPDATE),
  lpoCtrl.updateLPO,
);
router.delete(
  "/:projectId/lpos/:lpoId",
  authorize(P.LPO_DELETE),
  lpoCtrl.deleteLPO,
);
router.post(
  "/:projectId/lpos/:lpoId/submit",
  authorize(P.LPO_CREATE),
  lpoCtrl.submitLPO,
);
router.post(
  "/:projectId/lpos/:lpoId/approve",
  authorize(P.LPO_APPROVE),
  lpoCtrl.approveLPO,
);
router.post(
  "/:projectId/lpos/:lpoId/send",
  authorize(P.LPO_APPROVE),
  lpoCtrl.sendLPO,
);
router.post(
  "/:projectId/lpos/:lpoId/receive",
  authorize(P.LPO_RECEIVE),
  lpoCtrl.receiveLPO,
);
router.post(
  "/:projectId/lpos/:lpoId/cancel",
  authorize(P.LPO_UPDATE),
  lpoCtrl.cancelLPO,
);
router.post(
  "/:projectId/lpos/:lpoId/comments",
  authorize(P.LPO_VIEW),
  lpoCtrl.addComment,
);

// ── Project Store ─────────────────────────────────────────
router.get(
  "/:projectId/store",
  authorize(P.SUPPLIER_VIEW),
  storeCtrl.listProjectStore,
);
router.get(
  "/:projectId/store/transactions",
  authorize(P.SUPPLIER_VIEW),
  storeCtrl.listProjectTransactions,
);
router.post(
  "/:projectId/store/receive-lpo",
  authorize(P.LPO_RECEIVE),
  storeCtrl.receiveLPOToProjectStore,
);
router.post(
  "/:projectId/store/issue-rn",
  authorize(P.LPO_RECEIVE),
  storeCtrl.issueRequisitionFromStore,
);
router.post(
  "/:projectId/store/transfer-to-central",
  authorize(P.SUPPLIER_CREATE),
  storeCtrl.transferRemainingToCentral,
);
router.post(
  "/:projectId/store/adjust",
  authorize(P.SUPPLIER_CREATE),
  storeCtrl.adjustProjectStore,
);

// ── Project Technicians ──────────────────────────────────
const techCtrl = require("../controllers/technicianController");
router.get(
  "/:projectId/technicians",
  authorize(P.PROJECT_VIEW),
  techCtrl.listProjectTechnicians,
);
router.post(
  "/:projectId/technicians",
  authorize(P.PROJECT_CREATE),
  techCtrl.assignTechnicianToProject,
);
router.put(
  "/:projectId/technicians/:assignmentId",
  authorize(P.PROJECT_UPDATE),
  techCtrl.updateProjectTechnician,
);
router.delete(
  "/:projectId/technicians/:assignmentId",
  authorize(P.PROJECT_DELETE),
  techCtrl.removeTechnicianFromProject,
);

// ── Technician Receipts ───────────────────────────────────
router.get(
  "/:projectId/technician-receipts",
  authorize(P.PROJECT_VIEW),
  techCtrl.listProjectReceipts,
);
router.post(
  "/:projectId/technician-receipts/distribute",
  authorize(P.PROJECT_CREATE),
  techCtrl.distributeItems,
);
router.post(
  "/:projectId/technician-receipts",
  authorize(P.PROJECT_CREATE),
  techCtrl.createReceipt,
);
router.post(
  "/:projectId/technician-receipts/:receiptId/acknowledge",
  authorize(P.PROJECT_UPDATE),
  techCtrl.acknowledgeReceipt,
);
router.delete(
  "/:projectId/technician-receipts/:receiptId",
  authorize(P.PROJECT_DELETE),
  techCtrl.deleteReceipt,
);




module.exports = router;

// const express = require("express");
// const projectCtrl = require("../controllers/projectController");
// const projectSupplierCtrl = require("../controllers/projectSupplierController");
// const projectStakeholderCtrl = require("../controllers/projectStakeholderController");
// const requisitionCtrl = require("../controllers/requisitionController");
// const lpoCtrl = require("../controllers/lpoController");
// const storeCtrl = require("../controllers/storeController");
// const { authenticate, authorize } = require("../middleware/auth");
// const { PERMISSIONS: P } = require("../config/permissions");
// const {
//   Activity,
//   User,
//   ProjectPhase,
//   Contract,
//   PurchaseOrder,
//   Report,
//   Document,
//   TeamMember,
//   AuditLog,
// } = require("../models/index");
// const {
//   successResponse,
//   errorResponse,
//   paginatedResponse,
//   getPagination,
// } = require("../utils/response");
// const { Op } = require("sequelize");
// const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, "uploads/documents/"),
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
// });
// const upload = multer({ storage });

// const router = express.Router();
// router.use(authenticate);

// // ── Projects CRUD ─────────────────────────────────────────
// router.get("/", authorize(P.PROJECT_VIEW), projectCtrl.listProjects);
// router.post("/", authorize(P.PROJECT_CREATE), projectCtrl.createProject);
// router.get("/:projectId", authorize(P.PROJECT_VIEW), projectCtrl.getProject);
// router.put(
//   "/:projectId",
//   authorize(P.PROJECT_UPDATE),
//   projectCtrl.updateProject,
// );
// router.delete(
//   "/:projectId",
//   authorize(P.PROJECT_DELETE),
//   projectCtrl.deleteProject,
// );
// router.get(
//   "/:projectId/overview",
//   authorize(P.PROJECT_VIEW),
//   projectCtrl.getProjectOverview,
// );

// // ── Activities ────────────────────────────────────────────
// router.get(
//   "/:projectId/activities",
//   authorize(P.PROJECT_VIEW),
//   async (req, res) => {
//     try {
//       const { page, limit, offset } = getPagination(req.query);
//       const { status, phaseId } = req.query;
//       const where = { projectId: req.params.projectId };
//       if (status) where.status = status;
//       if (phaseId) where.phaseId = phaseId;
//       const { count, rows } = await Activity.findAndCountAll({
//         where,
//         include: [
//           {
//             model: User,
//             as: "responsible",
//             attributes: ["id", "firstName", "lastName"],
//           },
//           { model: ProjectPhase, as: "phase", attributes: ["id", "name"] },
//         ],
//         order: [["startDate", "ASC"]],
//         limit,
//         offset,
//       });
//       return paginatedResponse(res, rows, count, page, limit);
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// router.post(
//   "/:projectId/activities",
//   authorize(P.PROJECT_CREATE),
//   async (req, res) => {
//     try {
//       const activity = await Activity.create({
//         ...req.body,
//         projectId: req.params.projectId,
//       });
//       return successResponse(res, { activity }, "Activity created", 201);
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// router.put(
//   "/:projectId/activities/:activityId",
//   authorize(P.PROJECT_UPDATE),
//   async (req, res) => {
//     try {
//       const activity = await Activity.findOne({
//         where: { id: req.params.activityId, projectId: req.params.projectId },
//       });
//       if (!activity) return errorResponse(res, "Activity not found", 404);
//       await activity.update(req.body);
//       return successResponse(res, { activity }, "Activity updated");
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// router.delete(
//   "/:projectId/activities/:activityId",
//   authorize(P.PROJECT_DELETE),
//   async (req, res) => {
//     try {
//       const activity = await Activity.findOne({
//         where: { id: req.params.activityId, projectId: req.params.projectId },
//       });
//       if (!activity) return errorResponse(res, "Activity not found", 404);
//       await activity.destroy();
//       return successResponse(res, null, "Activity deleted");
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// // ── Contracts ─────────────────────────────────────────────
// router.get(
//   "/:projectId/contracts",
//   authorize(P.PROJECT_VIEW),
//   async (req, res) => {
//     try {
//       const contracts = await Contract.findAll({
//         where: { projectId: req.params.projectId },
//         order: [["createdAt", "DESC"]],
//       });
//       return successResponse(res, { contracts });
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );
// router.post(
//   "/:projectId/contracts",
//   authorize(P.PROJECT_CREATE),
//   async (req, res) => {
//     try {
//       const contract = await Contract.create({
//         ...req.body,
//         projectId: req.params.projectId,
//       });
//       return successResponse(res, { contract }, "Contract created", 201);
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );
// router.put(
//   "/:projectId/contracts/:contractId",
//   authorize(P.PROJECT_UPDATE),
//   async (req, res) => {
//     try {
//       const contract = await Contract.findOne({
//         where: { id: req.params.contractId, projectId: req.params.projectId },
//       });
//       if (!contract) return errorResponse(res, "Not found", 404);
//       await contract.update(req.body);
//       return successResponse(res, { contract }, "Updated");
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );
// router.delete(
//   "/:projectId/contracts/:contractId",
//   authorize(P.PROJECT_DELETE),
//   async (req, res) => {
//     try {
//       const contract = await Contract.findOne({
//         where: { id: req.params.contractId, projectId: req.params.projectId },
//       });
//       if (!contract) return errorResponse(res, "Not found", 404);
//       await contract.destroy();
//       return successResponse(res, null, "Deleted");
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// // ── Purchase Orders ───────────────────────────────────────
// router.get(
//   "/:projectId/purchase-orders",
//   authorize(P.PROJECT_VIEW),
//   async (req, res) => {
//     try {
//       const orders = await PurchaseOrder.findAll({
//         where: { projectId: req.params.projectId },
//         order: [["createdAt", "DESC"]],
//       });
//       return successResponse(res, { orders });
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );
// router.post(
//   "/:projectId/purchase-orders",
//   authorize(P.PROJECT_CREATE),
//   async (req, res) => {
//     try {
//       const order = await PurchaseOrder.create({
//         ...req.body,
//         projectId: req.params.projectId,
//       });
//       return successResponse(res, { order }, "Created", 201);
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// // ── Team ──────────────────────────────────────────────────
// router.get("/:projectId/team", authorize(P.PROJECT_VIEW), async (req, res) => {
//   try {
//     const team = await TeamMember.findAll({
//       where: { projectId: req.params.projectId },
//       include: [
//         {
//           model: User,
//           as: "user",
//           attributes: [
//             "id",
//             "firstName",
//             "lastName",
//             "email",
//             "jobTitle",
//             "avatar",
//           ],
//         },
//       ],
//     });
//     return successResponse(res, { team });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });
// router.post(
//   "/:projectId/team",
//   authorize(P.PROJECT_CREATE),
//   async (req, res) => {
//     try {
//       const member = await TeamMember.create({
//         ...req.body,
//         projectId: req.params.projectId,
//       });
//       return successResponse(res, { member }, "Added", 201);
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );
// router.delete(
//   "/:projectId/team/:memberId",
//   authorize(P.PROJECT_DELETE),
//   async (req, res) => {
//     try {
//       const member = await TeamMember.findOne({
//         where: { id: req.params.memberId, projectId: req.params.projectId },
//       });
//       if (!member) return errorResponse(res, "Not found", 404);
//       await member.destroy();
//       return successResponse(res, null, "Removed");
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// // ── Documents ─────────────────────────────────────────────
// router.get(
//   "/:projectId/documents",
//   authorize(P.PROJECT_VIEW),
//   async (req, res) => {
//     try {
//       const documents = await Document.findAll({
//         where: { projectId: req.params.projectId },
//         include: [
//           {
//             model: User,
//             as: "uploadedBy",
//             attributes: ["id", "firstName", "lastName"],
//           },
//         ],
//         order: [["createdAt", "DESC"]],
//       });
//       return successResponse(res, { documents });
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );
// router.post(
//   "/:projectId/documents",
//   authorize(P.PROJECT_CREATE),
//   upload.single("file"),
//   async (req, res) => {
//     try {
//       const doc = await Document.create({
//         ...req.body,
//         projectId: req.params.projectId,
//         uploadedById: req.userId,
//         filePath: req.file?.path,
//         fileName: req.file?.originalname,
//         fileSize: req.file?.size,
//         mimeType: req.file?.mimetype,
//       });
//       return successResponse(res, { document: doc }, "Uploaded", 201);
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );
// router.delete(
//   "/:projectId/documents/:docId",
//   authorize(P.PROJECT_DELETE),
//   async (req, res) => {
//     try {
//       const doc = await Document.findOne({
//         where: { id: req.params.docId, projectId: req.params.projectId },
//       });
//       if (!doc) return errorResponse(res, "Not found", 404);
//       await doc.destroy();
//       return successResponse(res, null, "Deleted");
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// // ── Reports ───────────────────────────────────────────────
// router.get(
//   "/:projectId/reports",
//   authorize(P.PROJECT_VIEW),
//   async (req, res) => {
//     try {
//       const reports = await Report.findAll({
//         where: { projectId: req.params.projectId },
//         order: [["createdAt", "DESC"]],
//       });
//       return successResponse(res, { reports });
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// // ── Audit Log ─────────────────────────────────────────────
// router.get(
//   "/:projectId/audit-log",
//   authorize(P.PROJECT_VIEW),
//   async (req, res) => {
//     try {
//       const { page, limit, offset } = getPagination(req.query);
//       const { count, rows } = await AuditLog.findAndCountAll({
//         where: { projectId: req.params.projectId },
//         include: [
//           {
//             model: User,
//             as: "user",
//             attributes: ["id", "firstName", "lastName"],
//           },
//         ],
//         order: [["createdAt", "DESC"]],
//         limit,
//         offset,
//       });
//       return paginatedResponse(res, rows, count, page, limit);
//     } catch (err) {
//       res.status(500).json({ success: false, message: err.message });
//     }
//   },
// );

// // ── Project Suppliers ─────────────────────────────────────
// router.get(
//   "/:projectId/suppliers",
//   authorize(P.SUPPLIER_VIEW),
//   projectSupplierCtrl.listProjectSuppliers,
// );
// router.post(
//   "/:projectId/suppliers",
//   authorize(P.SUPPLIER_CREATE),
//   projectSupplierCtrl.addProjectSupplier,
// );
// router.put(
//   "/:projectId/suppliers/:psId",
//   authorize(P.SUPPLIER_UPDATE),
//   projectSupplierCtrl.updateProjectSupplier,
// );
// router.delete(
//   "/:projectId/suppliers/:psId",
//   authorize(P.SUPPLIER_DELETE),
//   projectSupplierCtrl.removeProjectSupplier,
// );

// // ── Project Stakeholders ──────────────────────────────────
// router.get(
//   "/:projectId/stakeholders",
//   authorize(P.PROJECT_VIEW),
//   projectStakeholderCtrl.listProjectStakeholders,
// );
// router.get(
//   "/:projectId/stakeholders/signatories",
//   authorize(P.PROJECT_VIEW),
//   projectStakeholderCtrl.getSignatories,
// );
// router.post(
//   "/:projectId/stakeholders",
//   authorize(P.PROJECT_CREATE),
//   projectStakeholderCtrl.addProjectStakeholder,
// );
// router.put(
//   "/:projectId/stakeholders/:psId",
//   authorize(P.PROJECT_UPDATE),
//   projectStakeholderCtrl.updateProjectStakeholder,
// );
// router.delete(
//   "/:projectId/stakeholders/:psId",
//   authorize(P.PROJECT_DELETE),
//   projectStakeholderCtrl.removeProjectStakeholder,
// );

// // ── Requisitions ──────────────────────────────────────────
// router.get(
//   "/:projectId/requisitions",
//   authorize(P.REQUISITION_VIEW),
//   requisitionCtrl.listRequisitions,
// );
// router.post(
//   "/:projectId/requisitions",
//   authorize(P.REQUISITION_CREATE),
//   requisitionCtrl.createRequisition,
// );
// router.get(
//   "/:projectId/requisitions/:reqId",
//   authorize(P.REQUISITION_VIEW),
//   requisitionCtrl.getRequisition,
// );
// router.put(
//   "/:projectId/requisitions/:reqId",
//   authorize(P.REQUISITION_UPDATE),
//   requisitionCtrl.updateRequisition,
// );
// router.delete(
//   "/:projectId/requisitions/:reqId",
//   authorize(P.REQUISITION_DELETE),
//   requisitionCtrl.deleteRequisition,
// );
// router.post(
//   "/:projectId/requisitions/:reqId/submit",
//   authorize(P.REQUISITION_SUBMIT),
//   requisitionCtrl.submitRequisition,
// );
// router.post(
//   "/:projectId/requisitions/:reqId/review",
//   authorize(P.REQUISITION_REVIEW),
//   requisitionCtrl.reviewRequisition,
// );
// router.post(
//   "/:projectId/requisitions/:reqId/approve",
//   authorize(P.REQUISITION_APPROVE),
//   requisitionCtrl.approveRequisition,
// );
// router.post(
//   "/:projectId/requisitions/:reqId/issue",
//   authorize(P.REQUISITION_ISSUE),
//   requisitionCtrl.issueRequisition,
// );
// router.post(
//   "/:projectId/requisitions/:reqId/reject",
//   authorize(P.REQUISITION_REJECT),
//   requisitionCtrl.rejectRequisition,
// );
// router.post(
//   "/:projectId/requisitions/:reqId/cancel",
//   authorize(P.REQUISITION_UPDATE),
//   requisitionCtrl.cancelRequisition,
// );
// router.post(
//   "/:projectId/requisitions/:reqId/comments",
//   authorize(P.REQUISITION_VIEW),
//   requisitionCtrl.addComment,
// );

// // ── LPOs ─────────────────────────────────────────────────
// router.get("/:projectId/lpos", authorize(P.LPO_VIEW), lpoCtrl.listLPOs);
// router.post("/:projectId/lpos", authorize(P.LPO_CREATE), lpoCtrl.createLPO);
// router.post(
//   "/:projectId/lpos/from-requisition/:reqId",
//   authorize(P.LPO_CREATE),
//   lpoCtrl.createFromRequisition,
// );
// router.get("/:projectId/lpos/:lpoId", authorize(P.LPO_VIEW), lpoCtrl.getLPO);
// router.put(
//   "/:projectId/lpos/:lpoId",
//   authorize(P.LPO_UPDATE),
//   lpoCtrl.updateLPO,
// );
// router.delete(
//   "/:projectId/lpos/:lpoId",
//   authorize(P.LPO_DELETE),
//   lpoCtrl.deleteLPO,
// );
// router.post(
//   "/:projectId/lpos/:lpoId/submit",
//   authorize(P.LPO_CREATE),
//   lpoCtrl.submitLPO,
// );
// router.post(
//   "/:projectId/lpos/:lpoId/approve",
//   authorize(P.LPO_APPROVE),
//   lpoCtrl.approveLPO,
// );
// router.post(
//   "/:projectId/lpos/:lpoId/send",
//   authorize(P.LPO_APPROVE),
//   lpoCtrl.sendLPO,
// );
// router.post(
//   "/:projectId/lpos/:lpoId/receive",
//   authorize(P.LPO_RECEIVE),
//   lpoCtrl.receiveLPO,
// );
// router.post(
//   "/:projectId/lpos/:lpoId/cancel",
//   authorize(P.LPO_UPDATE),
//   lpoCtrl.cancelLPO,
// );
// router.post(
//   "/:projectId/lpos/:lpoId/comments",
//   authorize(P.LPO_VIEW),
//   lpoCtrl.addComment,
// );

// // ── Project Store ─────────────────────────────────────────
// router.get(
//   "/:projectId/store",
//   authorize(P.SUPPLIER_VIEW),
//   storeCtrl.listProjectStore,
// );
// router.get(
//   "/:projectId/store/transactions",
//   authorize(P.SUPPLIER_VIEW),
//   storeCtrl.listProjectTransactions,
// );
// router.post(
//   "/:projectId/store/receive-lpo",
//   authorize(P.LPO_RECEIVE),
//   storeCtrl.receiveLPOToProjectStore,
// );
// router.post(
//   "/:projectId/store/issue-rn",
//   authorize(P.LPO_RECEIVE),
//   storeCtrl.issueRequisitionFromStore,
// );
// router.post(
//   "/:projectId/store/transfer-to-central",
//   authorize(P.SUPPLIER_CREATE),
//   storeCtrl.transferRemainingToCentral,
// );
// router.post(
//   "/:projectId/store/adjust",
//   authorize(P.SUPPLIER_CREATE),
//   storeCtrl.adjustProjectStore,
// );

// module.exports = router;
