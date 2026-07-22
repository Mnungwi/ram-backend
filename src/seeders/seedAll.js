// ============================================================
// MASTER SEED FILE — Products, Categories, Units
// Run: node src/seeders/seedAll.js
// ============================================================
require('dotenv').config();
const { sequelize } = require('../config/database');
const { Unit } = require('../models/unit.model');
const { Product, ProductCategory } = require('../models/product.model');

// ════════════════════════════════════════════════════════════
// UNITS OF MEASURE
// ════════════════════════════════════════════════════════════
const UNITS = [
  // Volume
  { name:'Litres',        abbreviation:'L',     category:'volume', description:'Liquids - fuel, water, chemicals' },
  { name:'Millilitres',   abbreviation:'mL',    category:'volume' },
  { name:'Cubic Metres',  abbreviation:'m³',    category:'volume', description:'Concrete, sand, gravel, water tanks' },
  { name:'Gallons',       abbreviation:'gal',   category:'volume' },
  { name:'Barrels',       abbreviation:'bbl',   category:'volume' },

  // Weight
  { name:'Kilograms',     abbreviation:'Kg',    category:'weight', description:'Binding wire, nails, small items' },
  { name:'Grams',         abbreviation:'g',     category:'weight' },
  { name:'Tonnes',        abbreviation:'T',     category:'weight', description:'Steel bars, bulk materials, sand' },
  { name:'Pounds',        abbreviation:'lbs',   category:'weight' },
  { name:'Bags',          abbreviation:'Bags',  category:'weight', description:'Cement/fertilizer bags 50kg' },
  { name:'Sacks',         abbreviation:'Sacks', category:'weight', description:'Rice, sugar, flour sacks' },

  // Length
  { name:'Metres',        abbreviation:'m',     category:'length', description:'Pipes, cables, fencing' },
  { name:'Centimetres',   abbreviation:'cm',    category:'length' },
  { name:'Millimetres',   abbreviation:'mm',    category:'length' },
  { name:'Feet',          abbreviation:'ft',    category:'length' },
  { name:'Inches',        abbreviation:'in',    category:'length' },
  { name:'Kilometres',    abbreviation:'km',    category:'length' },

  // Area
  { name:'Square Metres', abbreviation:'m²',    category:'area', description:'Tiles, paint coverage, land' },
  { name:'Square Feet',   abbreviation:'ft²',   category:'area' },
  { name:'Hectares',      abbreviation:'ha',    category:'area', description:'Land area' },
  { name:'Acres',         abbreviation:'acres', category:'area' },

  // Count
  { name:'Pieces',        abbreviation:'Pcs',   category:'count', description:'Individual items' },
  { name:'Pairs',         abbreviation:'Pairs', category:'count', description:'Boots, gloves' },
  { name:'Sets',          abbreviation:'Sets',  category:'count', description:'Complete sets' },
  { name:'Rolls',         abbreviation:'Rolls', category:'count', description:'Cable rolls, barbed wire' },
  { name:'Sheets',        abbreviation:'Sheets',category:'count', description:'Plywood, iron sheets, glass' },
  { name:'Loads',         abbreviation:'Loads', category:'count', description:'Truck loads of sand/gravel' },
  { name:'Boxes',         abbreviation:'Box',   category:'count' },
  { name:'Cartons',       abbreviation:'Ctn',   category:'count' },
  { name:'Bundles',       abbreviation:'Bdl',   category:'count', description:'Timber bundles, rebar bundles' },
  { name:'Lengths',       abbreviation:'Lgth',  category:'count', description:'Pipes/bars per standard length' },
  { name:'Packets',       abbreviation:'Pkts',  category:'count' },
  { name:'Drums',         abbreviation:'Drums', category:'count', description:'Oil/chemical drums 200L' },
  { name:'Jerricans',     abbreviation:'Jrcs',  category:'count', description:'20L jerricans' },
  { name:'Coils',         abbreviation:'Coils', category:'count', description:'Wire coils' },
  { name:'Pallets',       abbreviation:'Plts',  category:'count' },
  { name:'Units',         abbreviation:'Units', category:'count', description:'Generic single unit' },
  { name:'Numbers',       abbreviation:'No.',   category:'count' },

  // Time
  { name:'Days',          abbreviation:'Days',  category:'time', description:'Labour, equipment hire per day' },
  { name:'Hours',         abbreviation:'Hrs',   category:'time', description:'Labour, equipment hire per hour' },
  { name:'Weeks',         abbreviation:'Wks',   category:'time' },
  { name:'Months',        abbreviation:'Mths',  category:'time', description:'Long-term hire/rentals' },

  // Other
  { name:'Trips',         abbreviation:'Trips', category:'other', description:'Transport trips' },
  { name:'Lump Sum',      abbreviation:'LS',    category:'other', description:'Fixed price jobs' },
  { name:'Jobs',          abbreviation:'Jobs',  category:'other', description:'Complete job' },
];

// ════════════════════════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════════════════════════
const CATEGORIES = [
  // Construction
  { name:'Fuel & Lubricants',         description:'Diesel, petrol, engine oil, grease' },
  { name:'Cement & Concrete',         description:'Cement, concrete blocks, tofali, mortar' },
  { name:'Steel & Metal',             description:'Nondo, wire, steel bars, pipes, angles' },
  { name:'Timber & Wood',             description:'Lumber, plywood, boards, poles, hardwood' },
  { name:'Sand, Gravel & Aggregates', description:'Mchanga, kokoto, hardcore, quarry dust' },
  { name:'Roofing Materials',         description:'Iron sheets, tiles, ridge caps, nails, gutters' },
  { name:'Waterproofing',             description:'Damp proofing, bitumen, membrane, sealants' },
  { name:'Finishing Materials',       description:'Paint, plaster, tiles, adhesive, grout, screeds' },
  { name:'Glass & Glazing',           description:'Window glass, mirror, aluminium frames' },
  { name:'Doors & Windows',           description:'Doors, windows, frames, locks, hinges' },
  { name:'Formwork & Scaffolding',    description:'Plywood shuttering, props, steel forms, scaffolding' },

  // Electrical
  { name:'Electrical Cables',         description:'Power cables, conduit cables, armoured cables' },
  { name:'Electrical Fittings',       description:'Switches, sockets, plugs, connectors' },
  { name:'Electrical Panels',         description:'Distribution boards, MCBs, RCDs, meters' },
  { name:'Lighting',                  description:'LED lights, fluorescent, bulbs, fittings, street lights' },
  { name:'Generators & UPS',          description:'Diesel generators, inverters, UPS systems' },
  { name:'Solar Equipment',           description:'Solar panels, inverters, batteries, charge controllers' },
  { name:'Conduits & Trunking',       description:'PVC conduit, cable trays, trunking, junction boxes' },
  { name:'Earthing & Lightning',      description:'Earth rods, copper tape, lightning arrestors' },

  // Plumbing & Water
  { name:'Water Pipes',               description:'PVC pipes, HDPE, GI pipes, fittings' },
  { name:'Valves & Fittings',         description:'Gate valves, ball valves, reducers, elbows, tees' },
  { name:'Sanitary Ware',             description:'WC pans, cisterns, wash basins, urinals' },
  { name:'Water Pumps',               description:'Submersible pumps, surface pumps, booster pumps' },
  { name:'Water Tanks',               description:'Plastic tanks, GRP tanks, elevated tanks' },
  { name:'Water Treatment',           description:'Chlorine, filters, purification chemicals' },
  { name:'Drainage & Sewerage',       description:'Sewer pipes, manholes, septic tanks, drainage fittings' },
  { name:'Irrigation Equipment',      description:'Drip lines, sprinklers, irrigation pipes, pumps' },

  // Safety & PPE
  { name:'Head Protection',           description:'Safety helmets, hard hats, bump caps' },
  { name:'Eye & Face Protection',     description:'Safety goggles, face shields, welding masks' },
  { name:'Hand Protection',           description:'Work gloves, chemical resistant, welding gloves' },
  { name:'Foot Protection',           description:'Safety boots, gumboots, anti-static shoes' },
  { name:'Body Protection',           description:'Safety vests, coveralls, overalls, jackets' },
  { name:'Respiratory Protection',    description:'Dust masks, respirators, gas masks' },
  { name:'Fall Protection',           description:'Safety harnesses, lanyards, lifelines, anchors' },
  { name:'Safety Signage',            description:'Warning signs, barriers, cones, tape' },
  { name:'First Aid',                 description:'First aid kits, bandages, medicines, stretchers' },
  { name:'Fire Safety',               description:'Fire extinguishers, hoses, blankets, detectors' },

  // Tools & Equipment
  { name:'Hand Tools',                description:'Hammers, spanners, screwdrivers, chisels, levels' },
  { name:'Power Tools',               description:'Drills, grinders, saws, sanders, compactors' },
  { name:'Surveying Equipment',       description:'Total stations, levels, staffs, tapes, prisms' },
  { name:'Lifting Equipment',         description:'Cranes, hoists, chain blocks, slings, shackles' },
  { name:'Compaction Equipment',      description:'Plate compactors, rammers, rollers' },
  { name:'Concrete Equipment',        description:'Mixers, vibrators, pumps, block making machines' },
  { name:'Welding Equipment',         description:'Welding machines, electrodes, gas cylinders, rods' },
  { name:'Cutting Tools',             description:'Rebar cutters, pipe cutters, angle grinders, saws' },

  // Food & Kitchen
  { name:'Staple Foods',              description:'Rice, ugali flour, sugar, salt, cooking oil' },
  { name:'Bread & Bakery',            description:'Bread, biscuits, cakes, flour' },
  { name:'Beverages',                 description:'Water, juice, tea, coffee, sodas' },
  { name:'Cooking Gas',               description:'LPG gas cylinders, refills, regulators' },
  { name:'Kitchen Equipment',         description:'Cooking pots, pans, plates, utensils, fridges' },
  { name:'Cleaning Supplies',         description:'Soap, detergent, disinfectant, mops, brooms' },

  // Mechanical & Vehicles
  { name:'Vehicle Parts',             description:'Tyres, batteries, filters, brakes, spark plugs' },
  { name:'Engine Oils & Fluids',      description:'Engine oil, hydraulic oil, brake fluid, coolant' },
  { name:'Heavy Machinery Parts',     description:'Excavator, grader, bulldozer spare parts' },
  { name:'Tyres & Tubes',             description:'Vehicle and equipment tyres and tubes' },

  // Office & Stationery
  { name:'Office Stationery',         description:'Paper, pens, files, printing ink, staplers' },
  { name:'Computer & IT Equipment',   description:'Computers, printers, UPS, cables, accessories' },
  { name:'Furniture',                 description:'Desks, chairs, shelves, cabinets, tables' },
  { name:'Communication Equipment',   description:'Radios, phones, intercoms, cameras, CCTV' },

  // Medical & Lab
  { name:'Medical Supplies',          description:'Medicines, bandages, gloves, syringes, thermometers' },
  { name:'Lab Equipment',             description:'Testing equipment, soil analysis, concrete testing' },
  { name:'Surveying Chemicals',       description:'Testing reagents, pH meters, water testing kits' },

  // Landscaping & Environment
  { name:'Landscaping Materials',     description:'Soil, manure, stones, grass, plants, mulch' },
  { name:'Fencing Materials',         description:'Barbed wire, chain link, posts, gates, razor wire' },
  { name:'Environmental',             description:'Waste bags, skip bins, erosion control, geotextile' },
];

// ════════════════════════════════════════════════════════════
// PRODUCTS
// ════════════════════════════════════════════════════════════
const PRODUCTS = [
  // ── FUEL & LUBRICANTS ────────────────────────────────────
  { code:'FL-001', name:'Diesel',               category:'Fuel & Lubricants', unit:'Litres',   unitPrice:3500 },
  { code:'FL-002', name:'Petrol',               category:'Fuel & Lubricants', unit:'Litres',   unitPrice:3200 },
  { code:'FL-003', name:'Engine Oil 15W40',     category:'Fuel & Lubricants', unit:'Litres',   unitPrice:12000 },
  { code:'FL-004', name:'Hydraulic Oil',        category:'Fuel & Lubricants', unit:'Litres',   unitPrice:15000 },
  { code:'FL-005', name:'Gear Oil 90',          category:'Fuel & Lubricants', unit:'Litres',   unitPrice:14000 },
  { code:'FL-006', name:'Grease',               category:'Fuel & Lubricants', unit:'Kilograms', unitPrice:8000 },
  { code:'FL-007', name:'Brake Fluid',          category:'Fuel & Lubricants', unit:'Litres',   unitPrice:18000 },
  { code:'FL-008', name:'Coolant',              category:'Fuel & Lubricants', unit:'Litres',   unitPrice:9000 },
  { code:'FL-009', name:'Kerosene',             category:'Fuel & Lubricants', unit:'Litres',   unitPrice:2800 },
  { code:'FL-010', name:'Two Stroke Oil',       category:'Fuel & Lubricants', unit:'Litres',   unitPrice:22000 },

  // ── CEMENT & CONCRETE ────────────────────────────────────
  { code:'CC-001', name:'Cement OPC 42.5',      category:'Cement & Concrete', unit:'Bags',     unitPrice:28000 },
  { code:'CC-002', name:'Cement PPC 32.5',      category:'Cement & Concrete', unit:'Bags',     unitPrice:25000 },
  { code:'CC-003', name:'Tofali za 8 inch',     category:'Cement & Concrete', unit:'Pieces',   unitPrice:450 },
  { code:'CC-004', name:'Tofali za 6 inch',     category:'Cement & Concrete', unit:'Pieces',   unitPrice:350 },
  { code:'CC-005', name:'Tofali za 4 inch',     category:'Cement & Concrete', unit:'Pieces',   unitPrice:280 },
  { code:'CC-006', name:'Concrete Blocks 9"',   category:'Cement & Concrete', unit:'Pieces',   unitPrice:1800 },
  { code:'CC-007', name:'Paving Blocks',        category:'Cement & Concrete', unit:'Pieces',   unitPrice:650 },
  { code:'CC-008', name:'Precast Culvert 600mm',category:'Cement & Concrete', unit:'Pieces',   unitPrice:85000 },
  { code:'CC-009', name:'Mortar Mix',           category:'Cement & Concrete', unit:'Bags',     unitPrice:18000 },
  { code:'CC-010', name:'Concrete Admixture',   category:'Cement & Concrete', unit:'Litres',   unitPrice:25000 },

  // ── STEEL & METAL ────────────────────────────────────────
  { code:'SM-001', name:'Nondo mm6',            category:'Steel & Metal',     unit:'Tonnes',   unitPrice:1050000 },
  { code:'SM-002', name:'Nondo mm8',            category:'Steel & Metal',     unit:'Tonnes',   unitPrice:1100000 },
  { code:'SM-003', name:'Nondo mm10',           category:'Steel & Metal',     unit:'Tonnes',   unitPrice:1150000 },
  { code:'SM-004', name:'Nondo mm12',           category:'Steel & Metal',     unit:'Tonnes',   unitPrice:1200000 },
  { code:'SM-005', name:'Nondo mm16',           category:'Steel & Metal',     unit:'Tonnes',   unitPrice:1250000 },
  { code:'SM-006', name:'Nondo mm20',           category:'Steel & Metal',     unit:'Tonnes',   unitPrice:1300000 },
  { code:'SM-007', name:'Nondo mm25',           category:'Steel & Metal',     unit:'Tonnes',   unitPrice:1350000 },
  { code:'SM-008', name:'Nondo mm32',           category:'Steel & Metal',     unit:'Tonnes',   unitPrice:1400000 },
  { code:'SM-009', name:'Binding Wire',         category:'Steel & Metal',     unit:'Kilograms', unitPrice:8000 },
  { code:'SM-010', name:'BRC Mesh A142',        category:'Steel & Metal',     unit:'Sheets',   unitPrice:85000 },
  { code:'SM-011', name:'BRC Mesh A193',        category:'Steel & Metal',     unit:'Sheets',   unitPrice:110000 },
  { code:'SM-012', name:'Mild Steel Flat Bar',  category:'Steel & Metal',     unit:'Tonnes',   unitPrice:1400000 },
  { code:'SM-013', name:'Steel Angle 50x50x5',  category:'Steel & Metal',     unit:'Lengths',  unitPrice:85000 },
  { code:'SM-014', name:'Steel Channel 100x50', category:'Steel & Metal',     unit:'Lengths',  unitPrice:150000 },
  { code:'SM-015', name:'Steel I-Beam 200',     category:'Steel & Metal',     unit:'Lengths',  unitPrice:450000 },
  { code:'SM-016', name:'MS Pipe 2"',           category:'Steel & Metal',     unit:'Lengths',  unitPrice:45000 },
  { code:'SM-017', name:'MS Pipe 4"',           category:'Steel & Metal',     unit:'Lengths',  unitPrice:90000 },
  { code:'SM-018', name:'GI Sheet 0.5mm',       category:'Steel & Metal',     unit:'Sheets',   unitPrice:35000 },
  { code:'SM-019', name:'Nails 4"',             category:'Steel & Metal',     unit:'Kilograms', unitPrice:4500 },
  { code:'SM-020', name:'Nails 3"',             category:'Steel & Metal',     unit:'Kilograms', unitPrice:4200 },
  { code:'SM-021', name:'Nails 2"',             category:'Steel & Metal',     unit:'Kilograms', unitPrice:4000 },
  { code:'SM-022', name:'Bolts & Nuts M12',     category:'Steel & Metal',     unit:'Pieces',   unitPrice:800 },
  { code:'SM-023', name:'Bolts & Nuts M16',     category:'Steel & Metal',     unit:'Pieces',   unitPrice:1200 },
  { code:'SM-024', name:'Welded Mesh 50x50',    category:'Steel & Metal',     unit:'Rolls',    unitPrice:280000 },

  // ── TIMBER & WOOD ────────────────────────────────────────
  { code:'TW-001', name:'Plywood 18mm (4x8)',   category:'Timber & Wood',     unit:'Sheets',   unitPrice:95000 },
  { code:'TW-002', name:'Plywood 12mm (4x8)',   category:'Timber & Wood',     unit:'Sheets',   unitPrice:72000 },
  { code:'TW-003', name:'Plywood 9mm (4x8)',    category:'Timber & Wood',     unit:'Sheets',   unitPrice:55000 },
  { code:'TW-004', name:'Timber 2"x4"',         category:'Timber & Wood',     unit:'Lengths',  unitPrice:12000 },
  { code:'TW-005', name:'Timber 3"x6"',         category:'Timber & Wood',     unit:'Lengths',  unitPrice:22000 },
  { code:'TW-006', name:'Hardwood Timber',      category:'Timber & Wood',     unit:'Cubic Metres', unitPrice:450000 },
  { code:'TW-007', name:'Eucalyptus Poles 3m',  category:'Timber & Wood',     unit:'Pieces',   unitPrice:8000 },
  { code:'TW-008', name:'Eucalyptus Poles 5m',  category:'Timber & Wood',     unit:'Pieces',   unitPrice:15000 },
  { code:'TW-009', name:'Particle Board 18mm',  category:'Timber & Wood',     unit:'Sheets',   unitPrice:65000 },
  { code:'TW-010', name:'MDF Board 18mm',       category:'Timber & Wood',     unit:'Sheets',   unitPrice:80000 },

  // ── SAND, GRAVEL & AGGREGATES ────────────────────────────
  { code:'SG-001', name:'Mchanga (River Sand)', category:'Sand, Gravel & Aggregates', unit:'Loads', unitPrice:180000 },
  { code:'SG-002', name:'Mchanga (Pit Sand)',   category:'Sand, Gravel & Aggregates', unit:'Loads', unitPrice:150000 },
  { code:'SG-003', name:'Kokoto 20mm',          category:'Sand, Gravel & Aggregates', unit:'Loads', unitPrice:250000 },
  { code:'SG-004', name:'Kokoto 40mm',          category:'Sand, Gravel & Aggregates', unit:'Loads', unitPrice:220000 },
  { code:'SG-005', name:'Hardcore',             category:'Sand, Gravel & Aggregates', unit:'Loads', unitPrice:200000 },
  { code:'SG-006', name:'Quarry Dust',          category:'Sand, Gravel & Aggregates', unit:'Loads', unitPrice:160000 },
  { code:'SG-007', name:'Ballast',              category:'Sand, Gravel & Aggregates', unit:'Loads', unitPrice:230000 },
  { code:'SG-008', name:'Murram',               category:'Sand, Gravel & Aggregates', unit:'Loads', unitPrice:120000 },
  { code:'SG-009', name:'Gravel Fill',          category:'Sand, Gravel & Aggregates', unit:'Cubic Metres', unitPrice:90000 },

  // ── ROOFING MATERIALS ────────────────────────────────────
  { code:'RM-001', name:'Mabati 26G (3m)',      category:'Roofing Materials', unit:'Sheets',   unitPrice:45000 },
  { code:'RM-002', name:'Mabati 28G (3m)',      category:'Roofing Materials', unit:'Sheets',   unitPrice:38000 },
  { code:'RM-003', name:'Mabati 30G (2.5m)',    category:'Roofing Materials', unit:'Sheets',   unitPrice:28000 },
  { code:'RM-004', name:'Ridge Cap',            category:'Roofing Materials', unit:'Lengths',  unitPrice:15000 },
  { code:'RM-005', name:'Roof Tile (Terracotta)',category:'Roofing Materials', unit:'Pieces',  unitPrice:1800 },
  { code:'RM-006', name:'Roofing Nails',        category:'Roofing Materials', unit:'Kilograms', unitPrice:5500 },
  { code:'RM-007', name:'Plastic Gutters 4"',   category:'Roofing Materials', unit:'Lengths',  unitPrice:18000 },
  { code:'RM-008', name:'Down Pipes 3"',        category:'Roofing Materials', unit:'Lengths',  unitPrice:12000 },
  { code:'RM-009', name:'Bitumen Felt',         category:'Roofing Materials', unit:'Rolls',    unitPrice:45000 },
  { code:'RM-010', name:'Polycarbonate Sheet',  category:'Roofing Materials', unit:'Sheets',   unitPrice:120000 },

  // ── WATERPROOFING ────────────────────────────────────────
  { code:'WP-001', name:'Bitumen Paint',        category:'Waterproofing',     unit:'Litres',   unitPrice:8000 },
  { code:'WP-002', name:'Waterproof Membrane',  category:'Waterproofing',     unit:'Rolls',    unitPrice:185000 },
  { code:'WP-003', name:'Crystalline Waterproof',category:'Waterproofing',    unit:'Kilograms', unitPrice:22000 },
  { code:'WP-004', name:'DPC Sheet',            category:'Waterproofing',     unit:'Metres',   unitPrice:3500 },
  { code:'WP-005', name:'Sika Waterproof Compound',category:'Waterproofing', unit:'Kilograms', unitPrice:18000 },
  { code:'WP-006', name:'Silicone Sealant',     category:'Waterproofing',     unit:'Pieces',   unitPrice:8500 },

  // ── FINISHING MATERIALS ──────────────────────────────────
  { code:'FM-001', name:'Paint Emulsion (White)',category:'Finishing Materials', unit:'Litres', unitPrice:9000 },
  { code:'FM-002', name:'Paint Gloss (White)',  category:'Finishing Materials', unit:'Litres',  unitPrice:12000 },
  { code:'FM-003', name:'Paint Exterior',       category:'Finishing Materials', unit:'Litres',  unitPrice:15000 },
  { code:'FM-004', name:'Primer Undercoat',     category:'Finishing Materials', unit:'Litres',  unitPrice:8000 },
  { code:'FM-005', name:'Floor Tiles 30x30',    category:'Finishing Materials', unit:'Pieces',  unitPrice:2500 },
  { code:'FM-006', name:'Floor Tiles 60x60',    category:'Finishing Materials', unit:'Pieces',  unitPrice:8500 },
  { code:'FM-007', name:'Wall Tiles 20x30',     category:'Finishing Materials', unit:'Pieces',  unitPrice:3500 },
  { code:'FM-008', name:'Tile Adhesive',        category:'Finishing Materials', unit:'Bags',    unitPrice:22000 },
  { code:'FM-009', name:'Tile Grout',           category:'Finishing Materials', unit:'Kilograms',unitPrice:5000 },
  { code:'FM-010', name:'Gypsum Plaster',       category:'Finishing Materials', unit:'Bags',    unitPrice:18000 },
  { code:'FM-011', name:'Marble Tiles',         category:'Finishing Materials', unit:'Square Metres', unitPrice:85000 },
  { code:'FM-012', name:'Skirting Tiles',       category:'Finishing Materials', unit:'Metres',  unitPrice:4500 },
  { code:'FM-013', name:'Paint Brush 4"',       category:'Finishing Materials', unit:'Pieces',  unitPrice:3500 },
  { code:'FM-014', name:'Paint Roller',         category:'Finishing Materials', unit:'Pieces',  unitPrice:5000 },
  { code:'FM-015', name:'Sandpaper 120 grit',   category:'Finishing Materials', unit:'Pieces',  unitPrice:800 },

  // ── ELECTRICAL CABLES ────────────────────────────────────
  { code:'EC-001', name:'Cable 1.5mm2 Twin+E', category:'Electrical Cables',  unit:'Metres',   unitPrice:1800 },
  { code:'EC-002', name:'Cable 2.5mm2 Twin+E', category:'Electrical Cables',  unit:'Metres',   unitPrice:2800 },
  { code:'EC-003', name:'Cable 4mm2 Twin+E',   category:'Electrical Cables',  unit:'Metres',   unitPrice:4200 },
  { code:'EC-004', name:'Cable 6mm2 Twin+E',   category:'Electrical Cables',  unit:'Metres',   unitPrice:6500 },
  { code:'EC-005', name:'Cable 10mm2 3-core',  category:'Electrical Cables',  unit:'Metres',   unitPrice:12000 },
  { code:'EC-006', name:'Cable 16mm2 4-core',  category:'Electrical Cables',  unit:'Metres',   unitPrice:22000 },
  { code:'EC-007', name:'Armoured Cable 25mm2',category:'Electrical Cables',  unit:'Metres',   unitPrice:35000 },
  { code:'EC-008', name:'Flexible Cable 1.5mm',category:'Electrical Cables',  unit:'Metres',   unitPrice:1500 },
  { code:'EC-009', name:'Earth Cable 16mm2',   category:'Electrical Cables',  unit:'Metres',   unitPrice:8000 },
  { code:'EC-010', name:'Cat6 LAN Cable',      category:'Electrical Cables',  unit:'Metres',   unitPrice:2500 },

  // ── ELECTRICAL FITTINGS ──────────────────────────────────
  { code:'EF-001', name:'Switch Single Way',   category:'Electrical Fittings', unit:'Pieces',  unitPrice:4500 },
  { code:'EF-002', name:'Switch Two Way',      category:'Electrical Fittings', unit:'Pieces',  unitPrice:6500 },
  { code:'EF-003', name:'Socket 13A',          category:'Electrical Fittings', unit:'Pieces',  unitPrice:5500 },
  { code:'EF-004', name:'Socket 15A (Round)',  category:'Electrical Fittings', unit:'Pieces',  unitPrice:6000 },
  { code:'EF-005', name:'Junction Box',        category:'Electrical Fittings', unit:'Pieces',  unitPrice:3500 },
  { code:'EF-006', name:'Cable Clips',         category:'Electrical Fittings', unit:'Packets', unitPrice:2500 },
  { code:'EF-007', name:'Electrical Tape',     category:'Electrical Fittings', unit:'Pieces',  unitPrice:2000 },
  { code:'EF-008', name:'Wire Connectors',     category:'Electrical Fittings', unit:'Packets', unitPrice:3000 },
  { code:'EF-009', name:'RCBO 20A',            category:'Electrical Fittings', unit:'Pieces',  unitPrice:45000 },
  { code:'EF-010', name:'MCB 16A',             category:'Electrical Fittings', unit:'Pieces',  unitPrice:12000 },
  { code:'EF-011', name:'Earth Leakage 63A',   category:'Electrical Fittings', unit:'Pieces',  unitPrice:85000 },

  // ── LIGHTING ─────────────────────────────────────────────
  { code:'LT-001', name:'LED Bulb 9W E27',     category:'Lighting',           unit:'Pieces',   unitPrice:5000 },
  { code:'LT-002', name:'LED Tube 18W 4ft',    category:'Lighting',           unit:'Pieces',   unitPrice:12000 },
  { code:'LT-003', name:'LED Downlight 12W',   category:'Lighting',           unit:'Pieces',   unitPrice:18000 },
  { code:'LT-004', name:'Street Light 60W LED',category:'Lighting',           unit:'Pieces',   unitPrice:185000 },
  { code:'LT-005', name:'Flood Light 100W',    category:'Lighting',           unit:'Pieces',   unitPrice:95000 },
  { code:'LT-006', name:'Emergency Light',     category:'Lighting',           unit:'Pieces',   unitPrice:45000 },
  { code:'LT-007', name:'Batten Fitting 4ft',  category:'Lighting',           unit:'Pieces',   unitPrice:15000 },

  // ── CONDUITS & TRUNKING ──────────────────────────────────
  { code:'CT-001', name:'PVC Conduit 20mm',    category:'Conduits & Trunking', unit:'Lengths',  unitPrice:4500 },
  { code:'CT-002', name:'PVC Conduit 25mm',    category:'Conduits & Trunking', unit:'Lengths',  unitPrice:6000 },
  { code:'CT-003', name:'PVC Conduit 32mm',    category:'Conduits & Trunking', unit:'Lengths',  unitPrice:8500 },
  { code:'CT-004', name:'Metal Conduit 20mm',  category:'Conduits & Trunking', unit:'Lengths',  unitPrice:12000 },
  { code:'CT-005', name:'Cable Tray 100mm',    category:'Conduits & Trunking', unit:'Metres',   unitPrice:25000 },
  { code:'CT-006', name:'Cable Trunking 40x25',category:'Conduits & Trunking', unit:'Metres',   unitPrice:8500 },

  // ── WATER PIPES ──────────────────────────────────────────
  { code:'WP-101', name:'PVC Pipe 1/2"',       category:'Water Pipes',        unit:'Lengths',  unitPrice:5500 },
  { code:'WP-102', name:'PVC Pipe 3/4"',       category:'Water Pipes',        unit:'Lengths',  unitPrice:7500 },
  { code:'WP-103', name:'PVC Pipe 1"',         category:'Water Pipes',        unit:'Lengths',  unitPrice:10000 },
  { code:'WP-104', name:'PVC Pipe 1.5"',       category:'Water Pipes',        unit:'Lengths',  unitPrice:15000 },
  { code:'WP-105', name:'PVC Pipe 2"',         category:'Water Pipes',        unit:'Lengths',  unitPrice:22000 },
  { code:'WP-106', name:'PVC Pipe 3"',         category:'Water Pipes',        unit:'Lengths',  unitPrice:38000 },
  { code:'WP-107', name:'PVC Pipe 4"',         category:'Water Pipes',        unit:'Lengths',  unitPrice:55000 },
  { code:'WP-108', name:'HDPE Pipe 32mm',      category:'Water Pipes',        unit:'Metres',   unitPrice:4500 },
  { code:'WP-109', name:'HDPE Pipe 50mm',      category:'Water Pipes',        unit:'Metres',   unitPrice:8500 },
  { code:'WP-110', name:'HDPE Pipe 63mm',      category:'Water Pipes',        unit:'Metres',   unitPrice:12000 },
  { code:'WP-111', name:'HDPE Pipe 90mm',      category:'Water Pipes',        unit:'Metres',   unitPrice:18000 },
  { code:'WP-112', name:'GI Pipe 1"',          category:'Water Pipes',        unit:'Lengths',  unitPrice:35000 },
  { code:'WP-113', name:'GI Pipe 2"',          category:'Water Pipes',        unit:'Lengths',  unitPrice:65000 },

  // ── VALVES & FITTINGS ────────────────────────────────────
  { code:'VF-001', name:'Ball Valve 1/2"',     category:'Valves & Fittings',  unit:'Pieces',   unitPrice:8500 },
  { code:'VF-002', name:'Ball Valve 1"',       category:'Valves & Fittings',  unit:'Pieces',   unitPrice:15000 },
  { code:'VF-003', name:'Gate Valve 2"',       category:'Valves & Fittings',  unit:'Pieces',   unitPrice:45000 },
  { code:'VF-004', name:'Gate Valve 4"',       category:'Valves & Fittings',  unit:'Pieces',   unitPrice:120000 },
  { code:'VF-005', name:'Check Valve 1"',      category:'Valves & Fittings',  unit:'Pieces',   unitPrice:18000 },
  { code:'VF-006', name:'Pressure Reducing Valve', category:'Valves & Fittings', unit:'Pieces', unitPrice:55000 },
  { code:'VF-007', name:'Elbow 90° 1/2"',      category:'Valves & Fittings',  unit:'Pieces',   unitPrice:1200 },
  { code:'VF-008', name:'Tee 1/2"',            category:'Valves & Fittings',  unit:'Pieces',   unitPrice:1500 },
  { code:'VF-009', name:'Reducer 1" to 1/2"',  category:'Valves & Fittings',  unit:'Pieces',   unitPrice:2000 },
  { code:'VF-010', name:'Float Valve 1/2"',    category:'Valves & Fittings',  unit:'Pieces',   unitPrice:12000 },
  { code:'VF-011', name:'Water Meter 1"',      category:'Valves & Fittings',  unit:'Pieces',   unitPrice:85000 },

  // ── SANITARY WARE ────────────────────────────────────────
  { code:'SW-001', name:'WC Pan Close Coupled',category:'Sanitary Ware',     unit:'Pieces',    unitPrice:185000 },
  { code:'SW-002', name:'Wash Basin 550mm',    category:'Sanitary Ware',     unit:'Pieces',    unitPrice:85000 },
  { code:'SW-003', name:'Shower Tray 800mm',   category:'Sanitary Ware',     unit:'Pieces',    unitPrice:120000 },
  { code:'SW-004', name:'Kitchen Sink SS',     category:'Sanitary Ware',     unit:'Pieces',    unitPrice:95000 },
  { code:'SW-005', name:'Urinal',              category:'Sanitary Ware',     unit:'Pieces',    unitPrice:85000 },
  { code:'SW-006', name:'Tap Mixer Basin',     category:'Sanitary Ware',     unit:'Pieces',    unitPrice:45000 },
  { code:'SW-007', name:'Shower Head',         category:'Sanitary Ware',     unit:'Pieces',    unitPrice:35000 },
  { code:'SW-008', name:'Bathtub 1700mm',      category:'Sanitary Ware',     unit:'Pieces',    unitPrice:350000 },

  // ── WATER TANKS ──────────────────────────────────────────
  { code:'WT-001', name:'Plastic Tank 500L',   category:'Water Tanks',       unit:'Pieces',    unitPrice:85000 },
  { code:'WT-002', name:'Plastic Tank 1000L',  category:'Water Tanks',       unit:'Pieces',    unitPrice:150000 },
  { code:'WT-003', name:'Plastic Tank 2000L',  category:'Water Tanks',       unit:'Pieces',    unitPrice:280000 },
  { code:'WT-004', name:'Plastic Tank 5000L',  category:'Water Tanks',       unit:'Pieces',    unitPrice:650000 },
  { code:'WT-005', name:'GRP Tank 10000L',     category:'Water Tanks',       unit:'Pieces',    unitPrice:1800000 },
  { code:'WT-006', name:'Ferrocement Tank 5000L',category:'Water Tanks',     unit:'Pieces',    unitPrice:550000 },

  // ── WATER PUMPS ──────────────────────────────────────────
  { code:'PM-001', name:'Submersible Pump 0.5HP', category:'Water Pumps',    unit:'Pieces',    unitPrice:350000 },
  { code:'PM-002', name:'Submersible Pump 1HP',   category:'Water Pumps',    unit:'Pieces',    unitPrice:550000 },
  { code:'PM-003', name:'Surface Pump 1HP',       category:'Water Pumps',    unit:'Pieces',    unitPrice:280000 },
  { code:'PM-004', name:'Booster Pump 0.75HP',    category:'Water Pumps',    unit:'Pieces',    unitPrice:380000 },
  { code:'PM-005', name:'Solar Pump 1HP',         category:'Water Pumps',    unit:'Pieces',    unitPrice:850000 },

  // ── HEAD PROTECTION ──────────────────────────────────────
  { code:'HP-001', name:'Safety Helmet White',  category:'Head Protection',  unit:'Pieces',    unitPrice:15000 },
  { code:'HP-002', name:'Safety Helmet Yellow', category:'Head Protection',  unit:'Pieces',    unitPrice:15000 },
  { code:'HP-003', name:'Safety Helmet Orange', category:'Head Protection',  unit:'Pieces',    unitPrice:15000 },
  { code:'HP-004', name:'Hard Hat 6-point',     category:'Head Protection',  unit:'Pieces',    unitPrice:22000 },

  // ── HAND PROTECTION ──────────────────────────────────────
  { code:'GP-001', name:'Cotton Work Gloves',   category:'Hand Protection',  unit:'Pairs',     unitPrice:3500 },
  { code:'GP-002', name:'Leather Work Gloves',  category:'Hand Protection',  unit:'Pairs',     unitPrice:8500 },
  { code:'GP-003', name:'Nitrile Gloves',       category:'Hand Protection',  unit:'Boxes',     unitPrice:18000 },
  { code:'GP-004', name:'Welding Gloves',       category:'Hand Protection',  unit:'Pairs',     unitPrice:12000 },
  { code:'GP-005', name:'Chemical Resistant Gloves', category:'Hand Protection', unit:'Pairs', unitPrice:15000 },

  // ── FOOT PROTECTION ──────────────────────────────────────
  { code:'FP-001', name:'Safety Boots Steel Toe', category:'Foot Protection', unit:'Pairs',   unitPrice:55000 },
  { code:'FP-002', name:'Gumboots',               category:'Foot Protection', unit:'Pairs',   unitPrice:25000 },
  { code:'FP-003', name:'Anti-static Shoes',      category:'Foot Protection', unit:'Pairs',   unitPrice:65000 },

  // ── BODY PROTECTION ──────────────────────────────────────
  { code:'BP-001', name:'Hi-Vis Safety Vest',    category:'Body Protection',  unit:'Pieces',  unitPrice:12000 },
  { code:'BP-002', name:'Coveralls (Overall)',   category:'Body Protection',  unit:'Pieces',  unitPrice:35000 },
  { code:'BP-003', name:'Safety Jacket Orange',  category:'Body Protection',  unit:'Pieces',  unitPrice:45000 },
  { code:'BP-004', name:'Apron Rubber',          category:'Body Protection',  unit:'Pieces',  unitPrice:18000 },
  { code:'BP-005', name:'Welding Apron Leather', category:'Body Protection',  unit:'Pieces',  unitPrice:35000 },

  // ── RESPIRATORY ──────────────────────────────────────────
  { code:'RP-001', name:'Dust Mask N95',         category:'Respiratory Protection', unit:'Pieces', unitPrice:3500 },
  { code:'RP-002', name:'Half Face Respirator',  category:'Respiratory Protection', unit:'Pieces', unitPrice:45000 },
  { code:'RP-003', name:'Full Face Mask',        category:'Respiratory Protection', unit:'Pieces', unitPrice:120000 },
  { code:'RP-004', name:'Dust Mask Disposable',  category:'Respiratory Protection', unit:'Boxes',  unitPrice:22000 },

  // ── FALL PROTECTION ──────────────────────────────────────
  { code:'FL-101', name:'Safety Harness Full Body', category:'Fall Protection', unit:'Pieces', unitPrice:85000 },
  { code:'FL-102', name:'Lanyard 1.8m',             category:'Fall Protection', unit:'Pieces', unitPrice:35000 },
  { code:'FL-103', name:'Safety Net',               category:'Fall Protection', unit:'Sets',   unitPrice:250000 },

  // ── FIRE SAFETY ──────────────────────────────────────────
  { code:'FS-001', name:'Fire Extinguisher 2Kg CO2', category:'Fire Safety', unit:'Pieces',   unitPrice:85000 },
  { code:'FS-002', name:'Fire Extinguisher 9L Water',category:'Fire Safety', unit:'Pieces',   unitPrice:75000 },
  { code:'FS-003', name:'Fire Hose 30m',             category:'Fire Safety', unit:'Pieces',   unitPrice:350000 },
  { code:'FS-004', name:'Fire Blanket',              category:'Fire Safety', unit:'Pieces',   unitPrice:45000 },
  { code:'FS-005', name:'Smoke Detector',            category:'Fire Safety', unit:'Pieces',   unitPrice:35000 },

  // ── SAFETY SIGNAGE ───────────────────────────────────────
  { code:'SS-001', name:'Traffic Cones 750mm',   category:'Safety Signage',   unit:'Pieces',  unitPrice:12000 },
  { code:'SS-002', name:'Caution Tape 500m',     category:'Safety Signage',   unit:'Rolls',   unitPrice:8500 },
  { code:'SS-003', name:'Safety Sign Board',     category:'Safety Signage',   unit:'Pieces',  unitPrice:15000 },
  { code:'SS-004', name:'Road Barrier',          category:'Safety Signage',   unit:'Pieces',  unitPrice:85000 },

  // ── HAND TOOLS ───────────────────────────────────────────
  { code:'HT-001', name:'Hammer 1Kg',            category:'Hand Tools',       unit:'Pieces',  unitPrice:12000 },
  { code:'HT-002', name:'Spade Shovel',          category:'Hand Tools',       unit:'Pieces',  unitPrice:18000 },
  { code:'HT-003', name:'Pickaxe',               category:'Hand Tools',       unit:'Pieces',  unitPrice:22000 },
  { code:'HT-004', name:'Wheelbarrow',           category:'Hand Tools',       unit:'Pieces',  unitPrice:85000 },
  { code:'HT-005', name:'Spirit Level 1200mm',   category:'Hand Tools',       unit:'Pieces',  unitPrice:35000 },
  { code:'HT-006', name:'Tape Measure 50m',      category:'Hand Tools',       unit:'Pieces',  unitPrice:25000 },
  { code:'HT-007', name:'Spanner Set',           category:'Hand Tools',       unit:'Sets',    unitPrice:65000 },
  { code:'HT-008', name:'Screwdriver Set',       category:'Hand Tools',       unit:'Sets',    unitPrice:35000 },
  { code:'HT-009', name:'Pliers Set',            category:'Hand Tools',       unit:'Sets',    unitPrice:45000 },
  { code:'HT-010', name:'Bolster Chisel',        category:'Hand Tools',       unit:'Pieces',  unitPrice:8500 },
  { code:'HT-011', name:'Trowel Mason 12"',      category:'Hand Tools',       unit:'Pieces',  unitPrice:8000 },
  { code:'HT-012', name:'Hacksaw Frame',         category:'Hand Tools',       unit:'Pieces',  unitPrice:12000 },
  { code:'HT-013', name:'Hacksaw Blades',        category:'Hand Tools',       unit:'Pieces',  unitPrice:2500 },
  { code:'HT-014', name:'Wire Cutters',          category:'Hand Tools',       unit:'Pieces',  unitPrice:15000 },
  { code:'HT-015', name:'Pipe Wrench 14"',       category:'Hand Tools',       unit:'Pieces',  unitPrice:25000 },
  { code:'HT-016', name:'Crow Bar 1.2m',         category:'Hand Tools',       unit:'Pieces',  unitPrice:18000 },
  { code:'HT-017', name:'Hoe (Jembe)',           category:'Hand Tools',       unit:'Pieces',  unitPrice:15000 },

  // ── POWER TOOLS ──────────────────────────────────────────
  { code:'PT-001', name:'Angle Grinder 4.5"',    category:'Power Tools',      unit:'Pieces',  unitPrice:120000 },
  { code:'PT-002', name:'Electric Drill',        category:'Power Tools',      unit:'Pieces',  unitPrice:145000 },
  { code:'PT-003', name:'Circular Saw',          category:'Power Tools',      unit:'Pieces',  unitPrice:280000 },
  { code:'PT-004', name:'Jigsaw',                category:'Power Tools',      unit:'Pieces',  unitPrice:180000 },
  { code:'PT-005', name:'Plate Compactor',       category:'Power Tools',      unit:'Pieces',  unitPrice:1850000 },
  { code:'PT-006', name:'Rammer Compactor',      category:'Power Tools',      unit:'Pieces',  unitPrice:1200000 },
  { code:'PT-007', name:'Grinder Discs',         category:'Power Tools',      unit:'Pieces',  unitPrice:3500 },
  { code:'PT-008', name:'Drill Bits Set',        category:'Power Tools',      unit:'Sets',    unitPrice:45000 },
  { code:'PT-009', name:'Chain Saw',             category:'Power Tools',      unit:'Pieces',  unitPrice:850000 },

  // ── CONCRETE EQUIPMENT ───────────────────────────────────
  { code:'CE-001', name:'Concrete Mixer 0.5m³', category:'Concrete Equipment', unit:'Pieces', unitPrice:2500000 },
  { code:'CE-002', name:'Concrete Vibrator',    category:'Concrete Equipment', unit:'Pieces', unitPrice:850000 },
  { code:'CE-003', name:'Concrete Cube Moulds', category:'Concrete Equipment', unit:'Sets',   unitPrice:85000 },

  // ── WELDING EQUIPMENT ────────────────────────────────────
  { code:'WE-001', name:'Welding Machine 250A', category:'Welding Equipment', unit:'Pieces',  unitPrice:850000 },
  { code:'WE-002', name:'Welding Electrodes E6013', category:'Welding Equipment', unit:'Kilograms', unitPrice:9500 },
  { code:'WE-003', name:'Oxygen Cylinder',      category:'Welding Equipment', unit:'Pieces',  unitPrice:180000 },
  { code:'WE-004', name:'Acetylene Cylinder',   category:'Welding Equipment', unit:'Pieces',  unitPrice:220000 },
  { code:'WE-005', name:'MIG Wire 0.8mm',       category:'Welding Equipment', unit:'Rolls',   unitPrice:85000 },

  // ── GENERATORS ───────────────────────────────────────────
  { code:'GN-001', name:'Generator 5KVA Diesel', category:'Generators & UPS',unit:'Pieces',   unitPrice:2800000 },
  { code:'GN-002', name:'Generator 10KVA Diesel',category:'Generators & UPS',unit:'Pieces',   unitPrice:5500000 },
  { code:'GN-003', name:'Generator 20KVA',       category:'Generators & UPS',unit:'Pieces',   unitPrice:9500000 },
  { code:'GN-004', name:'UPS 1KVA',              category:'Generators & UPS',unit:'Pieces',   unitPrice:350000 },
  { code:'GN-005', name:'Inverter 1500W',        category:'Generators & UPS',unit:'Pieces',   unitPrice:450000 },

  // ── SOLAR EQUIPMENT ──────────────────────────────────────
  { code:'SOL-001', name:'Solar Panel 250W',    category:'Solar Equipment',  unit:'Pieces',   unitPrice:250000 },
  { code:'SOL-002', name:'Solar Panel 350W',    category:'Solar Equipment',  unit:'Pieces',   unitPrice:350000 },
  { code:'SOL-003', name:'Solar Battery 200AH', category:'Solar Equipment',  unit:'Pieces',   unitPrice:550000 },
  { code:'SOL-004', name:'Solar Inverter 3KW',  category:'Solar Equipment',  unit:'Pieces',   unitPrice:850000 },
  { code:'SOL-005', name:'Charge Controller MPPT', category:'Solar Equipment', unit:'Pieces', unitPrice:185000 },
  { code:'SOL-006', name:'Solar Cable 6mm2',    category:'Solar Equipment',  unit:'Metres',   unitPrice:3500 },

  // ── FOOD & KITCHEN ───────────────────────────────────────
  { code:'FD-001', name:'Rice (Mbeya/Kilombero)', category:'Staple Foods',  unit:'Kilograms',  unitPrice:2500 },
  { code:'FD-002', name:'Unga wa Ugali',          category:'Staple Foods',  unit:'Kilograms',  unitPrice:1800 },
  { code:'FD-003', name:'Sugar',                  category:'Staple Foods',  unit:'Kilograms',  unitPrice:2800 },
  { code:'FD-004', name:'Salt',                   category:'Staple Foods',  unit:'Kilograms',  unitPrice:800 },
  { code:'FD-005', name:'Cooking Oil',            category:'Staple Foods',  unit:'Litres',     unitPrice:4500 },
  { code:'FD-006', name:'Beans',                  category:'Staple Foods',  unit:'Kilograms',  unitPrice:3200 },
  { code:'FD-007', name:'Maize Flour',            category:'Staple Foods',  unit:'Kilograms',  unitPrice:1500 },
  { code:'FD-008', name:'Tea Leaves',             category:'Beverages',     unit:'Kilograms',  unitPrice:8500 },
  { code:'FD-009', name:'Coffee',                 category:'Beverages',     unit:'Kilograms',  unitPrice:18000 },
  { code:'FD-010', name:'Drinking Water 20L',     category:'Beverages',     unit:'Pieces',     unitPrice:5000 },
  { code:'FD-011', name:'LPG Gas Cylinder 6Kg',   category:'Cooking Gas',   unit:'Pieces',     unitPrice:45000 },
  { code:'FD-012', name:'LPG Gas Refill 6Kg',     category:'Cooking Gas',   unit:'Pieces',     unitPrice:28000 },
  { code:'FD-013', name:'LPG Gas Refill 13Kg',    category:'Cooking Gas',   unit:'Pieces',     unitPrice:55000 },
  { code:'FD-014', name:'Gas Regulator',          category:'Cooking Gas',   unit:'Pieces',     unitPrice:15000 },

  // ── CLEANING SUPPLIES ────────────────────────────────────
  { code:'CL-001', name:'Soap Bar (Jamaa)',       category:'Cleaning Supplies', unit:'Pieces', unitPrice:1500 },
  { code:'CL-002', name:'Detergent OMO 1Kg',     category:'Cleaning Supplies', unit:'Pieces', unitPrice:5500 },
  { code:'CL-003', name:'Bleach (Sodium Hypochlorite)', category:'Cleaning Supplies', unit:'Litres', unitPrice:3500 },
  { code:'CL-004', name:'Disinfectant Dettol',   category:'Cleaning Supplies', unit:'Litres', unitPrice:12000 },
  { code:'CL-005', name:'Broom',                 category:'Cleaning Supplies', unit:'Pieces', unitPrice:8000 },
  { code:'CL-006', name:'Mop & Bucket',          category:'Cleaning Supplies', unit:'Sets',   unitPrice:25000 },
  { code:'CL-007', name:'Dustbin 120L',          category:'Cleaning Supplies', unit:'Pieces', unitPrice:35000 },

  // ── VEHICLE PARTS ────────────────────────────────────────
  { code:'VP-001', name:'Engine Oil Filter',     category:'Vehicle Parts',    unit:'Pieces',  unitPrice:15000 },
  { code:'VP-002', name:'Air Filter',            category:'Vehicle Parts',    unit:'Pieces',  unitPrice:25000 },
  { code:'VP-003', name:'Fuel Filter',           category:'Vehicle Parts',    unit:'Pieces',  unitPrice:18000 },
  { code:'VP-004', name:'Spark Plugs',           category:'Vehicle Parts',    unit:'Pieces',  unitPrice:8500 },
  { code:'VP-005', name:'Car Battery 12V 100AH', category:'Vehicle Parts',   unit:'Pieces',  unitPrice:280000 },
  { code:'VP-006', name:'Brake Pads Set',        category:'Vehicle Parts',    unit:'Sets',    unitPrice:85000 },
  { code:'VP-007', name:'Tyre 7.50R16',          category:'Tyres & Tubes',   unit:'Pieces',  unitPrice:350000 },
  { code:'VP-008', name:'Tyre 11R22.5',          category:'Tyres & Tubes',   unit:'Pieces',  unitPrice:750000 },
  { code:'VP-009', name:'Tube 7.50R16',          category:'Tyres & Tubes',   unit:'Pieces',  unitPrice:85000 },

  // ── OFFICE STATIONERY ────────────────────────────────────
  { code:'OS-001', name:'A4 Paper 80gsm (Ream)', category:'Office Stationery', unit:'Pieces', unitPrice:18000 },
  { code:'OS-002', name:'Ballpoint Pens Blue',   category:'Office Stationery', unit:'Boxes',  unitPrice:8500 },
  { code:'OS-003', name:'Stapler',               category:'Office Stationery', unit:'Pieces', unitPrice:12000 },
  { code:'OS-004', name:'Staples',               category:'Office Stationery', unit:'Boxes',  unitPrice:3500 },
  { code:'OS-005', name:'Files A4 Lever Arch',   category:'Office Stationery', unit:'Pieces', unitPrice:8000 },
  { code:'OS-006', name:'Calculator',            category:'Office Stationery', unit:'Pieces', unitPrice:25000 },
  { code:'OS-007', name:'Printer Ink Cartridge', category:'Office Stationery', unit:'Pieces', unitPrice:45000 },
  { code:'OS-008', name:'Toner Cartridge',       category:'Office Stationery', unit:'Pieces', unitPrice:95000 },
  { code:'OS-009', name:'Whiteboard Markers',    category:'Office Stationery', unit:'Boxes',  unitPrice:8500 },
  { code:'OS-010', name:'Marker Pens',           category:'Office Stationery', unit:'Boxes',  unitPrice:15000 },

  // ── MEDICAL SUPPLIES ─────────────────────────────────────
  { code:'MD-001', name:'First Aid Kit',         category:'First Aid',        unit:'Sets',    unitPrice:85000 },
  { code:'MD-002', name:'Bandages Crepe 10cm',   category:'Medical Supplies', unit:'Pieces',  unitPrice:5500 },
  { code:'MD-003', name:'Plasters Assorted',     category:'Medical Supplies', unit:'Boxes',   unitPrice:8500 },
  { code:'MD-004', name:'Paracetamol Tabs',      category:'Medical Supplies', unit:'Boxes',   unitPrice:3500 },
  { code:'MD-005', name:'Eye Wash Solution',     category:'Medical Supplies', unit:'Pieces',  unitPrice:12000 },
  { code:'MD-006', name:'Antiseptic Cream',      category:'Medical Supplies', unit:'Pieces',  unitPrice:8000 },
  { code:'MD-007', name:'Disposable Syringes',   category:'Medical Supplies', unit:'Boxes',   unitPrice:18000 },

  // ── FENCING ──────────────────────────────────────────────
  { code:'FN-001', name:'Barbed Wire',           category:'Fencing Materials', unit:'Rolls',  unitPrice:85000 },
  { code:'FN-002', name:'Chain Link Fence',      category:'Fencing Materials', unit:'Rolls',  unitPrice:250000 },
  { code:'FN-003', name:'Razor Wire',            category:'Fencing Materials', unit:'Rolls',  unitPrice:120000 },
  { code:'FN-004', name:'Steel Post 2m',         category:'Fencing Materials', unit:'Pieces', unitPrice:18000 },
  { code:'FN-005', name:'Concrete Post 2m',      category:'Fencing Materials', unit:'Pieces', unitPrice:22000 },
  { code:'FN-006', name:'Metal Gate 3m',         category:'Fencing Materials', unit:'Pieces', unitPrice:550000 },

  // ── DRAINAGE & SEWERAGE ──────────────────────────────────
  { code:'DR-001', name:'Sewer Pipe PVC 4"',     category:'Drainage & Sewerage', unit:'Lengths', unitPrice:35000 },
  { code:'DR-002', name:'Sewer Pipe PVC 6"',     category:'Drainage & Sewerage', unit:'Lengths', unitPrice:65000 },
  { code:'DR-003', name:'Manhole Cover 600mm',   category:'Drainage & Sewerage', unit:'Pieces',  unitPrice:185000 },
  { code:'DR-004', name:'Inspection Chamber',    category:'Drainage & Sewerage', unit:'Pieces',  unitPrice:250000 },
  { code:'DR-005', name:'Septic Tank 5000L GRP', category:'Drainage & Sewerage', unit:'Pieces',  unitPrice:2500000 },
  { code:'DR-006', name:'Soakaway Rings',        category:'Drainage & Sewerage', unit:'Pieces',  unitPrice:45000 },
  { code:'DR-007', name:'Gully Trap',            category:'Drainage & Sewerage', unit:'Pieces',  unitPrice:35000 },

  // ── DOORS & WINDOWS ──────────────────────────────────────
  { code:'DW-001', name:'Flush Door 900x2100',   category:'Doors & Windows',  unit:'Pieces',  unitPrice:185000 },
  { code:'DW-002', name:'Panel Door 900x2100',   category:'Doors & Windows',  unit:'Pieces',  unitPrice:250000 },
  { code:'DW-003', name:'Steel Door & Frame',    category:'Doors & Windows',  unit:'Pieces',  unitPrice:450000 },
  { code:'DW-004', name:'Aluminium Window',      category:'Doors & Windows',  unit:'Pieces',  unitPrice:350000 },
  { code:'DW-005', name:'Door Lock Set',         category:'Doors & Windows',  unit:'Sets',    unitPrice:35000 },
  { code:'DW-006', name:'Door Hinge 4"',         category:'Doors & Windows',  unit:'Pairs',   unitPrice:8500 },
  { code:'DW-007', name:'Window Grill Steel',    category:'Doors & Windows',  unit:'Square Metres', unitPrice:95000 },
  { code:'DW-008', name:'Glass 6mm Clear',       category:'Glass & Glazing',  unit:'Square Metres', unitPrice:55000 },

  // ── LANDSCAPING ──────────────────────────────────────────
  { code:'LS-001', name:'Top Soil',              category:'Landscaping Materials', unit:'Loads',   unitPrice:150000 },
  { code:'LS-002', name:'Manure (Organic)',      category:'Landscaping Materials', unit:'Loads',   unitPrice:80000 },
  { code:'LS-003', name:'Grass Seed',            category:'Landscaping Materials', unit:'Kilograms',unitPrice:25000 },
  { code:'LS-004', name:'Fertilizer NPK',        category:'Landscaping Materials', unit:'Bags',    unitPrice:85000 },
  { code:'LS-005', name:'Garden Hose 30m',       category:'Landscaping Materials', unit:'Pieces',  unitPrice:35000 },

  // ── FORMWORK & SCAFFOLDING ───────────────────────────────
  { code:'FW-001', name:'Steel Props Adjustable',category:'Formwork & Scaffolding', unit:'Pieces',unitPrice:45000 },
  { code:'FW-002', name:'Scaffolding Tube 6m',   category:'Formwork & Scaffolding', unit:'Pieces',unitPrice:35000 },
  { code:'FW-003', name:'Scaffolding Coupler',   category:'Formwork & Scaffolding', unit:'Pieces',unitPrice:5500 },
  { code:'FW-004', name:'Base Jack',             category:'Formwork & Scaffolding', unit:'Pieces',unitPrice:18000 },
  { code:'FW-005', name:'Shuttering Plywood 18mm',category:'Formwork & Scaffolding',unit:'Sheets',unitPrice:95000 },

  // ── COMMUNICATION & IT ───────────────────────────────────
  { code:'IT-001', name:'Laptop Computer',       category:'Computer & IT Equipment', unit:'Pieces',unitPrice:1500000 },
  { code:'IT-002', name:'Printer A4',            category:'Computer & IT Equipment', unit:'Pieces',unitPrice:850000 },
  { code:'IT-003', name:'USB Flash Drive 32GB',  category:'Computer & IT Equipment', unit:'Pieces',unitPrice:18000 },
  { code:'IT-004', name:'External Hard Drive 1TB',category:'Computer & IT Equipment',unit:'Pieces',unitPrice:185000 },
  { code:'IT-005', name:'CCTV Camera',           category:'Communication Equipment', unit:'Pieces',unitPrice:250000 },
  { code:'IT-006', name:'Walkie Talkie',         category:'Communication Equipment', unit:'Pieces',unitPrice:185000 },

  // ── WATER TREATMENT ──────────────────────────────────────
  { code:'WT-101', name:'Chlorine Tablets',      category:'Water Treatment',  unit:'Kilograms', unitPrice:12000 },
  { code:'WT-102', name:'Aluminium Sulphate',    category:'Water Treatment',  unit:'Kilograms', unitPrice:8500 },
  { code:'WT-103', name:'Sand Filter Media',     category:'Water Treatment',  unit:'Kilograms', unitPrice:3500 },
  { code:'WT-104', name:'Water Testing Kit',     category:'Water Treatment',  unit:'Sets',      unitPrice:85000 },

  // ── LAB EQUIPMENT ────────────────────────────────────────
  { code:'LB-001', name:'Concrete Test Cube Mould', category:'Lab Equipment', unit:'Pieces',  unitPrice:35000 },
  { code:'LB-002', name:'Slump Cone',               category:'Lab Equipment', unit:'Pieces',  unitPrice:45000 },
  { code:'LB-003', name:'Compaction Mould',          category:'Lab Equipment', unit:'Pieces',  unitPrice:85000 },
  { code:'LB-004', name:'Core Cutter',               category:'Lab Equipment', unit:'Pieces',  unitPrice:250000 },

  // ── IRRIGATION ───────────────────────────────────────────
  { code:'IR-001', name:'Drip Line 16mm',        category:'Irrigation Equipment', unit:'Metres', unitPrice:850 },
  { code:'IR-002', name:'Drip Emitter 4L/hr',    category:'Irrigation Equipment', unit:'Pieces', unitPrice:350 },
  { code:'IR-003', name:'Sprinkler Head',         category:'Irrigation Equipment', unit:'Pieces', unitPrice:8500 },
  { code:'IR-004', name:'Irrigation Filter',     category:'Irrigation Equipment', unit:'Pieces', unitPrice:45000 },
];

// ════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════
(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    await Unit.sync({ alter: true });
    await ProductCategory.sync({ alter: true });
    await Product.sync({ alter: true });

    // 1. Seed Units
    console.log('📐 Seeding Units...');
    const unitMap = {};
    for (const u of UNITS) {
      const [unit, created] = await Unit.findOrCreate({ where: { name: u.name }, defaults: u });
      unitMap[u.name] = unit.id;
      console.log(`  ${created ? '✅' : '⚠️ '} ${unit.name} (${unit.abbreviation})`);
    }

    // 2. Seed Categories
    console.log('\n📦 Seeding Categories...');
    const catMap = {};
    for (const c of CATEGORIES) {
      const [cat, created] = await ProductCategory.findOrCreate({ where: { name: c.name }, defaults: c });
      catMap[c.name] = cat.id;
      console.log(`  ${created ? '✅' : '⚠️ '} ${cat.name}`);
    }

    // 3. Seed Products
    console.log('\n🔧 Seeding Products...');
    let created = 0, existing = 0;
    for (const p of PRODUCTS) {
      const { category, unit, ...data } = p;
      const [product, isNew] = await Product.findOrCreate({
        where: { code: p.code },
        defaults: {
          ...data,
          categoryId: catMap[category] || null,
          unitId:     unitMap[unit]     || null,
        }
      });
      if (isNew) { created++; console.log(`  ✅ ${product.code} — ${product.name}`); }
      else { existing++; }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ SEED COMPLETE!`);
    console.log(`   Units:      ${UNITS.length}`);
    console.log(`   Categories: ${CATEGORIES.length}`);
    console.log(`   Products:   ${created} created, ${existing} already existed`);
    console.log(`${'='.repeat(50)}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
