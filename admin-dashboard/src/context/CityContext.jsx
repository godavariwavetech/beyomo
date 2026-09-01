import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const parseArr = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
};

const CityContext = createContext(null);

export function CityProvider({ children }) {
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]); // [] = All Cities
  const [userZones, setUserZones] = useState([]); // resolved zone objects for the logged-in user

  const loadCities = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/v1/admin/cities');
      const all = res.data?.data ?? [];
      const allowedZones = user?.allowedZones;

      if (allowedZones?.length) {
        const zonesRes = await api.get('/api/v1/admin/zones');
        const allowedSet = new Set(allowedZones.map(Number));
        const resolved = (zonesRes.data?.data ?? []).filter(z => allowedSet.has(Number(z.id)));
        setUserZones(resolved);
        const allowedCityIds = [...new Set(resolved.flatMap(z => parseArr(z.cityIds)))];
        const filtered = all.filter(c => allowedCityIds.includes(c.id));
        setCities(filtered.length ? filtered : all);
        if (filtered.length === 1) setSelectedCities(filtered.slice(0, 1));
      } else {
        setUserZones([]);
        setCities(all);
      }
    } catch (_) {}
  }, [user]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  const toggleCity = (city) => {
    setSelectedCities(prev =>
      prev.some(c => c.id === city.id)
        ? prev.filter(c => c.id !== city.id)
        : [...prev, city]
    );
  };

  const clearCities = () => setSelectedCities([]);

  // cityParam: comma-separated IDs string for API calls, null = no filter
  const cityParam = selectedCities.length ? selectedCities.map(c => c.id).join(',') : null;

  // cityId: the single selected city, or null when viewing All Cities / multiple.
  // City-specific pricing only makes sense for exactly one city, so pages that show
  // or edit a per-city rate key off this rather than cityParam.
  const cityId = selectedCities.length === 1 ? selectedCities[0].id : null;

  return (
    <CityContext.Provider value={{ cities, selectedCities, toggleCity, clearCities, cityParam, cityId, reloadCities: loadCities, userZones }}>
      {children}
    </CityContext.Provider>
  );
}

export const useCityFilter = () => useContext(CityContext);
