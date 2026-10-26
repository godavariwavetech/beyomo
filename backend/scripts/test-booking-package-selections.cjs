// Pure regression checks: no database connections, writes or notifications.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const names = ['Back Massage', 'Fruit Facial', 'Classic Pedicure', 'Fruit Facial', 'Classic Pedicure', 'Classic Manicure'];
  const packages = [0, 1].map(() => ({packageId: 39, title: 'Any 3 @ ₹999', qty: 1, price: 999}));
  const services = names.map(name => ({name, packageId: 39, addedByPackage: true, qty: 1}));
  for (const app of ['admin-dashboard', 'beyomo', 'beyomopartner']) {
    const source = fs.readFileSync(path.resolve(__dirname, '../../', app, 'src/utils/bookingPackages.js'), 'utf8');
    const {groupBookingPackages: group} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    const before = JSON.stringify({packages, services});
    const legacy = group(packages, services);
    assert.deepEqual(legacy.map(g => g.items.map(s => s.name)), [names.slice(0, 3), names.slice(3)]);
    assert.equal(new Set(legacy.map(g => g.key)).size, 2);
    assert.equal(legacy.reduce((sum, g) => sum + g.price, 0), 1998);
    assert.equal(JSON.stringify({packages, services}), before, 'Must not mutate saved data');

    const taggedPackages = packages.map((p, i) => ({...p, packageSelectionId: `selection-${i}`, serviceCount: 3}));
    const taggedServices = services.map((s, i) => ({...s, packageSelectionId: `selection-${Math.floor(i / 3)}`}));
    // Identity must still work after services are reordered or one is removed.
    const reordered = group(taggedPackages, [...taggedServices].reverse());
    assert.ok(reordered.every(g => g.items.length === 3 && g.items.every(s => s.packageSelectionId === g.key)));
    const edited = group(taggedPackages, taggedServices.slice(1));
    assert.deepEqual(edited.map(g => g.items.length), [2, 3]);
    const combined = group(packages, services.slice(1));
    assert.equal(combined.length, 1, 'Ambiguous edited legacy selections stay together');
    assert.equal(combined[0].items.length, 5);
    assert.equal(combined[0].price, 1998);

    const quantity = group([{...packages[0], qty: 2}], services.slice(0, 3));
    assert.equal(quantity[0].qty, 2);
    assert.equal(quantity[0].unitPrice, 999);
    assert.equal(quantity[0].price, 1998);
    assert.equal(quantity[0].items.length, 3);

    // Partner screens must group the complete saved list BEFORE filtering ownership
    // or checklist removals, otherwise a 3+3 booking can be split incorrectly.
    const visible = [services[0], services[4]];
    const partnerGroups = group(packages, services).map(g => ({
      ...g, items: g.items.filter(item => visible.includes(item)),
    }));
    assert.deepEqual(partnerGroups.map(g => g.items.map(s => s.name)), [[names[0]], [names[4]]]);
    assert.equal(partnerGroups.reduce((sum, g) => sum + g.price, 0), 1998);
    assert.ok(partnerGroups.every(g => g.packageId === 39), 'API actions retain the catalog ID');
    const checklistGroups = group(packages, services).map(g => ({
      ...g, items: g.items.filter(item => item !== services[1]),
    }));
    assert.deepEqual(checklistGroups.map(g => g.items.length), [2, 3]);
    assert.equal(checklistGroups.reduce((sum, g) => sum + g.price, 0), 1998);
    if (app === 'beyomopartner') {
      const parser = require('../../beyomopartner/node_modules/@babel/parser');
      const generate = require('../../beyomopartner/node_modules/@babel/generator').default;
      const vm = require('node:vm');
      for (const screen of ['ActiveJobScreen', 'IncomingRequestScreen', 'JobDetailsScreen', 'JobChecklistScreen']) {
        const filename = path.resolve(__dirname, '../../beyomopartner/src/screens/Jobs', `${screen}.tsx`);
        const ast = parser.parse(fs.readFileSync(filename, 'utf8'), {sourceType: 'module', plugins: ['typescript', 'jsx']});
        let expression;
        let quantitySuffix;
        const visit = node => {
          if (!node || typeof node !== 'object') return;
          if (node.type === 'VariableDeclarator' && node.id?.name === 'packageGroups') expression = node.init;
          if (node.type === 'ConditionalExpression' && node.consequent?.type === 'TemplateLiteral'
            && generate(node.consequent).code.includes('formatAmount(group.unitPrice')) quantitySuffix = node;
          for (const value of Object.values(node)) {
            if (Array.isArray(value)) value.forEach(visit);
            else if (value && typeof value === 'object') visit(value);
          }
        };
        visit(ast);
        assert.ok(expression, `${screen} must derive package groups`);
        assert.ok(quantitySuffix, `${screen} must show the package quantity and unit price`);
        assert.equal(vm.runInNewContext(generate(quantitySuffix).code, {
          group: {qty: 2, unitPrice: 999}, formatAmount: String,
        }), ' \u00d7 \u20b9999', `${screen} must render multiplication and rupee symbols`);
        // Evaluate the screen's actual grouping expression with fixtures, without
        // mounting native views or invoking any API action.
        const evaluate = (visibleItems, overrides = {}) => vm.runInNewContext(generate(expression).code, {
          groupBookingPackages: group, multiPackages: packages,
          services, servicesList: services, packageItems: visibleItems,
          ...overrides,
        });
        const actual = evaluate(services);
        assert.equal(JSON.stringify(actual.map(g => g.items.map(s => s.name))), JSON.stringify([names.slice(0, 3), names.slice(3)]));
        assert.equal(actual.reduce((sum, g) => sum + g.price, 0), 1998);
        const filtered = evaluate(visible);
        assert.equal(JSON.stringify(filtered.map(g => g.items.map(s => s.name))), JSON.stringify([[names[0]], [names[4]]]));
        const oneSelection = evaluate([services[4]]);
        assert.equal(oneSelection.reduce((sum, g) => sum + g.items.length, 0), 1);
        if (screen === 'ActiveJobScreen') assert.equal(oneSelection.length, 1);
        const twoCopies = evaluate(services.slice(0, 3), {
          multiPackages: [{...packages[0], qty: 2}],
          services: services.slice(0, 3), servicesList: services.slice(0, 3),
        });
        assert.equal(twoCopies[0].qty, 2);
        assert.equal(twoCopies[0].unitPrice, 999);
        assert.equal(twoCopies[0].price, 1998);
        const legacyBooking = {packageId: 39, packageQty: 2, baseAmount: 1998, totalAmount: 1998};
        const singlePackage = evaluate(services.slice(0, 3), {
          multiPackages: [], job: legacyBooking, booking: legacyBooking,
          totalAmount: 1998, otherMyServicesTotal: 0, otherItemsTotal: 0,
          otherServicesTotal: 0, otherVisibleTotal: 0,
        });
        assert.equal(singlePackage[0].qty, 2);
        assert.equal(singlePackage[0].unitPrice, 999);
        assert.equal(singlePackage[0].price, 1998);
        console.log(`PASS ${screen}: actual grouping expression and partner/checklist visibility.`);
      }
    }
    console.log(`PASS ${app}: ONG2600015 legacy selections, stable new selection IDs, edits, totals and quantity.`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
