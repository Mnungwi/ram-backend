const express = require('express');
const productCtrl = require('../controllers/productController');
const {
  authenticate,
  authorize,
  authorizeAny,
  requireAdmin,
} = require("../middleware/auth");
const { PERMISSIONS: P } = require("../config/permissions");

const productRouter = express.Router();
productRouter.use(authenticate);
productRouter.get('/all',                  authorize(P.SUPPLIER_VIEW),   productCtrl.listAllProducts);
productRouter.get('/categories',           authorize(P.SUPPLIER_VIEW),   productCtrl.listCategories);
productRouter.post('/categories',          authorize(P.SUPPLIER_CREATE), productCtrl.createCategory);
productRouter.put('/categories/:catId',    authorize(P.SUPPLIER_UPDATE), productCtrl.updateCategory);
productRouter.delete('/categories/:catId', authorize(P.SUPPLIER_UPDATE), productCtrl.deleteCategory);
productRouter.get('/',                     authorize(P.SUPPLIER_VIEW),   productCtrl.listProducts);
productRouter.post('/',                    authorize(P.SUPPLIER_CREATE), productCtrl.createProduct);
productRouter.get('/:productId',           authorize(P.SUPPLIER_VIEW),   productCtrl.getProduct);
productRouter.put('/:productId',           authorize(P.SUPPLIER_UPDATE), productCtrl.updateProduct);
productRouter.delete('/:productId',        authorize(P.SUPPLIER_UPDATE), productCtrl.deleteProduct);

module.exports = productRouter;
