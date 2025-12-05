'use client';

import { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';
import Link from 'next/link';
import { FiArrowLeft, FiMapPin, FiNavigation, FiLoader } from 'react-icons/fi';

interface Court {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
  description?: string;
  sport_type?: string;
}

interface NearbyCourtsResponse {
  courts: any[];
  total_count: number;
  search_location: {
    latitude: number;
    longitude: number;
    radius_km: number;
  };
}

export default function NearbyCourtsPage() {
  // Default to a central location (e.g., Ljubljana, Slovenia) if geolocation fails
  const DEFAULT_LOCATION = { lat: 46.0569, lng: 14.5058 };

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(DEFAULT_LOCATION);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [radius, setRadius] = useState(10);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>('');
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    // Fetch Google Maps API key from backend at runtime
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const data = await response.json();
        setGoogleMapsApiKey(data.googleMapsApiKey);
      } catch (err) {
        console.error('Failed to load config:', err);
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  useEffect(() => {
    if (!configLoading) {
      getUserLocation();
    }
  }, [configLoading]);

  const getUserLocation = () => {
    setLoading(true);
    setLocationError(null);
    setApiError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Showing default location.');
      setLoading(false);
      // Still try to fetch courts at default location
      if (userLocation) {
        fetchNearbyCourts(userLocation.lat, userLocation.lng, radius);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError(null);
        await fetchNearbyCourts(latitude, longitude, radius);
      },
      (err) => {
        const errorMessage = err.code === 1
          ? 'Location access denied. Using default location.'
          : err.code === 2
            ? 'Unable to determine location. Using default location.'
            : 'Location timeout. Using default location.';

        setLocationError(errorMessage);
        setLoading(false);

        // Only log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Geolocation unavailable (code ' + err.code + '). Using fallback location.');
        }

        // Still try to fetch courts at default location
        if (userLocation) {
          fetchNearbyCourts(userLocation.lat, userLocation.lng, radius);
        }
      },
      {
        timeout: 10000,
        enableHighAccuracy: false,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const fetchNearbyCourts = async (lat: number, lng: number, radiusKm: number) => {
    try {
      setLoading(true);
      setApiError(null);

      const response = await fetch('/api/facilities/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          radius_km: radiusKm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch nearby courts');
      }

      const data: NearbyCourtsResponse = await response.json();

      // Map API response to Court interface
      const mappedCourts: Court[] = (data.courts || []).map((court: any) => ({
        id: court.id,
        name: court.name || 'Unknown Court',
        address: court.address_line || court.city || 'No address',
        latitude: court.location?.latitude || 0,
        longitude: court.location?.longitude || 0,
        distance: court.distance_km,
        description: '',
        sport_type: '',
      })).filter(c => c.latitude !== 0 && c.longitude !== 0); // Filter out invalid locations

      setCourts(mappedCourts);
      setApiError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load nearby courts';
      setApiError(errorMessage + '. The map will still display.');
      setCourts([]); // Set empty array so map still shows

      // Only log detailed errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Facilities API error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (userLocation) {
      fetchNearbyCourts(userLocation.lat, userLocation.lng, newRadius);
    }
  };

  const handleRecenter = () => {
    getUserLocation();
  };

  if (!configLoading && !googleMapsApiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Google Maps API key is not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <FiArrowLeft /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
              >
                <FiArrowLeft />
                <span>Back</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Nearby Courts
              </h1>
            </div>
            <button
              onClick={handleRecenter}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              <FiNavigation className="w-4 h-4" />
              Re-center
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Radius:
              </label>
              <select
                value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={15}>15 km</option>
                <option value={20}>20 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {courts.length > 0 && (
                <span className="flex items-center gap-2">
                  <FiMapPin className="w-4 h-4" />
                  {courts.length} court{courts.length !== 1 ? 's' : ''} found
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {locationError && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              <strong>Location:</strong> {locationError}
            </p>
          </div>
        )}
        {apiError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">
              <strong>Error:</strong> {apiError}
            </p>
          </div>
        )}

        {/* Map Container - Always show if we have a location (even if it's the default) */}
        {userLocation && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden relative" style={{ height: '600px' }}>
                {loading && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 z-10 flex items-center justify-center">
                    <div className="text-center">
                      <FiLoader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">Loading courts...</p>
                    </div>
                  </div>
                )}
                <APIProvider apiKey={googleMapsApiKey}>
                  <Map
                    defaultCenter={userLocation}
                    defaultZoom={12}
                    mapId="nearby-courts-map"
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                  >
                    {/* User Location Marker */}
                    <AdvancedMarker
                      position={userLocation}
                      title="Your Location"
                    >
                      <Pin
                        background={'#3B82F6'}
                        glyphColor={'#FFFFFF'}
                        borderColor={'#FFFFFF'}
                      />
                    </AdvancedMarker>

                    {/* Court Markers */}
                    {courts.map((court) => (
                      <AdvancedMarker
                        key={court.id}
                        position={{ lat: court.latitude, lng: court.longitude }}
                        onClick={() => setSelectedCourt(court)}
                        title={court.name}
                      >
                        <Pin
                          background={'#EF4444'}
                          glyphColor={'#FFFFFF'}
                          borderColor={'#FFFFFF'}
                        />
                      </AdvancedMarker>
                    ))}

                    {/* Info Window */}
                    {selectedCourt && (
                      <InfoWindow
                        position={{
                          lat: selectedCourt.latitude,
                          lng: selectedCourt.longitude,
                        }}
                        onCloseClick={() => setSelectedCourt(null)}
                      >
                        <div className="p-2 min-w-[200px]">
                          <h3 className="font-bold text-gray-900 mb-1">
                            {selectedCourt.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {selectedCourt.address}
                          </p>
                          {selectedCourt.sport_type && (
                            <p className="text-xs text-gray-500 mb-2">
                              Sport: {selectedCourt.sport_type}
                            </p>
                          )}
                          {selectedCourt.distance !== undefined && (
                            <p className="text-xs text-blue-600 font-medium mb-3">
                              {selectedCourt.distance.toFixed(2)} km away
                            </p>
                          )}
                          <Link
                            href={`/booking/${selectedCourt.id}`}
                            className="block w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
                          >
                            Book Now
                          </Link>
                        </div>
                      </InfoWindow>
                    )}
                  </Map>
                </APIProvider>
              </div>
            </div>

            {/* Courts List */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Courts List
                  </h2>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '540px' }}>
                  {courts.length === 0 ? (
                    <div className="p-8 text-center">
                      <FiMapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No courts found in this area
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Try increasing the search radius
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {courts.map((court) => (
                        <div
                          key={court.id}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div
                            className="cursor-pointer mb-3"
                            onClick={() => setSelectedCourt(court)}
                          >
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {court.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {court.address}
                            </p>
                            <div className="flex items-center justify-between">
                              {court.sport_type && (
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                  {court.sport_type}
                                </span>
                              )}
                              {court.distance !== undefined && (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  {court.distance.toFixed(2)} km
                                </span>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/booking/${court.id}`}
                            className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-center shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                          >
                            Book Now
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
