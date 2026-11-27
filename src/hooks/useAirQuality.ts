import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAirQuality } from '../services/airQualityService';
import type { AirQualityData, CityLocation } from '../types/vayunex';

interface AirQualityState {
  data: AirQualityData | null;
  isLoading: boolean;
  refresh: () => void;
}

/**
 * Loads air quality for the selected city and exposes a manual refresh.
 * Responses for a previously selected city are ignored to avoid races.
 */
export function useAirQuality(city: CityLocation): AirQualityState {
  const [data, setData] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestIdRef = useRef(0);

  const load = useCallback(async (target: CityLocation) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    const result = await fetchAirQuality(target);
    if (requestId === requestIdRef.current) {
      setData(result);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(city);
  }, [city, load]);

  const refresh = useCallback(() => {
    void load(city);
  }, [city, load]);

  return { data, isLoading, refresh };
}
