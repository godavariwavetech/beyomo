import React, { createContext, useContext, useEffect, useState } from 'react';
import { getActiveCities } from '../api/cities';

const CityContext = createContext(null);

const STORAGE_KEY = 'beyomo_city';

export function CityProvider({ children }) {
  const [city, setCityState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError, setCitiesError] = useState(null);

  useEffect(() => {
    getActiveCities()
      .then((res) => setCities(res.data || []))
      .catch((err) => setCitiesError(err.message))
      .finally(() => setCitiesLoading(false));
  }, []);

  const setCity = (next) => {
    setCityState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  return (
    <CityContext.Provider value={{ city, setCity, cities, citiesLoading, citiesError }}>
      {children}
    </CityContext.Provider>
  );
}

export const useCity = () => useContext(CityContext);
