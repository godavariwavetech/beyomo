require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { sequelize } = require('../utils/dbconnect');
const User = require('../api/users/models/user.model');
const Address = require('../api/users/models/userAddress.model');
const City = require('../api/cities/models/city.model');

async function main() {
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST || 'localhost'), 'Local database only');
  const rows = await sequelize.transaction(async transaction => {
    const city = await City.findOne({ where: { name: 'Ongole' }, transaction });
    assert.ok(city, 'Ongole must already exist in the local city list');
    const results = [];
    const names = ['Ravi Kumar', 'Lakshmi Devi', 'Suresh Reddy', 'Priya Rao', 'Anil Kumar'];
    for (let i = 0; i < names.length; i++) {
      const phone = `90000008${11 + i}`;
      const name = `${names[i]} (Local Test)`;
      const [user, created] = await User.findOrCreate({
        where: { phone }, defaults: { name, cityId: city.id, status: 'active' }, transaction,
      });
      assert.equal(user.name, name, 'Phone belongs to an unrelated customer; refusing to modify');
      await Address.findOrCreate({
        where: { userId: user.id, label: 'Local Test Home' },
        defaults: {
          line1: `Sample House ${i + 1}, Test Street`, line2: 'Fictional address for local testing only',
          city: 'Ongole', state: 'Andhra Pradesh', pincode: '523001',
          lat: city.lat, lng: city.lng, isDefault: true,
        }, transaction,
      });
      results.push({ id: user.id, name, phone, city: city.name, created });
    }
    return results;
  });
  console.table(rows);
  const count = await Address.count({ where: { label: 'Local Test Home', city: 'Ongole' } });
  assert.ok(count >= 5, 'Expected five saved Ongole addresses');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; })
  .finally(() => sequelize.close());
