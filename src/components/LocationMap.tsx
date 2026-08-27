import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, AlertCircle, Check } from 'lucide-react';
import { StoreLocation } from '../types';

// Default center: Qal'at Sukkar, Iraq
const DEFAULT_LAT = 31.8596;
const DEFAULT_LNG = 46.0683;

// Fix Leaflet icon issue in bundled environments
const createCustomIcon = (color = '#059669') => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface LocationMapProps {
  location: StoreLocation | null;
  editable?: boolean;
  onLocationChange?: (loc: StoreLocation) => void;
  storeName?: string;
  className?: string;
  height?: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  location,
  editable = false,
  onLocationChange,
  storeName = 'موقع المتجر',
  className = '',
  height = '300px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(
    location ? { lat: location.lat, lng: location.lng } : null
  );

  const activeLat = currentCoords?.lat || (location ? location.lat : DEFAULT_LAT);
  const activeLng = currentCoords?.lng || (location ? location.lng : DEFAULT_LNG);
  const hasValidLocation = Boolean(location && location.lat && location.lng);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not yet created
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [activeLat, activeLng],
        zoom: hasValidLocation ? 16 : 14,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Handle map clicks in editable mode
      if (editable) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          updateMarkerPosition(lat, lng, true);
        });
      }
    }

    const map = mapInstanceRef.current;

    // Add or update marker
    if (hasValidLocation || editable) {
      if (!markerRef.current) {
        const marker = L.marker([activeLat, activeLng], {
          icon: createCustomIcon(editable ? '#2563eb' : '#059669'),
          draggable: editable,
        }).addTo(map);

        if (editable) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            updateMarkerPosition(pos.lat, pos.lng, true);
          });
        }

        marker.bindPopup(`<b>${storeName}</b><br/>مدينة قلعة سكر`);
        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng([activeLat, activeLng]);
      }
    }

    // Leaflet redraw on container mount
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, [hasValidLocation, editable]);

  // Update coords when external prop changes
  useEffect(() => {
    if (location && location.lat && location.lng) {
      setCurrentCoords({ lat: location.lat, lng: location.lng });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([location.lat, location.lng], 16);
        if (markerRef.current) {
          markerRef.current.setLatLng([location.lat, location.lng]);
        }
      }
    }
  }, [location?.lat, location?.lng]);

  const updateMarkerPosition = (lat: number, lng: number, triggerCallback = false) => {
    setCurrentCoords({ lat, lng });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else if (mapInstanceRef.current) {
      const marker = L.marker([lat, lng], {
        icon: createCustomIcon('#2563eb'),
        draggable: true,
      }).addTo(mapInstanceRef.current);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        updateMarkerPosition(pos.lat, pos.lng, true);
      });

      markerRef.current = marker;
    }

    if (triggerCallback && onLocationChange) {
      onLocationChange({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        addressName: `موقع محدد في قلعة سكر (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('خاصية تحديد الموقع غير مدعومة في هذا المتصفح.');
      return;
    }

    setIsLocating(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        updateMarkerPosition(latitude, longitude, true);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, {
            duration: 1.5,
          });
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('GPS Error:', err);
        setGpsError('تعذر الحصول على إذن الموقع الحالي. يمكنك النقر على الخريطة لتحديد موقعك يدوياً.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openGoogleMapsDirections = () => {
    if (!location || !location.lat || !location.lng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // If customer view and no location is set
  if (!editable && !hasValidLocation) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center ${className}`}>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <MapPin className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">موقع المتجر غير محدد حالياً على الخريطة.</p>
        <p className="mt-1 text-xs text-slate-500">يمكنك الاستدلال بالعنوان المكتوب أو الاتصال بالمتجر مباشرة.</p>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs ${className}`}>
      {/* Controls Bar for Store Owner */}
      {editable && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <Compass className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-slate-800">تحديد موقع المتجر على الخريطة</p>
              <p className="text-[11px] text-slate-500">انقر على الخريطة أو اسحب العلامة للمكان الدقيق</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            >
              <Navigation className={`h-3.5 w-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              {isLocating ? 'جاري التحديد...' : '📍 موقعي الحالي'}
            </button>
          </div>
        </div>
      )}

      {/* GPS Error alert */}
      {gpsError && (
        <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 text-xs text-amber-800 border-b border-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* The Leaflet Container */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="relative z-0 bg-slate-100"
      />

      {/* Footer info & Directions for Customer */}
      {!editable && hasValidLocation && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="line-clamp-1">{location?.addressName || 'موقع المتجر في قلعة سكر'}</span>
          </div>
          <button
            type="button"
            onClick={openGoogleMapsDirections}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>فتح الاتجاهات</span>
          </button>
        </div>
      )}

      {/* Coords indicator for owner */}
      {editable && currentCoords && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-3 py-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1 text-emerald-700 font-medium">
            <Check className="h-3.5 w-3.5" />
            <span>تم تحديد الإحداثيات: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}</span>
          </div>
          <span>مدينة قلعة سكر</span>
        </div>
      )}
    </div>
  );
};
