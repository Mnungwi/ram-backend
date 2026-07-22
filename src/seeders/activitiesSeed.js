const { ActivityType } = require("../models");

async function seedActivityTypes() {
  const activities = [
    {
      name: "Site Preparation",
      description: "Site clearance and mobilization",
      color: "#64748b",
      icon: "fa-solid fa-road",
      order: 1,
    },
    {
      name: "Excavation",
      description: "Excavation and earth works",
      color: "#b45309",
      icon: "fa-solid fa-person-digging",
      order: 2,
    },
    {
      name: "Foundation",
      description: "Foundation construction",
      color: "#7c3aed",
      icon: "fa-solid fa-building-columns",
      order: 3,
    },
    {
      name: "Concrete Works",
      description: "Concrete casting and curing",
      color: "#2563eb",
      icon: "fa-solid fa-cubes",
      order: 4,
    },
    {
      name: "Masonry",
      description: "Block and brick works",
      color: "#dc2626",
      icon: "fa-solid fa-border-all",
      order: 5,
    },
    {
      name: "Steel Works",
      description: "Structural steel installation",
      color: "#0f766e",
      icon: "fa-solid fa-industry",
      order: 6,
    },
    {
      name: "Roofing",
      description: "Roof structure and covering",
      color: "#ea580c",
      icon: "fa-solid fa-house",
      order: 7,
    },
    {
      name: "Electrical",
      description: "Electrical installation",
      color: "#f59e0b",
      icon: "fa-solid fa-bolt",
      order: 8,
    },
    {
      name: "Plumbing",
      description: "Water supply and drainage",
      color: "#0891b2",
      icon: "fa-solid fa-faucet-drip",
      order: 9,
    },
    {
      name: "HVAC",
      description: "Heating, ventilation and air conditioning",
      color: "#0ea5e9",
      icon: "fa-solid fa-fan",
      order: 10,
    },
    {
      name: "Fire Fighting",
      description: "Fire protection installation",
      color: "#ef4444",
      icon: "fa-solid fa-fire-extinguisher",
      order: 11,
    },
    {
      name: "Finishing",
      description: "Painting, ceiling and finishing works",
      color: "#16a34a",
      icon: "fa-solid fa-paint-roller",
      order: 12,
    },
    {
      name: "Landscaping",
      description: "External works and landscaping",
      color: "#15803d",
      icon: "fa-solid fa-tree",
      order: 13,
    },
    {
      name: "Inspection",
      description: "Quality inspection and testing",
      color: "#7c2d12",
      icon: "fa-solid fa-clipboard-check",
      order: 14,
    },
    {
      name: "Commissioning",
      description: "Testing and commissioning",
      color: "#1d4ed8",
      icon: "fa-solid fa-play",
      order: 15,
    },
    {
      name: "Maintenance",
      description: "Maintenance and defect correction",
      color: "#475569",
      icon: "fa-solid fa-screwdriver-wrench",
      order: 16,
    },
  ];

  for (const activity of activities) {
    await ActivityType.findOrCreate({
      where: { name: activity.name },
      defaults: activity,
    });
  }

  console.log("✅ Activity Types seeded successfully.");
}

module.exports = seedActivityTypes;
