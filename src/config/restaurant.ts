// Restaurant Configuration
// This file contains configurable settings for your restaurant

export interface Floor {
  id: number;
  name: string;
  description?: string;
}

export interface Section {
  id: string;
  name: string;
  description?: string;
  floor?: number;
}

// Restaurant Floors Configuration
// Add or remove floors here to customize your restaurant layout
export const RESTAURANT_FLOORS: Floor[] = [
  { id: 1, name: "Ground Floor", description: "Main dining area" },
  { id: 2, name: "Second Floor", description: "VIP and private dining" },
  { id: 3, name: "Terrace", description: "Outdoor dining area" },
  // Add more floors as needed:
  // { id: 4, name: "Basement", description: "Private events" },
];

// Restaurant Sections Configuration
// Add or remove sections here to customize your restaurant layout
export const RESTAURANT_SECTIONS: Section[] = [
  { id: "main-hall", name: "Main Hall", description: "Central dining area", floor: 1 },
  { id: "window-side", name: "Window Side", description: "Tables by windows", floor: 1 },
  { id: "bar-area", name: "Bar Area", description: "Near the bar", floor: 1 },
  { id: "vip-section", name: "VIP Section", description: "Premium dining", floor: 2 },
  { id: "private-rooms", name: "Private Rooms", description: "Private dining rooms", floor: 2 },
  { id: "terrace-outdoor", name: "Outdoor Terrace", description: "Open air dining", floor: 3 },
  { id: "terrace-covered", name: "Covered Terrace", description: "Covered outdoor area", floor: 3 },
  // Add more sections as needed
];

// Helper functions
export const getFloorById = (id: number): Floor | undefined => {
  return RESTAURANT_FLOORS.find(floor => floor.id === id);
};

export const getSectionById = (id: string): Section | undefined => {
  return RESTAURANT_SECTIONS.find(section => section.id === id);
};

export const getSectionsByFloor = (floorId: number): Section[] => {
  return RESTAURANT_SECTIONS.filter(section => section.floor === floorId);
};

export const getFloorOptions = () => {
  return RESTAURANT_FLOORS.map(floor => ({
    value: floor.id.toString(),
    label: floor.name,
    description: floor.description
  }));
};

export const getSectionOptions = (floorId?: number) => {
  const sections = floorId 
    ? RESTAURANT_SECTIONS.filter(section => section.floor === floorId)
    : RESTAURANT_SECTIONS;
  
  return sections.map(section => ({
    value: section.id,
    label: section.name,
    description: section.description
  }));
};