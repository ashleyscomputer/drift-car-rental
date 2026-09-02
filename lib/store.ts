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
  { id: 1, brand: 'Volkswagen', model: 'Polo TDI', year: 2024, type: 'Hatchback', registration: 'NC 238-491', dailyRate: 480, transmission: 'Manual', doors: 5, colour: 'Reflex Silver', status: 'Available', features: ['Bluetooth', 'Air conditioning', 'Electric windows', 'Cruise control'], image: '/vehicles/polo-tdi.jpg', description: 'A refined, fuel-efficient diesel hatchback that is effortless around town and composed on the open road.' },
  { id: 2, brand: 'Toyota', model: 'Starlet', year: 2025, type: 'Hatchback', registration: 'NC 714-205', dailyRate: 420, transmission: 'Automatic', doors: 5, colour: 'Glacier White', status: 'Available', features: ['Bluetooth', 'Air conditioning', 'Apple CarPlay', 'USB charging'], image: '/vehicles/toyota-starlet.jpg', description: 'An economical everyday hatchback with excellent space and simple, dependable comfort.' },
  { id: 3, brand: 'Suzuki', model: 'Swift', year: 2024, type: 'Hatchback', registration: 'NC 091-438', dailyRate: 390, transmission: 'Manual', doors: 5, colour: 'Pearl Blue', status: 'Available', features: ['Bluetooth', 'Air conditioning', 'USB charging'], image: '/vehicles/suzuki-swift.jpg', description: 'Light, economical and easy to park, with a lively personality for city trips.' },
  { id: 4, brand: 'Hyundai', model: 'Grand i10', year: 2025, type: 'Hatchback', registration: 'NC 448-237', dailyRate: 410, transmission: 'Automatic', doors: 5, colour: 'Titan Grey', status: 'Available', features: ['Bluetooth', 'Air conditioning', 'Apple CarPlay', 'Reverse camera'], image: '/vehicles/hyundai-i10.jpg', description: 'A comfortable compact with modern connectivity and excellent urban manners.' },
  { id: 5, brand: 'Renault', model: 'Kwid', year: 2024, type: 'Hatchback', registration: 'NC 332-781', dailyRate: 350, transmission: 'Manual', doors: 5, colour: 'Fiery Red', status: 'Maintenance', features: ['Bluetooth', 'Air conditioning', 'USB charging'], image: '/vehicles/renault-kwid.jpg', description: 'The most affordable way into the fleet, with crossover-inspired styling and low running costs.' },
  { id: 6, brand: 'Toyota', model: 'Corolla Cross', year: 2025, type: 'SUV', registration: 'NC 625-903', dailyRate: 790, transmission: 'Automatic', doors: 5, colour: 'Metallic Silver', status: 'Available', features: ['GPS', 'Bluetooth', 'Reverse camera', 'Cruise control'], image: '/vehicles/corolla-cross.jpg', description: 'A spacious and confident SUV for road trips, families and everyday errands.' },
  { id: 7, brand: 'Hyundai', model: 'Tucson', year: 2025, type: 'SUV', registration: 'NC 208-553', dailyRate: 860, transmission: 'Automatic', doors: 5, colour: 'Amazon Grey', status: 'Available', features: ['GPS', 'Apple CarPlay', 'Reverse camera', 'Cruise control'], image: '/vehicles/hyundai-tucson.jpg', description: 'Premium comfort and technology in a versatile, family-friendly SUV.' },
  { id: 8, brand: 'Volkswagen', model: 'T-Roc', year: 2025, type: 'SUV', registration: 'NC 916-445', dailyRate: 880, transmission: 'Automatic', doors: 5, colour: 'Petroleum Blue', status: 'Available', features: ['GPS', 'Bluetooth', 'Apple CarPlay', 'Cruise control'], image: '/vehicles/vw-troc.jpg', description: 'Crisp European design, elevated seating and a confident turbocharged drive.' },
  { id: 9, brand: 'Ford', model: 'Ranger', year: 2025, type: 'Bakkie', registration: 'NC 557-180', dailyRate: 1050, transmission: 'Automatic', doors: 4, colour: 'Graphite', status: 'Rented', features: ['4x4', 'GPS', 'Bluetooth', 'Tow bar'], image: '/vehicles/ford-ranger.jpg', description: 'Rugged capability, serious load space and a quiet, comfortable double-cab interior.' },
  { id: 10, brand: 'Toyota', model: 'Fortuner', year: 2025, type: 'SUV', registration: 'NC 310-882', dailyRate: 1100, transmission: 'Automatic', doors: 5, colour: 'Attitude Black', status: 'Available', features: ['4x4', 'GPS', 'Reverse camera', 'Cruise control'], image: '/vehicles/toyota-fortuner.jpg', description: 'A dependable seven-seat SUV built for long-distance comfort and tougher roads.' },
  { id: 11, brand: 'BMW', model: '320i M Sport', year: 2025, type: 'Sedan', registration: 'NC 882-146', dailyRate: 1250, transmission: 'Automatic', doors: 4, colour: 'Alpine White', status: 'Available', features: ['Leather seats', 'GPS', 'Bluetooth', 'Parking assist'], image: '/vehicles/bmw-320i.jpg', description: 'A polished executive sedan with balanced performance and a beautifully finished cabin.' },
  { id: 12, brand: 'Mercedes-Benz', model: 'C200', year: 2025, type: 'Sedan', registration: 'NC 705-211', dailyRate: 1400, transmission: 'Automatic', doors: 4, colour: 'Obsidian Black', status: 'Available', features: ['Leather seats', 'GPS', 'Apple CarPlay', 'Parking assist'], image: '/vehicles/mercedes-c200.jpg', description: 'Elegant executive travel with a serene interior and intuitive digital technology.' },
  { id: 13, brand: 'Volkswagen', model: 'Golf GTI', year: 2025, type: 'Hatchback', registration: 'NC 198-760', dailyRate: 1600, transmission: 'Automatic', doors: 5, colour: 'Kings Red', status: 'Available', features: ['Sport mode', 'GPS', 'Apple CarPlay', 'Adaptive cruise control'], image: '/vehicles/golf-gti.jpg', description: 'The iconic premium hot hatch: practical every day and genuinely exciting when the road opens up.' },
  { id: 14, brand: 'Volvo', model: 'XC60', year: 2025, type: 'SUV', registration: 'NC 644-902', dailyRate: 1700, transmission: 'Automatic', doors: 5, colour: 'Crystal White', status: 'Available', features: ['Leather seats', 'GPS', 'Pilot assist', 'Panoramic roof'], image: '/vehicles/volvo-xc60.jpg', description: 'Calm Scandinavian luxury with exceptional comfort and advanced safety technology.' },
  { id: 15, brand: 'Audi', model: 'Q5 S line', year: 2025, type: 'SUV', registration: 'NC 514-399', dailyRate: 1800, transmission: 'Automatic', doors: 5, colour: 'Daytona Grey', status: 'Rented', features: ['Quattro', 'Leather seats', 'GPS', 'Parking assist'], image: '/vehicles/audi-q5.jpg', description: 'A sophisticated all-rounder with quattro confidence and understated premium detailing.' },
  { id: 16, brand: 'BMW', model: 'M3 Competition', year: 2025, type: 'Sedan', registration: 'NC 333-080', dailyRate: 2200, transmission: 'Automatic', doors: 4, colour: 'Toronto Red', status: 'Available', features: ['M xDrive', 'Sport seats', 'GPS', 'Adaptive suspension'], image: '/vehicles/bmw-m3.jpg', description: 'A thrilling high-performance sedan with dramatic pace, precise handling and everyday usability.' },
  { id: 17, brand: 'Porsche', model: 'Macan S', year: 2025, type: 'SUV', registration: 'NC 911-264', dailyRate: 2400, transmission: 'Automatic', doors: 5, colour: 'Jet Black', status: 'Available', features: ['All-wheel drive', 'Sport Chrono', 'Leather seats', 'GPS'], image: '/vehicles/porsche-macan.jpg', description: 'Sports-car responses in a beautifully built compact luxury SUV.' },
  { id: 18, brand: 'Land Rover', model: 'Defender 110', year: 2025, type: 'SUV', registration: 'NC 110-625', dailyRate: 2600, transmission: 'Automatic', doors: 5, colour: 'Pangea Green', status: 'Available', features: ['4x4', 'Terrain response', 'Panoramic roof', 'Tow bar'], image: '/vehicles/land-rover-defender.jpg', description: 'Iconic design, formidable off-road ability and a versatile premium cabin.' },
  { id: 19, brand: 'Range Rover', model: 'Sport', year: 2025, type: 'SUV', registration: 'NC 494-721', dailyRate: 2800, transmission: 'Automatic', doors: 5, colour: 'Santorini Black', status: 'Available', features: ['Air suspension', 'Leather seats', 'Panoramic roof', 'Meridian audio'], image: '/vehicles/range-rover-sport.jpg', description: 'Commanding luxury with effortless performance and a beautifully serene interior.' },
  { id: 20, brand: 'Mercedes-AMG', model: 'G63 G-Wagon', year: 2025, type: 'SUV', registration: 'NC 063-999', dailyRate: 3200, transmission: 'Automatic', doors: 5, colour: 'Platinum Magno', status: 'Available', features: ['4x4', 'AMG performance', 'Leather seats', 'Burmester audio'], image: '/vehicles/g-wagon.jpg', description: 'The unmistakable luxury off-roader, combining handcrafted comfort with dramatic V8 performance.' },
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
