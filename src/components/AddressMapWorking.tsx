import L from 'leaflet';
import { MapPin } from "lucide-react";
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

import { Input } from "@/components/ui/input";
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface AddressMapWorkingProps {
  value?: string;
  onChange?: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
}

function LocationMarker({ position, setPosition }: { position: [number, number]; setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function AddressMapWorking({ value = '', onChange, placeholder = 'Enter address...' }: AddressMapWorkingProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [position, setPosition] = useState<[number, number]>([51.505, -0.09]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => console.log('Location access denied')
      );
    }
  }, []);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedIndex(-1);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 300);
  };

  const selectResult = (result: SearchResult, index: number) => {
    const newPosition: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    setPosition(newPosition);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    setSelectedIndex(index);
    
    onChange?.(result.display_name, { 
      lat: parseFloat(result.lat), 
      lng: parseFloat(result.lon) 
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectResult(searchResults[selectedIndex], selectedIndex);
        }
        break;
      case 'Escape':
        setSearchResults([]);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full"
        />
        
        {searchResults.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {searchResults.map((result, index) => (
              <button
                key={result.place_id}
                type="button"
                className={`w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-2 ${
                  selectedIndex === index ? 'bg-blue-50' : ''
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectResult(result, index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <MapPin className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {result.display_name}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-96 rounded-lg overflow-hidden border">
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
      </div>

      <p className="text-sm text-gray-500">
        Type to search with keyboard navigation (↑↓ Enter) or click on map
      </p>
    </div>
  );
}