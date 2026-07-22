const express = require('express');
const userCtrl = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { PERMISSIONS: P } = require('../config/permissions');

const userRouter = express.Router();
userRouter.use(authenticate);
userRouter.get("/", authorize(P.USER_VIEW), userCtrl.listUsers);
userRouter.post("/", authorize(P.USER_CREATE), userCtrl.createUser);
userRouter.get("/:userId", authorize(P.USER_VIEW), userCtrl.getUser);
userRouter.put("/:userId", authorize(P.USER_UPDATE), userCtrl.updateUser);
userRouter.delete("/:userId", authorize(P.USER_DELETE), userCtrl.deleteUser);
userRouter.post(
  "/:userId/roles",
  authorize(P.USER_ASSIGN_ROLE),
  userCtrl.assignRoles,
);
userRouter.post(
  "/:userId/permissions",
  authorize(P.PERMISSION_ASSIGN),
  userCtrl.setDirectPermissions,
);
userRouter.get(
  "/:userId/permissions",
  authorize(P.USER_VIEW),
  userCtrl.getUserPermissions,
);
userRouter.use("/users", userRouter);

module.exports = userRouter;
