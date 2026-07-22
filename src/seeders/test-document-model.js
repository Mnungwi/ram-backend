// ══════════════════════════════════════════════════════════════
// test-document-model.js
// Weka faili hii kwenye ROOT ya backend yako (karibu na server.js/package.json)
// Endesha kwa: node test-document-model.js
// ══════════════════════════════════════════════════════════════

console.log("1. Kuanza test...");

try {
  const modelFile = require("../models/document.model");
  console.log("2. require('../models/document.model') IMEFANIKIWA");
  console.log("3. Vitu vilivyo-export:", Object.keys(modelFile));
  console.log("4. typeof Document:", typeof modelFile.Document);
  console.log("5. Document.name (Sequelize model name):", modelFile.Document?.name);
  console.log("6. Document.tableName:", modelFile.Document?.tableName || modelFile.Document?.getTableName?.());

  if (modelFile.Document) {
    console.log("\n✅ MAFANIKIO — Document model iko sahihi, tatizo si hapa.");
  } else {
    console.log("\n❌ TATIZO — 'Document' haipo kwenye exports za faili hii.");
  }
} catch (err) {
  console.log("\n❌ TATIZO — require() yenyewe ime-throw error:");
  console.log(err.message);
  console.log("\nStack trace kamili:");
  console.log(err.stack);
}
