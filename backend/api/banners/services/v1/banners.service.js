const Banner = require("../../models/banner.model");
const AppError = require("../../../../utils/errorHandlers/appError");

const listActive = async () =>
  Banner.findAll({
    where: { isActive: true },
    order: [["sortOrder", "ASC"], ["createdAt", "DESC"]],
  });

const listAll = async () =>
  Banner.findAll({ order: [["sortOrder", "ASC"], ["createdAt", "DESC"]] });

const createBanner = async (data) => Banner.create(data);

const updateBanner = async (id, data) => {
  const banner = await Banner.findByPk(id);
  if (!banner) throw new AppError("Banner not found", 404);
  return banner.update(data);
};

const deleteBanner = async (id) => {
  const banner = await Banner.findByPk(id);
  if (!banner) throw new AppError("Banner not found", 404);
  await banner.destroy();
};

module.exports = { listActive, listAll, createBanner, updateBanner, deleteBanner };
