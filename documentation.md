# API Documentation — Angular Fuel Management System

**Base URL:** `http://localhost:8080/api`  
**Frontend proxy:** `/api` (proxied to Spring Boot backend)  
**Authentication:** Bearer token (JWT) stored in `localStorage`, injected by `AuthInterceptor`

---

## Auth Endpoints `/api/auth`

> No Bearer token required for these endpoints.

### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response:** User object or success message.

---

### POST `/api/auth/login`
Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "string",
  "user": { ... }
}
```

---

### GET `/api/auth/users`
Retrieve a list of all registered users.

**Response:** Array of user objects.

```json
[
  {
    "UserID": 1,
    "username": "string",
    "email": "string",
    "role": "USER | ADMIN | MANAGER",
    "status": "string",
    "department": "string",
    "IsActive": true
  }
]
```

**Frontend mapping:** `mapUser()` normalises field names to `{ userId, username, email, role, status, department, isActive }`.

---

### PATCH `/api/auth/users/{id}/role`
Update the role of a specific user.

**Path Param:** `id` — User ID  
**Request Body:**
```json
{
  "role": "USER | ADMIN | MANAGER"
}
```

---

### PATCH `/api/auth/users/{id}/active`
Enable or disable a user account.

**Path Param:** `id` — User ID  
**Request Body:**
```json
{
  "isActive": true
}
```

---

## Vehicle Endpoints `/api/vehicles`

> Bearer token required for all vehicle endpoints.

### POST `/api/vehicles`
Create a new vehicle.

**Request Body:**
```json
{
  "numberPlate": "string",
  "make": "string",
  "model": "string",
  "chassisNumber": "string"
}
```

---

### GET `/api/vehicles`
Retrieve all vehicles.

**Response:** Array of vehicle objects.

```json
[
  {
    "id": 1,
    "numberPlate": "string",
    "make": "string",
    "model": "string",
    "chassisNumber": "string"
  }
]
```

**Frontend mapping:** `mapVehicle()` normalises to `{ id, NumberPlate, make, model, ChassisNumber }`.

---

### GET `/api/vehicles/{id}`
Retrieve a single vehicle by ID.

**Path Param:** `id` — Vehicle ID  
**Response:** Single vehicle object (same shape as above).

---

### PUT `/api/vehicles/{id}`
Update an existing vehicle.

**Path Param:** `id` — Vehicle ID  
**Request Body:**
```json
{
  "numberPlate": "string",
  "make": "string",
  "model": "string",
  "chassisNumber": "string"
}
```

---

### DELETE `/api/vehicles/{id}`
Delete a vehicle by ID.

**Path Param:** `id` — Vehicle ID

---

### GET `/api/vehicles/select`
Retrieve a simplified vehicle list for use in dropdowns/select inputs.

**Response:** Array of vehicle summary objects.

---

### POST `/api/vehicles/{vehicleId}/assign`
Assign a vehicle and create a fuel record for it.

**Path Param:** `vehicleId` — Vehicle ID  
**Request Body:**
```json
{
  "vehicle_id": 1,
  "department": "string",
  "fuel_type": "petrol | diesel",
  "liters": 50,
  "mileage": 12000,
  "fuel_date": "YYYY-MM-DD",
  "notes": "string",
  "user_name": "assignedTo (driver)",
  "assignvehicles": "assignedBy (submitted by)"
}
```

---

## Fuel Endpoints `/api/fuel`

> Bearer token required for all fuel endpoints.

### GET `/api/fuel`
Retrieve all fuel records.

**Response:** Array of fuel record objects.

```json
[
  {
    "id": 1,
    "vehicle_id": 1,
    "vehicle": "ABC123 | object",
    "user_name": "string",
    "department": "string",
    "fuel_type": "petrol | diesel",
    "liters": 50,
    "mileage": 12000,
    "fuel_date": "YYYY-MM-DD",
    "status": "PENDING | APPROVED | REJECTED",
    "notes": "string",
    "created_at": "string",
    "updated_at": "string"
  }
]
```

**Frontend mapping:** `mapFuelRecord()` normalises to `{ id, vehicleId, vehicle, userId, driver, submittedBy, department, fuelType, liters, mileage, fuelDate, status, notes, createdAt, updatedAt }`.

---

### PATCH `/api/fuel/{id}/status`
Update the approval status of a fuel record.

**Path Param:** `id` — Fuel record ID  
**Request Body:**
```json
{
  "status": "APPROVED | REJECTED | PENDING"
}
```

---

### POST `/api/fuel/dispense`
Dispense fuel from a tank (deducts from tank stock).

**Request Body:**
```json
{
  "liters": 50,
  "fuel_type": "petrol | diesel"
}
```

---

### POST `/api/fuel/tank/{tankId}/refill`
Refill a fuel tank.

**Path Param:** `tankId` — `1` = Petrol, `2` = Diesel  
**Request Body:**
```json
{
  "liters": 500
}
```

---

### GET `/api/fuel/tank/{tankId}`
Get current stock/details of a specific tank.

**Path Param:** `tankId` — `1` = Petrol, `2` = Diesel  
**Response:** Tank object with current stock level.

---

### GET `/api/fuel/tank-removals`
Retrieve a log of all tank removal (dispense) events.

**Response:** Array of removal records.

```json
[
  {
    "id": 1,
    "fuelType": "petrol | diesel",
    "liters": 50,
    "mileage": null,
    "fuelDate": "YYYY-MM-DD",
    "notes": "string",
    "status": "APPROVED",
    "department": "string",
    "submittedBy": "string",
    "vehicle": "string",
    "approvedBy": "string",
    "approverRole": "string",
    "approvedAt": "string"
  }
]
```

---

## Notes

| # | Note |
|---|------|
| 1 | The API mixes `snake_case` (`fuel_type`, `fuel_date`, `user_name`) and `camelCase` (`numberPlate`, `chassisNumber`). All normalisation is handled in `ApiService` mappers. |
| 2 | Tank IDs are hardcoded: **1 = Petrol**, **2 = Diesel**. |
| 3 | JWT token is stored in `localStorage` and attached to every request (except `/auth/register` and `/auth/login`) by `AuthInterceptor`. |
| 4 | List responses may return a raw array or a wrapped `{ data: [] }` object — the frontend handles both. |
