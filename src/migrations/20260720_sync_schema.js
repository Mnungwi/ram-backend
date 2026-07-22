const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create project_reports table if not exists
    const hasReportsTable = await queryInterface.showAllTables().then(tables => tables.includes("project_reports"));
    if (!hasReportsTable) {
      await queryInterface.createTable("project_reports", {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
        },
        projectId: { type: Sequelize.UUID, allowNull: false },
        phaseId: { type: Sequelize.UUID, allowNull: true },
        reportNo: { type: Sequelize.STRING(100), allowNull: false },
        title: { type: Sequelize.STRING(255), allowNull: false },
        type: { type: Sequelize.STRING(100), defaultValue: "Progress Report" },
        period: { type: Sequelize.STRING(100), allowNull: true },
        content: { type: Sequelize.TEXT, allowNull: true },
        status: { type: Sequelize.STRING(50), defaultValue: "Completed" },
        progress: { type: Sequelize.DECIMAL(5, 2), defaultValue: 100 },
        submittedById: { type: Sequelize.UUID, allowNull: true },
        submittedBy: { type: Sequelize.STRING(255), allowNull: true },
        approvedById: { type: Sequelize.UUID, allowNull: true },
        submittedOn: { type: Sequelize.DATE, allowNull: true },
        fileUrl: { type: Sequelize.STRING(500), allowNull: true },
        fileName: { type: Sequelize.STRING(255), allowNull: true },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP") },
      });
      console.log("✅ Migration: Created 'project_reports' table.");
    }

    // 2. official_letters table: attachments column
    const officialLettersDesc = await queryInterface.describeTable("official_letters").catch(() => null);
    if (officialLettersDesc && !officialLettersDesc.attachments) {
      await queryInterface.addColumn("official_letters", "attachments", {
        type: Sequelize.JSON,
        allowNull: true,
      });
      console.log("✅ Migration: Added 'attachments' column to 'official_letters'.");
    }

    // 3. project_documents_v2 table: phaseId, status, submittedBy, submittedOn
    const projectDocsDesc = await queryInterface.describeTable("project_documents_v2").catch(() => null);
    if (projectDocsDesc) {
      if (!projectDocsDesc.phaseId) {
        await queryInterface.addColumn("project_documents_v2", "phaseId", {
          type: Sequelize.UUID,
          allowNull: true,
        });
        console.log("✅ Migration: Added 'phaseId' to 'project_documents_v2'.");
      }
      if (!projectDocsDesc.status) {
        await queryInterface.addColumn("project_documents_v2", "status", {
          type: Sequelize.STRING(50),
          allowNull: true,
          defaultValue: "Completed",
        });
        console.log("✅ Migration: Added 'status' to 'project_documents_v2'.");
      }
      if (!projectDocsDesc.submittedBy) {
        await queryInterface.addColumn("project_documents_v2", "submittedBy", {
          type: Sequelize.STRING(255),
          allowNull: true,
        });
        console.log("✅ Migration: Added 'submittedBy' to 'project_documents_v2'.");
      }
      if (!projectDocsDesc.submittedOn) {
        await queryInterface.addColumn("project_documents_v2", "submittedOn", {
          type: Sequelize.DATEONLY,
          allowNull: true,
        });
        console.log("✅ Migration: Added 'submittedOn' to 'project_documents_v2'.");
      }
    }

    // 4. products table: purchaseUnit, issueUnit, conversionFactor
    const productsDesc = await queryInterface.describeTable("products").catch(() => null);
    if (productsDesc) {
      if (!productsDesc.purchaseUnit) {
        await queryInterface.addColumn("products", "purchaseUnit", {
          type: Sequelize.STRING(50),
          allowNull: true,
        });
        console.log("✅ Migration: Added 'purchaseUnit' to 'products'.");
      }
      if (!productsDesc.issueUnit) {
        await queryInterface.addColumn("products", "issueUnit", {
          type: Sequelize.STRING(50),
          allowNull: true,
        });
        console.log("✅ Migration: Added 'issueUnit' to 'products'.");
      }
      if (!productsDesc.conversionFactor) {
        await queryInterface.addColumn("products", "conversionFactor", {
          type: Sequelize.DECIMAL(10, 4),
          allowNull: true,
          defaultValue: 1,
        });
        console.log("✅ Migration: Added 'conversionFactor' to 'products'.");
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback migrations if needed
  }
};
