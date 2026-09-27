import { useEffect, useRef, useState } from 'react';
import { searchAddress, locatePin } from '@/lib/location.functions';

export interface PickedLocation {
  address: string;
  lat: number | null;
  lng: number | null;
  inside: boolean | null;
  driveMinutes: number | null;
}

const BASE = { lat: 59.6099, lng: 16.5448 };

export function LocationPicker({ value, onChange }: { value: PickedLocation; onChange: (v: PickedLocation) => void }) {
  const [query, setQuery] = useState(value.address);
  const [results, setResults] = useState<Array<{ label: string; lat: number; lng: number }>>([]);
  const [open, setOpen] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<{ map: import('leaflet').Map; marker: import('leaflet').Marker } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load Leaflet only in the browser.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !mapRef.current || leafletRef.current) return;
      const map = L.map(mapRef.current, { center: [BASE.lat, BASE.lng], zoom: 11, scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      const icon = L.divIcon({
        className: '',
        html: '<div style="width:18px;height:18px;border-radius:50%;background:#22D3EE;border:3px solid #062B3A;box-shadow:0 0 0 4px rgba(34,211,238,0.25)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([BASE.lat, BASE.lng], { draggable: true, icon }).addTo(map);
      marker.on('dragend', async () => {
        const p = marker.getLatLng();
        const info = await locatePin({ data: { lat: p.lat, lng: p.lng } });
        setQuery(info.address);
        onChange({ address: info.address, lat: p.lat, lng: p.lng, inside: info.inside, driveMinutes: info.driveMinutes });
      });
      leafletRef.current = { map, marker };
      if (value.lat != null && value.lng != null) {
        marker.setLatLng([value.lat, value.lng]);
        map.setView([value.lat, value.lng], 14);
      }
    })();
    return () => {
      cancelled = true;
      leafletRef.current?.map.remove();
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = async (lat: number, lng: number, label?: string) => {
    const info = await locatePin({ data: { lat, lng } });
    const address = label ?? info.address;
    setQuery(address);
    setOpen(false);
    onChange({ address, lat, lng, inside: info.inside, driveMinutes: info.driveMinutes });
    const lm = leafletRef.current;
    if (lm) {
      lm.marker.setLatLng([lat, lng]);
      lm.map.setView([lat, lng], 15);
    }
  };

  const onType = (text: string) => {
    setQuery(text);
    onChange({ ...value, address: text, lat: null, lng: null, inside: null, driveMinutes: null });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 3) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const { results: r } = await searchAddress({ data: { query: text } });
        setResults(r);
        setOpen(r.length > 0);
      } catch { setResults([]); }
    }, 300);
  };

  const useGps = () => {
    if (!navigator.geolocation) return;
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsBusy(false); void pick(pos.coords.latitude, pos.coords.longitude); },
      () => setGpsBusy(false),
      { timeout: 10000 },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label style={{ display: 'block', fontSize: 12, color: '#6DA8C4', fontFamily: 'JetBrains Mono', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Address</label>
        <input
          type="text"
          className="vvs-input"
          placeholder="Vasagatan 14, Västerås"
          value={query}
          onChange={(e) => onType(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {open && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border" style={{ background: '#0A2233', borderColor: 'rgba(8,145,178,0.3)' }}>
            {results.map((r) => (
              <button
                key={`${r.lat},${r.lng}`}
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-white/5"
                style={{ color: '#D9EEF7' }}
                onClick={() => void pick(r.lat, r.lng, r.label)}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" onClick={useGps} disabled={gpsBusy} className="btn-ghost rounded-xl py-2.5 text-sm font-semibold" style={{ opacity: gpsBusy ? 0.5 : 1 }}>
        {gpsBusy ? 'Locating…' : '📍 Use my current location'}
      </button>
      <div ref={mapRef} className="h-56 w-full overflow-hidden rounded-xl border" style={{ borderColor: 'rgba(8,145,178,0.2)' }} />
      <p style={{ fontSize: 12, color: '#6DA8C4' }}>Drag the pin to your exact home if needed.</p>
      {value.inside === true && (
        <p style={{ fontSize: 13, color: '#34D399' }}>
          ✓ Inside our service area{value.driveMinutes != null ? ` — about ${value.driveMinutes} min drive for Mats` : ''}.
        </p>
      )}
      {value.inside === false && (
        <p style={{ fontSize: 13, color: '#F59E0B' }}>
          This address looks outside our service area (Västerås + 40 km). You can still send the request — Mats will confirm if he can take it.
        </p>
      )}
    </div>
  );
}
