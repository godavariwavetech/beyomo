import {createSlice} from '@reduxjs/toolkit';

const sameSelection = (a = [], b = []) =>
  a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');

const cartSlice = createSlice({
  name: 'Cart',
  initialState: {
    // Packages/combos — each item: { key, packageId, packageTitle, packagePrice,
    //   packageOriginalPrice, qty, services: [{id, name, price, duration, image}] }
    items: [],
    // Plain individual services booked outside any package — { id, name, price,
    //   duration, image, qty, isFree? }. Dedup by id (unlike packages, a service
    //   picked twice is just a higher quantity of the same line, no selection to compare).
    services: [],
  },
  reducers: {
    // Adding the same package with the identical service selection bumps qty instead
    // of creating a duplicate line — mirrors the website cart's dedup behavior.
    addPackageToCart: (state, action) => {
      const incoming = action.payload;
      const incomingIds = incoming.services.map(s => s.id);
      const existing = state.items.find(
        item => item.packageId === incoming.packageId && sameSelection(item.services.map(s => s.id), incomingIds),
      );
      if (existing) {
        existing.qty += incoming.qty || 1;
      } else {
        state.items.push({
          key: `${incoming.packageId}-${Date.now()}`,
          qty: 1,
          ...incoming,
        });
      }
    },
    incrementItemQty: (state, action) => {
      const item = state.items.find(i => i.key === action.payload);
      if (item) item.qty += 1;
    },
    decrementItemQty: (state, action) => {
      const item = state.items.find(i => i.key === action.payload);
      if (item && item.qty > 1) item.qty -= 1;
    },
    removeItemFromCart: (state, action) => {
      state.items = state.items.filter(i => i.key !== action.payload);
    },

    // Bulk-merge a batch of plain services (e.g. everything picked on the services
    // listing screen at once) — repeats of the same id add to its qty instead of
    // creating duplicate lines.
    addServicesToCart: (state, action) => {
      const incoming = action.payload; // array of {id, name, price, duration, image, qty?, isFree?}
      for (const svc of incoming) {
        const key = String(svc.id);
        const existing = state.services.find(s => String(s.id) === key && !s.isFree === !svc.isFree);
        if (existing) {
          existing.qty += svc.qty || 1;
        } else {
          state.services.push({...svc, qty: svc.qty || 1});
        }
      }
    },
    incrementServiceQty: (state, action) => {
      const svc = state.services.find(s => String(s.id) === String(action.payload));
      if (svc && !svc.isFree) svc.qty += 1;
    },
    decrementServiceQty: (state, action) => {
      const svc = state.services.find(s => String(s.id) === String(action.payload));
      if (svc && !svc.isFree) {
        svc.qty -= 1;
        if (svc.qty <= 0) state.services = state.services.filter(s => s !== svc);
      }
    },
    removeServiceFromCart: (state, action) => {
      // Array.filter always returns a new array reference, even when nothing matched —
      // guard so a no-op removal doesn't churn state.services and, worse, retrigger any
      // effect that reactively watches it (infinite update loop otherwise).
      if (state.services.some(s => String(s.id) === String(action.payload))) {
        state.services = state.services.filter(s => String(s.id) !== String(action.payload));
      }
    },
    removeFreeService: state => {
      if (state.services.some(s => s.isFree)) {
        state.services = state.services.filter(s => !s.isFree);
      }
    },

    clearCart: state => {
      state.items = [];
      state.services = [];
    },
  },
});

export const {
  addPackageToCart, incrementItemQty, decrementItemQty, removeItemFromCart,
  addServicesToCart, incrementServiceQty, decrementServiceQty, removeServiceFromCart, removeFreeService,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
