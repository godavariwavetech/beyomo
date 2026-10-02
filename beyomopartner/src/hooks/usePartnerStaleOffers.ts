import {useCallback, useRef} from 'react';
import {AppState} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import api from '../utils/api';
import {endpoints} from '../config/config';

export const hasServiceOffer = (service: any) => service.offerPrice != null
  && Number(service.offerPrice) > 0 && Number(service.offerPrice) < Number(service.basePrice);

// Older booking responses can omit offer metadata. Keep a known offer only when
// the server saved that exact discounted price; never infer one from a low price.
export const retainServiceOfferSnapshots = (saved: any[], previous: any[]) => saved.map(service => {
  if (service.removed || service.isAddOn || service.addedByPackage || service.addedByOffer
    || !service.addedByPartner || hasServiceOffer(service)) return service;
  const snapshot = previous.find(item => String(item.serviceId ?? item.id) === String(service.serviceId)
    && hasServiceOffer(item) && Number(service.price) === Number(item.offerPrice));
  return snapshot ? {...service, basePrice: snapshot.basePrice, offerPrice: snapshot.offerPrice} : service;
});

export const staleOfferMessage = (names: string[]) =>
  `${names.join(', ')}: Offer is no longer available for this service. The normal price has been restored and your order total updated. Please review the total before continuing.`;

// Revalidate catalog selections and persisted partner additions through their
// existing city-aware APIs. Never accept a price supplied by the client.
export default function usePartnerStaleOffers(options: {
  bookingId: any; cityId: any; savedServices: any[]; localServices: any[];
  onLocalUpdates: (updates: Map<string, any>) => void;
  onBookingUpdate: (booking: any) => void;
  showAlert: (title: string, message: string) => void;
}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const inFlight = useRef<Promise<boolean> | null>(null);
  const active = useRef(true);
  const refresh = useCallback((): Promise<boolean> => {
    // A selection may change while a background request is running. Validate the
    // latest selection after that request, unless it already requires review.
    if (inFlight.current) return inFlight.current.then(changed => changed ? true : refresh());
    const task = async () => {
      const current = optionsRef.current;
      const localCandidates = current.localServices.filter(s => !s._removed && !s.isAddOn
        && !s.addedByPackage && !s.addedByOffer && hasServiceOffer(s));
      const savedCandidates = current.savedServices.filter(s => !s.removed && s.addedByPartner
        && !s.isAddOn && !s.addedByPackage && !s.addedByOffer && hasServiceOffer(s));
      const candidates = [...localCandidates, ...savedCandidates];
      const ids = [...new Set(candidates.map(s => String(s.serviceId ?? s.id)))];
      const updates = new Map<string, any>();
      await Promise.all(ids.map(async id => {
        const result = await api.get(`${endpoints.SERVICES}/${id}`, {
          params: {cityId: current.cityId ?? undefined},
        });
        const latest = result.data?.data;
        if (!result.data?.status || latest?.basePrice == null
          || !Number.isFinite(Number(latest.basePrice)) || Number(latest.basePrice) < 0) {
          throw new Error('Unable to verify the current service price. Please try again.');
        }
        if (!hasServiceOffer(latest)) updates.set(id, {...latest, offerPrice: null});
      }));
      let updatedBooking: any = null;
      const savedUpdates = savedCandidates.filter(s => updates.has(String(s.serviceId)));
      if (current.bookingId && savedUpdates.length) {
        try {
          const result = await api.patch(endpoints.PARTNER_EXTRA_SERVICES(String(current.bookingId)), {
            refreshRemovedOffers: true,
          });
          if (!result.data?.status || !result.data?.data) throw new Error('Unable to update the booking total.');
          updatedBooking = result.data.data;
          const saved = typeof updatedBooking.services === 'string' ? JSON.parse(updatedBooking.services) : updatedBooking.services;
          if (!Array.isArray(saved) || savedUpdates.some(item => !saved.some(s => !s.removed
            && String(s.serviceId) === String(item.serviceId)
            && Number(s.price) === Number(updates.get(String(item.serviceId)).basePrice)
            && !hasServiceOffer(s)))) throw new Error('Unable to update the booking total.');
        } catch {
          if (active.current) optionsRef.current.showAlert('Offer no longer available',
            `${savedUpdates.map(s => s.name).join(', ')}: Offer is no longer available for this service. Unable to update the booking total. Please try again before continuing.`);
          return true;
        }
      }
      if (!active.current) return false;
      const names = [...new Set([
        ...Array.from(updates.values()).map(s => s.name),
        ...savedUpdates.map(s => s.name),
      ])];
      if (updates.size) optionsRef.current.onLocalUpdates(updates);
      if (updatedBooking) optionsRef.current.onBookingUpdate(updatedBooking);
      if (names.length) optionsRef.current.showAlert('Offer no longer available', staleOfferMessage(names));
      return names.length > 0;
    };
    inFlight.current = task().finally(() => {inFlight.current = null;});
    return inFlight.current;
  }, []);

  useFocusEffect(useCallback(() => {
    active.current = true;
    const check = () => {refresh().catch(() => {});};
    check();
    const interval = setInterval(check, 10000);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') check();
    });
    return () => {
      active.current = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, [refresh]));
  return refresh;
}
