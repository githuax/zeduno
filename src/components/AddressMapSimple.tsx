import { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import L from 'leaflet';
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

interface AddressMapSimpleProps {
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

export default function AddressMapSimple({ value = '', onChange, placeholder = 'Enter address...' }: AddressMapSimpleProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [position, setPosition] = useState<[number, number]>([51.505, -0.09]); // Default to London
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchAddresses = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowDropdown(data.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 300);
  };

  const handleResultClick = (result: SearchResult) => {
    console.log('Result clicked:', result.display_name); // Debug log
    
    const newPosition: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    setPosition(newPosition);
    setSearchQuery(result.display_name);
    setShowDropdown(false);
    
    onChange?.(result.display_name, { 
      lat: parseFloat(result.lat), 
      lng: parseFloat(result.lon) 
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          onFocus={() => {
            if (searchResults.length > 0) setShowDropdown(true);
          }}
        />
        
        {showDropdown && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto shadow-lg">
            {isLoading ? (
              <div className="p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Searching...</span>
              </div>
            ) : (
              searchResults.map((result) => (
                <div
                  key={result.place_id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleResultClick(result);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                    <p className="text-sm">{result.display_name}</p>
                  </div>
                </div>
              ))
            )}
          </Card>
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
        Simple version: Type to search or click on map
      </p>
    </div>
  );
}