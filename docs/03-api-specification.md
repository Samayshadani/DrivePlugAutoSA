# DrivePlugAutoSA - REST API Specification & Contract

**Document Version:** 1.0.0  
**Format:** RESTful JSON  
**Schema Validation:** Zod Runtime Validation  
**Auth Header:** `Authorization: Bearer <Supabase_JWT>`  
**Tenant Context Header:** `x-business-id: <UUID>`  

---

## 1. Global Conventions & Envelope

### 1.1. Standard Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 85
  }
}
```

### 1.2. Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested vehicle could not be found or belongs to another tenant.",
    "details": { "vehicleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
  }
}
```

### 1.3. Standard HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully persisted.
- `400 Bad Request`: Malformed JSON or header syntax.
- `401 Unauthorized`: Missing, expired, or invalid JWT.
- `403 Forbidden`: User lacks membership or role in specified `business_id`.
- `404 Not Found`: Resource does not exist or is invisible due to RLS.
- `409 Conflict`: Conflict with current state (e.g. invalid quotation state transition or unique constraint).
- `422 Unprocessable Entity`: Zod schema validation failure.
- `500 Internal Server Error`: Unhandled exception (sanitized in production).

---

## 2. Endpoints Specification

### 2.1. Customers Module

#### `POST /api/customers`
Creates a customer under the current tenant business.
- **Required Role:** `STAFF`, `MANAGER`, `ADMIN`, `OWNER`
- **Request Body (Zod):**
  ```json
  {
    "firstName": "Sarah",
    "lastName": "Jenkins",
    "email": "sarah.j@example.com",
    "phone": "+27825550192",
    "idNumber": "8502145028084",
    "address": "42 High Street, Rondebosch, Cape Town"
  }
  ```
- **Response `201 Created`:** Returns created Customer object with `id` and `businessId`.

#### `GET /api/customers`
Lists customers belonging to the tenant. Supports query parameters `?search=...&limit=20&page=1`.

#### `GET /api/customers/:id`
Retrieves a customer profile along with their registered vehicles and quotation history.

---

### 2.2. Vehicles Module

#### `POST /api/vehicles`
Registers a vehicle for an existing customer.
- **Required Role:** `STAFF`, `MANAGER`, `ADMIN`, `OWNER`
- **Request Body (Zod):**
  ```json
  {
    "customerId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "vin": "WBA3A5C50DF289110",
    "licensePlate": "CA 892-104",
    "make": "BMW",
    "model": "320i Sedan",
    "year": 2018,
    "mileage": 89400,
    "engineCode": "B48B20",
    "transmission": "AUTOMATIC"
  }
  ```
- **Response `201 Created`:** Returns created Vehicle record.

#### `GET /api/vehicles/:id`
Retrieves vehicle details, linked customer, and service history.

---

### 2.3. Parts & Supplier Aggregation Module

#### `GET /api/parts/search`
Searches master parts catalogue and aggregates multi-supplier pricing.
- **Query Params:**
  - `q` (string, required, e.g. `brake pads`, `oil filter`, `BOS-0986494`)
  - `category` (optional)
  - `vehicleVin` (optional, for compatibility filtering)
- **Response `200 OK`:**
  ```json
  {
    "success": true,
    "data": [
      {
        "partId": "b1e60408-...",
        "partNumber": "BOS-0986494",
        "name": "Brembo Ceramic Front Brake Pad Set",
        "category": "Braking System",
        "isOem": false,
        "supplierOffers": [
          {
            "supplierPartId": "c87a11...",
            "supplierId": "sup-bosch",
            "supplierName": "Bosch Auto Distribution",
            "costPrice": 620.00,
            "currency": "ZAR",
            "stockQuantity": 14,
            "availability": "IN_STOCK",
            "leadTimeDays": 1
          },
          {
            "supplierPartId": "d98b22...",
            "supplierId": "sup-euro",
            "supplierName": "EuroCar Wholesalers",
            "costPrice": 585.00,
            "currency": "ZAR",
            "stockQuantity": 3,
            "availability": "LOW_STOCK",
            "leadTimeDays": 2
          }
        ]
      }
    ]
  }
  ```

#### `GET /api/suppliers/:id/parts`
Returns catalogue inventory specifically supplied by the wholesaler with live wholesale pricing.

---

### 2.4. Quotation Lifecycle Module

#### `POST /api/quotations`
Initializes a new quotation in `DRAFT` state with line items, markup, and labor.
- **Request Body (Zod):**
  ```json
  {
    "customerId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "vehicleId": "e28da951-6fb7-4a81-9b16-834928e4e930",
    "notes": "Front brake vibration inspection and replacement",
    "validUntilDays": 14,
    "items": [
      {
        "itemType": "PART",
        "partId": "b1e60408-468b-47b2-a5e2-04fa3b07d611",
        "supplierPartId": "c87a1100-51dd-4444-9988-123456789012",
        "description": "Brembo Ceramic Front Brake Pad Set",
        "quantity": 1,
        "unitCost": 620.00,
        "markupPct": 30.00
      },
      {
        "itemType": "LABOR",
        "description": "Front brake disc & pad replacement labor",
        "quantity": 1,
        "laborHours": 1.5,
        "laborRate": 650.00
      }
    ]
  }
  ```
- **Response `201 Created`:** Complete quotation with computed `partsSubtotal`, `laborSubtotal`, `taxAmount` (15%), and `grandTotal`.

#### `GET /api/quotations/:id`
Retrieves quotation breakdown, customer details, vehicle details, line items, and audit history.

#### `POST /api/quotations/:id/send`
Transitions quotation from `DRAFT` $\to$ `SENT`. Dispatches notification adapter (WhatsApp / Email).
- **Allowed From:** `DRAFT` only.
- **Response `200 OK`:** Updated quotation with `sentAt` timestamp.

#### `POST /api/quotations/:id/approve`
Transitions quotation from `SENT` $\to$ `APPROVED`. Customer digital signature or workshop authorization.
- **Allowed From:** `SENT` only.
- **Auto-action:** Automatically provisions a linked record in `orders` in `PENDING` status.
- **Response `200 OK`:** Returns approved quotation and created order ID.

#### `POST /api/quotations/:id/reject`
Transitions quotation from `SENT` $\to$ `REJECTED` with reason.
- **Allowed From:** `SENT` only.

---

### 2.5. Orders Module

#### `POST /api/orders`
Manual or programmatic order placement for approved quotation.
- **Request Body (Zod):**
  ```json
  {
    "quotationId": "a90bb624-b1c4-42b4-82a1-b4ec370ce9b3"
  }
  ```
- **Response `201 Created`:** Created order details.
