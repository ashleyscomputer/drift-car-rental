export type Vehicle = {
  id: number;
  brand: string;
  model: string;
  year: number;
  type: 'Hatchback' | 'Sedan' | 'SUV' | 'Bakkie' | 'Van';
  registration: string;
  dailyRate: number;
  transmission: 'Manual' | 'Automatic';
  doors: number;
  colour: string;
  status: 'Available' | 'Reserved' | 'Rented' | 'Maintenance';
  features: string[];
  image: string;
  images?: string[];
  tier?: 'Value' | 'Comfort' | 'Premium';
  branchId?: number;
  branchName?: string;
  rating?: number | null;
  description: string;
};

export type Booking = {
  id: string;
  customer: string;
  email: string;
  vehicleId: number;
  vehicle: string;
  startDate: string;
  endDate: string;
  pickupCity: string;
  returnCity: string;
  extras: string[];
  extrasCost: number;
  totalCost: number;
  paymentStatus?: string;
  status: 'Confirmed' | 'Pending' | 'Cancellation Requested' | 'Completed' | 'Cancelled';
};

export type RentalExtra = { id: string; label: string; pricing: 'daily' | 'flat'; price: number };

export type Catalogue = {branches:{id:number;name:string;city:string}[];extras:RentalExtra[]};
