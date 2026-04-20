export interface Vendor {
  id: string;
  name: string;
  zoneId: string;
  type: VendorType;
  estimatedWaitTime: number;  // seconds
  queueLength: number;
  rating: number;             // 1-5
  isOpen: boolean;
  menuHighlights: string[];
}

export enum VendorType {
  FOOD = 'FOOD',
  BEVERAGE = 'BEVERAGE',
  MERCHANDISE = 'MERCHANDISE',
  SNACK = 'SNACK',
}

// Pre-defined vendors across the stadium
export const STADIUM_VENDORS: Vendor[] = [
  // North Food Court
  { id: 'v1', name: 'Stadium Burgers', zoneId: 'food-north', type: VendorType.FOOD, estimatedWaitTime: 180, queueLength: 8, rating: 4.2, isOpen: true, menuHighlights: ['Classic Burger', 'Loaded Fries'] },
  { id: 'v2', name: 'Pizza Corner', zoneId: 'food-north', type: VendorType.FOOD, estimatedWaitTime: 240, queueLength: 12, rating: 4.5, isOpen: true, menuHighlights: ['Pepperoni Slice', 'Margherita'] },
  { id: 'v3', name: 'Fresh Drinks', zoneId: 'food-north', type: VendorType.BEVERAGE, estimatedWaitTime: 60, queueLength: 4, rating: 3.8, isOpen: true, menuHighlights: ['Lemonade', 'Iced Tea', 'Soda'] },

  // South Food Court
  { id: 'v4', name: 'Taco Stand', zoneId: 'food-south', type: VendorType.FOOD, estimatedWaitTime: 150, queueLength: 6, rating: 4.6, isOpen: true, menuHighlights: ['Street Tacos', 'Nachos', 'Quesadilla'] },
  { id: 'v5', name: 'Hot Dog Express', zoneId: 'food-south', type: VendorType.FOOD, estimatedWaitTime: 90, queueLength: 3, rating: 3.5, isOpen: true, menuHighlights: ['Classic Dog', 'Chili Dog'] },
  { id: 'v6', name: 'Smoothie Bar', zoneId: 'food-south', type: VendorType.BEVERAGE, estimatedWaitTime: 120, queueLength: 5, rating: 4.3, isOpen: true, menuHighlights: ['Mango Blast', 'Berry Mix'] },
  { id: 'v7', name: 'Fan Merch South', zoneId: 'food-south', type: VendorType.MERCHANDISE, estimatedWaitTime: 60, queueLength: 2, rating: 4.0, isOpen: true, menuHighlights: ['Jerseys', 'Scarves', 'Caps'] },

  // East Food Court
  { id: 'v8', name: 'Noodle Box', zoneId: 'food-east', type: VendorType.FOOD, estimatedWaitTime: 200, queueLength: 10, rating: 4.4, isOpen: true, menuHighlights: ['Pad Thai', 'Ramen Bowl'] },
  { id: 'v9', name: 'Craft Beer Stand', zoneId: 'food-east', type: VendorType.BEVERAGE, estimatedWaitTime: 100, queueLength: 7, rating: 4.7, isOpen: true, menuHighlights: ['IPA', 'Lager', 'Stout'] },
  { id: 'v10', name: 'Pretzel Palace', zoneId: 'food-east', type: VendorType.SNACK, estimatedWaitTime: 45, queueLength: 2, rating: 3.9, isOpen: true, menuHighlights: ['Soft Pretzel', 'Pretzel Bites'] },

  // VIP
  { id: 'v11', name: 'VIP Catering', zoneId: 'vip-west', type: VendorType.FOOD, estimatedWaitTime: 30, queueLength: 1, rating: 4.9, isOpen: true, menuHighlights: ['Premium Platter', 'Champagne'] },
];

export const getVendorsByZone = (zoneId: string): Vendor[] =>
  STADIUM_VENDORS.filter(v => v.zoneId === zoneId);

export const getVendorsByType = (type: VendorType): Vendor[] =>
  STADIUM_VENDORS.filter(v => v.type === type);
