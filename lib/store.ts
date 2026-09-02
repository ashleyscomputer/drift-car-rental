export type Vehicle = {
  id: number;
  brand: string;
  model: string;
  year: number;
  type: 'Hatchback' | 'Sedan' | 'SUV' | 'Bakkie';
  registration: string;
  dailyRate: number;
  transmission: 'Manual' | 'Automatic';
  doors: number;
  colour: string;
  status: 'Available' | 'Rented' | 'Maintenance';
  features: string[];
  image: string;
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
  totalCost: number;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
};

export let vehicles: Vehicle[] = [
  { id: 1, brand: 'Volkswagen', model: 'Polo Vivo', year: 2025, type: 'Hatchback', registration: 'NC 238-491', dailyRate: 450, transmission: 'Automatic', doors: 5, colour: 'Pure White', status: 'Available', features: ['Bluetooth', 'Air conditioning', 'Electric windows'], image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=85', description: 'Compact, refined and ideal for effortless city driving.' },
  { id: 2, brand: 'Toyota', model: 'Corolla Cross', year: 2025, type: 'SUV', registration: 'NC 714-205', dailyRate: 790, transmission: 'Automatic', doors: 5, colour: 'Metallic Silver', status: 'Available', features: ['GPS', 'Bluetooth', 'Reverse camera', 'Cruise control'], image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=85', description: 'A spacious and confident SUV for road trips and family travel.' },
  { id: 3, brand: 'Ford', model: 'Ranger', year: 2024, type: 'Bakkie', registration: 'NC 557-180', dailyRate: 980, transmission: 'Automatic', doors: 4, colour: 'Graphite', status: 'Rented', features: ['4x4', 'GPS', 'Bluetooth', 'Tow bar'], image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=85', description: 'Rugged capability with a quiet, comfortable cabin.' },
  { id: 4, brand: 'BMW', model: '320i', year: 2025, type: 'Sedan', registration: 'NC 882-146', dailyRate: 1250, transmission: 'Automatic', doors: 4, colour: 'Alpine White', status: 'Available', features: ['Leather seats', 'GPS', 'Bluetooth', 'Parking assist'], image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1400&q=85', description: 'A polished executive sedan with precise performance.' },
  { id: 5, brand: 'Suzuki', model: 'Swift', year: 2024, type: 'Hatchback', registration: 'NC 091-438', dailyRate: 390, transmission: 'Manual', doors: 5, colour: 'Pearl Blue', status: 'Maintenance', features: ['Bluetooth', 'Air conditioning', 'USB charging'], image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1400&q=85', description: 'Light, economical and easy to park around town.' },
  { id: 6, brand: 'Hyundai', model: 'Tucson', year: 2025, type: 'SUV', registration: 'NC 625-903', dailyRate: 860, transmission: 'Automatic', doors: 5, colour: 'Titan Grey', status: 'Available', features: ['GPS', 'Apple CarPlay', 'Reverse camera', 'Cruise control'], image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1400&q=85', description: 'Premium comfort and technology in a versatile SUV.' },
];

export let bookings: Booking[] = [
  { id: 'BK-1048', customer: 'Naledi Molefe', email: 'naledi@example.com', vehicleId: 2, vehicle: 'Toyota Corolla Cross', startDate: '2026-09-03', endDate: '2026-09-07', pickupCity: 'Kimberley', returnCity: 'Kimberley', totalCost: 3160, status: 'Confirmed' },
  { id: 'BK-1047', customer: 'Liam Daniels', email: 'liam@example.com', vehicleId: 1, vehicle: 'Volkswagen Polo Vivo', startDate: '2026-09-02', endDate: '2026-09-05', pickupCity: 'Upington', returnCity: 'Kimberley', totalCost: 1350, status: 'Pending' },
  { id: 'BK-1046', customer: 'Thabo Mokoena', email: 'thabo@example.com', vehicleId: 3, vehicle: 'Ford Ranger', startDate: '2026-08-28', endDate: '2026-09-02', pickupCity: 'Kimberley', returnCity: 'Kimberley', totalCost: 4900, status: 'Completed' },
  { id: 'BK-1045', customer: 'Aaliyah Jacobs', email: 'aaliyah@example.com', vehicleId: 4, vehicle: 'BMW 320i', startDate: '2026-09-10', endDate: '2026-09-12', pickupCity: 'Bloemfontein', returnCity: 'Bloemfontein', totalCost: 2500, status: 'Confirmed' },
];

export const customers = [
  { id: 'CU-201', name: 'Naledi Molefe', email: 'naledi@example.com', phone: '071 555 0134', bookings: 4 },
  { id: 'CU-202', name: 'Liam Daniels', email: 'liam@example.com', phone: '082 111 4830', bookings: 2 },
  { id: 'CU-203', name: 'Thabo Mokoena', email: 'thabo@example.com', phone: '073 820 1944', bookings: 6 },
  { id: 'CU-204', name: 'Aaliyah Jacobs', email: 'aaliyah@example.com', phone: '076 332 9931', bookings: 3 },
];

export const payments = [
  { id: 'PAY-8842', bookingId: 'BK-1048', amount: 3160, date: '2026-09-01', status: 'Paid' },
  { id: 'PAY-8841', bookingId: 'BK-1047', amount: 1350, date: '2026-09-01', status: 'Pending' },
  { id: 'PAY-8839', bookingId: 'BK-1046', amount: 4900, date: '2026-08-27', status: 'Paid' },
  { id: 'PAY-8836', bookingId: 'BK-1045', amount: 2500, date: '2026-08-25', status: 'Paid' },
];

export function addVehicle(vehicle: Omit<Vehicle, 'id'>) {
  const created = { ...vehicle, id: Math.max(0, ...vehicles.map((item) => item.id)) + 1 };
  vehicles = [created, ...vehicles];
  return created;
}

export function updateVehicle(vehicle: Vehicle) {
  vehicles = vehicles.map((item) => (item.id === vehicle.id ? vehicle : item));
  return vehicle;
}

export function deleteVehicle(id: number) {
  vehicles = vehicles.filter((item) => item.id !== id);
}

export function addBooking(booking: Omit<Booking, 'id' | 'status'>) {
  const created: Booking = { ...booking, id: `BK-${1049 + bookings.length}`, status: 'Confirmed' };
  bookings = [created, ...bookings];
  return created;
}
