/**
 * Run once to populate skill_categories and skills tables from the Excel data.
 * Usage: node scripts/seedSkills.js
 */
require("dotenv").config();
const { sequelize } = require("../utils/dbconnect");
require("../utils/models"); // registers all models + associations
const SkillCategory = require("../api/skills/models/SkillCategory");
const Skill = require("../api/skills/models/Skill");

const SKILLS_DATA = [
  { name: "Hair Basic", skills: ["Basic HairCut", "Henna", "Hair Spa", "Head Massage", "Hair Color", "Lice Treatment"] },
  { name: "Skin Basic", skills: ["DeTan", "PeelOff", "Facial", "Waxing", "Pedicure", "Manicure", "Face Massage"] },
  { name: "Hair Advanced", skills: ["Creative HairCut", "Hair Setting", "Ironing", "Fashion Color"] },
  { name: "Waxing", skills: ["Honey Waxing", "Rica Waxing", "Brazillian", "B Waxing"] },
  { name: "Skin Treatment", skills: ["Wart Removal", "Skin Tightening"] },
  { name: "Makeup", skills: ["HairDo", "Saree Draping", "Bride Makeup", "Groom Makeup", "Pre-plating"] },
  { name: "Mehendi", skills: [] },
  { name: "Nails", skills: [] },
  { name: "Hair Treatments", skills: ["Botox", "Keratin", "Straightening", "NanoPlastia", "Hairfall Treatment", "Dandruff Treatment"] },
  { name: "Massage", skills: ["Foot Massage", "Back Massage", "Body Massage", "Body Polish"] },
  { name: "Aesthetics", skills: ["Hydra Facial", "Medi Facials", "Micro Blading", "Eyelash", "BB Glow", "Lip Coloring", "Chemical Peels", "PRP / GFC", "Glutathione", "Derma Planing"] },
  { name: "Laser", skills: [] },
  { name: "Men", skills: ["Hair", "Skin", "Makeup", "Massage"] },
];

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("DB connected. Seeding skills...");

    for (let i = 0; i < SKILLS_DATA.length; i++) {
      const { name, skills } = SKILLS_DATA[i];
      const [cat] = await SkillCategory.findOrCreate({
        where: { name },
        defaults: { name, sortOrder: i + 1 },
      });
      for (const skillName of skills) {
        await Skill.findOrCreate({
          where: { skillCategoryId: cat.id, name: skillName },
          defaults: { skillCategoryId: cat.id, name: skillName },
        });
      }
      console.log(`  ✓ ${name} (${skills.length} skills)`);
    }
    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
})();
