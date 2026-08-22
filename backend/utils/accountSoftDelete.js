const AppError = require("./errorHandlers/appError");

/**
 * Soft-delete / restore helpers shared by the user and partner account flows.
 *
 * Deleting wipes the identifying fields and frees the phone number for re-registration,
 * but first stashes the original values in `deletedSnapshot`. That is what makes the
 * admin toggle reversible: flipping the account off "deleted" puts the data back.
 *
 * History (bookings, payments, reviews, addresses) is never touched — it stays keyed to
 * the row id, so restoring the row reconnects all of it automatically.
 */

// Fields the delete clears and the restore puts back. `status` is stored too so a partner
// returns to "approved" rather than being dropped back to "pending".
const SNAPSHOT_FIELDS = ["name", "email", "phone", "profilePicture", "status"];

const buildSnapshot = (entity) =>
  SNAPSHOT_FIELDS.reduce((acc, f) => ({ ...acc, [f]: entity[f] ?? null }), {});

/**
 * The update payload that soft-deletes an account.
 * `phone` becomes `deleted_<id>`: unique (id is never reused) and within varchar(20).
 */
const softDeletePatch = (entity) => ({
  status: "deleted",
  deletedAt: new Date(),
  deletedSnapshot: buildSnapshot(entity),
  name: null,
  email: null,
  profilePicture: null,
  phone: `deleted_${entity.id}`,
  deviceTokens: [],
  fcmToken: null,
});

/**
 * The update payload that restores a soft-deleted account.
 *
 * `Model` is used to check the snapshot's phone/email are still free — someone may have
 * re-registered with that number after the deletion, and the columns are UNIQUE, so we
 * fail with a readable message instead of a raw constraint error.
 */
const restorePatch = async (entity, Model, fallbackStatus) => {
  const snap = entity.deletedSnapshot;
  if (!snap || !snap.phone) {
    throw new AppError(
      "This account was deleted before restore was supported, so its details were not kept and cannot be recovered.",
      422
    );
  }

  const { Op } = require("sequelize");
  const clash = await Model.findOne({
    where: { phone: snap.phone, id: { [Op.ne]: entity.id } },
    attributes: ["id"],
  });
  if (clash) {
    throw new AppError(
      `Cannot restore: ${snap.phone} is already in use by account #${clash.id}. Remove or change that account first.`,
      409
    );
  }

  if (snap.email) {
    const emailClash = await Model.findOne({
      where: { email: snap.email, id: { [Op.ne]: entity.id } },
      attributes: ["id"],
    });
    if (emailClash) {
      throw new AppError(
        `Cannot restore: ${snap.email} is already in use by account #${emailClash.id}.`,
        409
      );
    }
  }

  return {
    name: snap.name ?? null,
    email: snap.email ?? null,
    phone: snap.phone,
    profilePicture: snap.profilePicture ?? null,
    // Never restore straight back into "deleted" if the snapshot somehow captured it.
    status: snap.status && snap.status !== "deleted" ? snap.status : fallbackStatus,
    deletedAt: null,
    deletedSnapshot: null,
  };
};

module.exports = { SNAPSHOT_FIELDS, buildSnapshot, softDeletePatch, restorePatch };
