import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CityContext = createContext(null);

export function CityProvider({ children }) {
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]); // [] = All Cities

  const loadCities = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/api/v1/admin/cities');
      const all = res.data?.data ?? [];
      const allowed = user?.allowedCities;
      const filtered = allowed?.length ? all.filter(c => allowed.includes(c.id)) : all;
      setCities(filtered);
      if (allowed?.length === 1) {
        setSelectedCities(filtered.slice(0, 1));
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

  return (
    <CityContext.Provider value={{ cities, selectedCities, toggleCity, clearCities, cityParam, reloadCities: loadCities }}>
      {children}
    </CityContext.Provider>
  );
}

export const useCityFilter = () => useContext(CityContext);
