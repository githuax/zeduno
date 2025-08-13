import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Loader2, X } from "lucide-react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface AddressMapProps {
  value?: string;
  onChange?: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

function LocationMarker({ position, setPosition }: { position: [number, number]; setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function AddressMap({ value = '', onChange, placeholder = 'Enter address...', className = '' }: AddressMapProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [isSearching, setIsSearching] = useState(false);
  const [position, setPosition] = useState<[number, number]>([51.505, -0.09]); // Default to London
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const mapRef = useRef<L.Map | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get user's location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          console.log('Location access denied, using default position');
        }
      );
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(data.length > 0);
    } catch (error) {
      console.error('Error searching address:', error);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
      setIsTyping(false);
    }
  }, []);

  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    await debouncedSearch(searchQuery);

    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      const newPosition: [number, number] = [parseFloat(firstResult.lat), parseFloat(firstResult.lon)];
      setPosition(newPosition);
      setMapKey(prev => prev + 1); // Force re-render of map
    }
  };

  const selectResult = (result: SearchResult) => {
    // Immediately hide results to prevent flicker
    setShowResults(false);
    
    const newPosition: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    setPosition(newPosition);
    setSearchQuery(result.display_name);
    
    // Clear any pending debounce timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    onChange?.(result.display_name, { lat: parseFloat(result.lat), lng: parseFloat(result.lon) });
    setMapKey(prev => prev + 1); // Force re-render of map
    
    // Optional: blur the input to remove focus
    inputRef.current?.blur();
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      if (data.display_name) {
        setSearchQuery(data.display_name);
        onChange?.(data.display_name, { lat, lng });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handlePositionChange = (newPosition: [number, number]) => {
    setPosition(newPosition);
    reverseGeocode(newPosition[0], newPosition[1]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsTyping(true);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      debouncedSearch(query);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setIsTyping(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    inputRef.current?.focus();
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Don't close if clicking on input or results
      if (
        inputRef.current?.contains(target) ||
        target.closest('[data-results-container]')
      ) {
        return;
      }
      
      // Close results when clicking elsewhere
      setShowResults(false);
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showResults]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={handleInputChange}
              placeholder={placeholder}
              onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
              onFocus={() => {
                if (searchQuery.length >= 3 && searchResults.length > 0) {
                  setShowResults(true);
                }
              }}
              onBlur={() => {
                // Don't close on blur - let click outside handle it
                // This prevents the dropdown from closing when clicking on results
              }}
              className="pr-8"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={searchAddress}
            disabled={isSearching || !searchQuery.trim()}
            type="button"
            variant="outline"
          >
            {isSearching || isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {showResults && (
          <Card className="absolute z-50 w-full mt-1 max-h-72 overflow-auto shadow-lg border" data-results-container>
            {isTyping || isSearching ? (
              <div className="p-3 flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Searching...</span>
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((result, index) => (
                <div
                  key={result.place_id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors ${
                    index === 0 ? 'bg-blue-50/50' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent input blur
                    e.stopPropagation(); // Stop event bubbling
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    selectResult(result);
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault(); // For mobile devices
                  }}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className={`h-4 w-4 mt-1 flex-shrink-0 ${
                      index === 0 ? 'text-blue-500' : 'text-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.display_name.split(',').slice(0, 2).join(',')}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {result.display_name.split(',').slice(2).join(',').trim()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : searchQuery.length >= 3 && (
              <div className="p-3 text-gray-500">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">No results found for "{searchQuery}"</span>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      <div className="h-96 rounded-lg overflow-hidden border">
        <MapContainer
          key={mapKey}
          center={position}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={(ref) => { if (ref) mapRef.current = ref; }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>

      <p className="text-sm text-gray-500">
        Type to search for an address with autocomplete suggestions, or click on the map to set the location
      </p>
    </div>
  );
}