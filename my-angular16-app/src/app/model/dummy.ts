import { User,Vehicle,FuelRecord } from "./data.model";

export const USERS_DATA: User[] = [
  {
    id: 1,
    username: 'john_doe',
    email: 'john@gmail.com',
    password: '1234',
    role: 'Admin',
    status: 'Active'
  },
  {
    id: 2,
    username: 'mary_smith',
    email: 'mary@gmail.com',
    password: 'abcd',
    role: 'Manager',
    status: 'Active'
  },
  {
    id: 3,
    username: 'alex_moyo',
    email: 'alex@gmail.com',
    password: '1111',
    role: 'Attendant',
    status: 'Inactive'
  },
  {
    id: 4,
    username: 'tadi',
    email: 'tadi@gmail.com',
    password: '2222',
    role: 'Driver',
    status: 'Active'
  },
  {
    id: 5,
    username: 'linda',
    email: 'linda@gmail.com',
    password: '3333',
    role: 'Manager',
    status: 'Inactive'
  },
  {
    id: 6,
    username: 'bruce',
    email: 'bruce@gmail.com',
    password: '4444',
    role: 'Admin',
    status: 'Active'
  },
  {
    id: 7,
    username: 'charles',
    email: 'charles@gmail.com',
    password: '5555',
    role: 'Driver',
    status: 'Inactive'
  }
];
export const VEHICLES_DATA: Vehicle[] = [
  {
    NumberPlate: "ABC1234",
    make: "Toyota",
    model: "Corolla",
    ChassisNumber: "JTDBR32E720123456"
  },
  {
    NumberPlate: "XYZ5678",
    make: "Honda",
    model: "Civic",
    ChassisNumber: "2HGFB2F50FH123456"
  },
  {
    NumberPlate: "HRE9012",
    make: "Nissan",
    model: "Navara",
    ChassisNumber: "MNTCB4D23Z1234567"
  },
  {
    NumberPlate: "KLM3456",
    make: "Ford",
    model: "Ranger",
    ChassisNumber: "AFAPXXMJ2P1234567"
  },
  {
    NumberPlate: "DEF7890",
    make: "Mazda",
    model: "BT-50",
    ChassisNumber: "MM7UR4DF100123456"
  },
  {
    NumberPlate: "GHJ1122",
    make: "Isuzu",
    model: "D-Max",
    ChassisNumber: "MPATFS85JLT123456"
  }
];


export const FUEL_RECORDS: FuelRecord[] = [
  {
    id: 1,
    vehicle: "ABC1234",
    driver: "John",
    fuelType: "petrol",
    liters: 50,
    mileage: 12000,
    fuelDate: "2026-04-01",
    status: "completed",
    notes: "Full tank"
  },
  {
    id: 2,
    vehicle: "XYZ5678",
    driver: "Mike",
    fuelType: "diesel",
    liters: 70,
    mileage: 20000,
    fuelDate: "2026-04-02",
    status: "completed",
    notes: "Refill"
  },
  {
    id: 3,
    vehicle: "HRE9012",
    driver: "Sarah",
    fuelType: "petrol",
    liters: 45,
    mileage: 15000,
    fuelDate: "2026-04-03",
    status: "pending",
    notes: "Partial fill"
  },
  {
    id: 4,
    vehicle: "KLM3456",
    driver: "David",
    fuelType: "diesel",
    liters: 80,
    mileage: 30000,
    fuelDate: "2026-04-04",
    status: "completed",
    notes: "Long trip"
  },
  {
    id: 5,
    vehicle: "DEF7890",
    driver: "Anna",
    fuelType: "petrol",
    liters: 60,
    mileage: 18000,
    fuelDate: "2026-04-05",
    status: "completed",
    notes: "Top up"
  },
  {
    id: 6,
    vehicle: "GHJ1122",
    driver: "Brian",
    fuelType: "diesel",
    liters: 75,
    mileage: 25000,
    fuelDate: "2026-04-06",
    status: "completed",
    notes: "Delivery route"
  },
  {
    id: 7,
    vehicle: "AAA1111",
    driver: "Chris",
    fuelType: "petrol",
    liters: 40,
    mileage: 10000,
    fuelDate: "2026-04-07",
    status: "pending",
    notes: "Short trip"
  },
  {
    id: 8,
    vehicle: "BBB2222",
    driver: "Emma",
    fuelType: "diesel",
    liters: 90,
    mileage: 32000,
    fuelDate: "2026-04-08",
    status: "completed",
    notes: "Heavy load"
  },
  {
    id: 9,
    vehicle: "CCC3333",
    driver: "Frank",
    fuelType: "petrol",
    liters: 55,
    mileage: 17000,
    fuelDate: "2026-04-09",
    status: "completed",
    notes: "Routine fill"
  },
  {
    id: 10,
    vehicle: "DDD4444",
    driver: "Grace",
    fuelType: "diesel",
    liters: 65,
    mileage: 21000,
    fuelDate: "2026-04-10",
    status: "pending",
    notes: "Awaiting approval"
  }
];