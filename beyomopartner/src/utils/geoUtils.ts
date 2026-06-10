export type CityGeo = {
  id: number;
  name: string;
  state?: string;
  lat?: number | null;
  lng?: number | null;
  radius?: number | null;
};

export const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const findCityForLocation = (
  lat: number,
  lng: number,
  cities: CityGeo[],
): CityGeo | undefined =>
  cities.find(
    c =>
      c.lat != null &&
      c.lng != null &&
      haversineKm(lat, lng, c.lat, c.lng) <= (c.radius ?? 30),
  );
