// Run: node src/seeders/seedProducts.js
require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { Product, ProductCategory } = require('../src/models/product.model');

const categories = [
  { name: 'Fuel', description: 'Diesel, Petrol and other fuels' },
  { name: 'Cement & Concrete', description: 'Cement, concrete blocks, tofali' },
  { name: 'Steel & Metal', description: 'Nondo, wire, steel bars' },
  { name: 'Timber & Wood', description: 'Lumber, plywood, boards' },
  { name: 'Electrical', description: 'Cables, switches, panels' },
  { name: 'Plumbing', description: 'Pipes, fittings, valves' },
  { name: 'Safety', description: 'PPE, safety equipment' },
  { name: 'Tools & Equipment', description: 'Hand tools, power tools' },
  { name: 'General', description: 'Miscellaneous items' },
];

const products = [
  // Fuel
  { code: 'PRD-001', name: 'Diesel', unit: 'Litres', unitPrice: 3500, category: 'Fuel' },
  { code: 'PRD-002', name: 'Petrol', unit: 'Litres', unitPrice: 3200, category: 'Fuel' },

  // Cement
  { code: 'PRD-003', name: 'Saruji (Cement)', unit: 'Bags', unitPrice: 28000, category: 'Cement & Concrete' },
  { code: 'PRD-004', name: 'Tofali za 8 inch', unit: 'Pcs', unitPrice: 450, category: 'Cement & Concrete' },
  { code: 'PRD-005', name: 'Tofali za 6 inch', unit: 'Pcs', unitPrice: 350, category: 'Cement & Concrete' },
  { code: 'PRD-006', name: 'Kokoto (Gravel)', unit: 'Loads', unitPrice: 250000, category: 'Cement & Concrete' },
  { code: 'PRD-007', name: 'Mchanga (Sand)', unit: 'Loads', unitPrice: 180000, category: 'Cement & Concrete' },

  // Steel
  { code: 'PRD-008', name: 'Nondo mm8', unit: 'Tonne', unitPrice: 1100000, category: 'Steel & Metal' },
  { code: 'PRD-009', name: 'Nondo mm10', unit: 'Tonne', unitPrice: 1150000, category: 'Steel & Metal' },
  { code: 'PRD-010', name: 'Nondo mm12', unit: 'Tonne', unitPrice: 1200000, category: 'Steel & Metal' },
  { code: 'PRD-011', name: 'Nondo mm16', unit: 'Tonne', unitPrice: 1250000, category: 'Steel & Metal' },
  { code: 'PRD-012', name: 'Binding Wire', unit: 'Kg', unitPrice: 8000, category: 'Steel & Metal' },

  // Safety
  { code: 'PRD-013', name: 'Safety Helmet', unit: 'Pcs', unitPrice: 15000, category: 'Safety' },
  { code: 'PRD-014', name: 'Safety Boots', unit: 'Pairs', unitPrice: 45000, category: 'Safety' },
  { code: 'PRD-015', name: 'Safety Vest', unit: 'Pcs', unitPrice: 12000, category: 'Safety' },
  { code: 'PRD-016', name: 'Gloves', unit: 'Pairs', unitPrice: 5000, category: 'Safety' },

  // General
  { code: 'PRD-017', name: 'Paint (White)', unit: 'Litres', unitPrice: 18000, category: 'General' },
  { code: 'PRD-018', name: 'Nails', unit: 'Kg', unitPrice: 4500, category: 'General' },
  { code: 'PRD-019', name: 'Bolts & Nuts', unit: 'Pcs', unitPrice: 500, category: 'General' },
];

(async () => {
  try {
    await sequelize.authenticate();
    await ProductCategory.sync({ alter: true });
    await Product.sync({ alter: true });

    // Create categories
    const catMap = {};
    for (const cat of categories) {
      const [c] = await ProductCategory.findOrCreate({ where: { name: cat.name }, defaults: cat });
      catMap[cat.name] = c.id;
      console.log('Category:', cat.name);
    }

    // Create products
    for (const prod of products) {
      const { category, ...data } = prod;
      await Product.findOrCreate({
        where: { code: prod.code },
        defaults: { ...data, categoryId: catMap[category] }
      });
      console.log('Product:', prod.name);
    }

    console.log('\n✅ Products seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
