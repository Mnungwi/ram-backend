// Run: node src/seeders/seedUnits.js
require('dotenv').config();
const { sequelize } = require('../config/database');
const { Unit } = require('../models/unit.model');

const units = [
  // Volume
  { name: 'Litres',       abbreviation: 'L',    category: 'volume', description: 'Litres - for fuel, liquids' },
  { name: 'Millilitres',  abbreviation: 'mL',   category: 'volume' },
  { name: 'Cubic Metres', abbreviation: 'm³',   category: 'volume', description: 'Concrete, sand, gravel' },
  { name: 'Gallons',      abbreviation: 'gal',  category: 'volume' },

  // Weight
  { name: 'Kilograms',    abbreviation: 'Kg',   category: 'weight', description: 'Wire, nails, small items' },
  { name: 'Grams',        abbreviation: 'g',    category: 'weight' },
  { name: 'Tonnes',       abbreviation: 'T',    category: 'weight', description: 'Steel bars, bulk materials' },
  { name: 'Bags',         abbreviation: 'Bags', category: 'weight', description: 'Cement bags (50kg each)' },

  // Length
  { name: 'Metres',       abbreviation: 'm',    category: 'length' },
  { name: 'Centimetres',  abbreviation: 'cm',   category: 'length' },
  { name: 'Millimetres',  abbreviation: 'mm',   category: 'length' },
  { name: 'Feet',         abbreviation: 'ft',   category: 'length' },

  // Area
  { name: 'Square Metres',abbreviation: 'm²',   category: 'area' },
  { name: 'Square Feet',  abbreviation: 'ft²',  category: 'area' },

  // Count
  { name: 'Pieces',       abbreviation: 'Pcs',  category: 'count', description: 'Individual items' },
  { name: 'Pairs',        abbreviation: 'Pairs',category: 'count', description: 'Safety boots, gloves' },
  { name: 'Sets',         abbreviation: 'Sets', category: 'count' },
  { name: 'Rolls',        abbreviation: 'Rolls',category: 'count', description: 'Cable rolls, tape' },
  { name: 'Sheets',       abbreviation: 'Sheets',category:'count', description: 'Plywood, iron sheets' },
  { name: 'Loads',        abbreviation: 'Loads',category: 'count', description: 'Truck loads of sand/gravel' },
  { name: 'Boxes',        abbreviation: 'Box',  category: 'count' },
  { name: 'Cartons',      abbreviation: 'Ctn',  category: 'count' },
  { name: 'Bundles',      abbreviation: 'Bdl',  category: 'count' },
  { name: 'Lengths',      abbreviation: 'Lgth', category: 'count', description: 'Pipes, bars per length' },
  { name: 'Days',         abbreviation: 'Days', category: 'time',  description: 'Labour, hire' },
  { name: 'Hours',        abbreviation: 'Hrs',  category: 'time' },
  { name: 'Months',       abbreviation: 'Mths', category: 'time' },
];

(async () => {
  try {
    await sequelize.authenticate();
    await Unit.sync({ alter: true });
    for (const u of units) {
      const [unit, created] = await Unit.findOrCreate({ where: { name: u.name }, defaults: u });
      console.log(`${created ? '✅ Created' : '⚠️  Exists'}: ${unit.name} (${unit.abbreviation})`);
    }
    console.log('\n✅ Units seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
