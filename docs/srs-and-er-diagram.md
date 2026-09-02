# Software Requirements Specification (SRS) & Database ER Diagram
## Kisan Setu — Intelligent Agricultural Procurement Platform
**SIH Problem Statement 26032**

---

## 1. Introduction
The **Kisan Setu** platform is an intelligent, capacity-aware agricultural procurement management system designed to eliminate congestion, long waiting times, distress selling, and opaque grading at Agricultural Produce Market Committee (APMC) mandis and government procurement centres.

### 1.1 Target Users
1. **Farmers**: Register crops, find nearby mandis, book capacity-aware slots, obtain digital QR tokens, track real-time queue ETA, speak to the AI Voice Assistant in regional languages, and track direct benefit transfer (DBT) payments.
2. **Procurement Officers**: Manage daily slot arrivals, scan farmer QR tokens, oversee real-time queue calls, record digital weighing (gross/tare/net), log quality grades and rejections, and trigger automated payment workflows.
3. **District Admins**: Oversee mandi operations across their district, monitor daily procurement volumes, prevent congestion, and enact AI load balancing.
4. **State Admins**: High-level governance, MSP rate configurations, cross-district analytics, fund disbursement tracking, and seasonal policy formulation.

---

## 2. Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    FARMER ||--o{ CROP : "registers"
    FARMER ||--o{ BOOKING : "creates"
    FARMER ||--o{ NOTIFICATION : "receives"
    CENTRE ||--o{ SLOT : "offers"
    CENTRE ||--o{ ADMIN : "employs"
    SLOT ||--o{ BOOKING : "allocates"
    BOOKING ||--|| TOKEN : "generates"
    BOOKING ||--o| PROCUREMENT : "results_in"
    PROCUREMENT ||--|| PAYMENT : "triggers"
    ADMIN ||--o{ AUDIT_LOG : "generates"

    FARMER {
        ObjectId _id PK
        string name
        string phone UK
        string passwordHash
        string aadhaar
        string village
        string district
        string state
        string preferredLanguage
        object bankDetails
        boolean isVerified
        date createdAt
    }

    CROP {
        ObjectId _id PK
        ObjectId farmerId FK
        string cropType
        string variety
        number estimatedQuantity
        string harvestSeason
        number mspPerQuintal
        number landAreaAcres
        date createdAt
    }

    CENTRE {
        ObjectId _id PK
        string name
        string district
        string state
        array cropsAccepted
        number dailyCapacity
        object operatingHours
        object location
        array officerIds
        number currentQueueCount
        boolean activeStatus
    }

    SLOT {
        ObjectId _id PK
        ObjectId centreId FK
        string date
        string startTime
        string endTime
        number capacity
        number bookedCount
        string status
    }

    BOOKING {
        ObjectId _id PK
        ObjectId farmerId FK
        ObjectId centreId FK
        ObjectId slotId FK
        string status
        date createdAt
    }

    TOKEN {
        ObjectId _id PK
        ObjectId bookingId FK
        ObjectId centreId FK
        string tokenNumber UK
        string qrDataUrl
        string status
        number queuePosition
        number estimatedWaitMinutes
        date checkInTime
        date serviceStartTime
        date completedTime
    }

    PROCUREMENT {
        ObjectId _id PK
        ObjectId bookingId FK
        ObjectId farmerId FK
        ObjectId centreId FK
        string crop
        number grossWeight
        number tareWeight
        number netWeight
        number acceptedQuantity
        number rejectedQuantity
        string rejectionReason
        number moisturePercentage
        string qualityGrade
        number pricePerUnit
        number totalAmount
        ObjectId recordedBy FK
        date createdAt
    }

    PAYMENT {
        ObjectId _id PK
        ObjectId procurementId FK
        ObjectId farmerId FK
        number amount
        string status
        string paymentMode
        string transactionRef
        string dbtReference
        string bankAccountMasked
        date createdAt
    }

    NOTIFICATION {
        ObjectId _id PK
        ObjectId recipientId FK
        string recipientRole
        string title
        string message
        string channel
        string type
        boolean read
        object metadata
        date createdAt
    }

    AUDIT_LOG {
        ObjectId _id PK
        ObjectId actorId FK
        string actorRole
        string action
        string targetResource
        object changes
        date timestamp
    }
```

---

## 3. End-to-End System State Machine

```mermaid
stateDiagram-v2
    [*] --> FarmerRegistered: Register & Verify Phone
    FarmerRegistered --> CropRegistered: Add Crop Details
    CropRegistered --> SlotSelected: Search Mandi & Select Date
    SlotSelected --> SlotBooked: Atomic Slot Booking (Lock & Increment)
    SlotBooked --> TokenIssued: Digital QR Token Generated
    TokenIssued --> CheckedIn: Arrival at Centre (QR Scan by Officer)
    CheckedIn --> InQueue: Joined Waiting Line
    InQueue --> BeingServed: Called by Officer
    BeingServed --> WeighedAndGraded: Gross/Tare/Net Weight & Grade Entry
    WeighedAndGraded --> ProcurementCompleted: Accepted / Rejected Quantities Finalized
    ProcurementCompleted --> PaymentInitiated: Auto-Trigger Direct Benefit Transfer
    PaymentInitiated --> PaymentProcessing: Bank & PFMS Validation
    PaymentProcessing --> PaymentPaid: Funds Disbursed to Farmer Account
    PaymentPaid --> [*]
```

---

## 4. Key Architectural Guarantees
1. **Zero Overbooking**: Atomic conditional increment (`$expr: { $lt: ["$bookedCount", "$capacity"] }`) guaranteed by MongoDB document-level locking.
2. **Sub-second Queue Synchronization**: Bi-directional WebSockets (`Socket.IO`) isolate events to mandi rooms (`centre:<id>:queue`) and farmer personal notification rooms (`farmer:<id>:token`).
3. **Inclusive Multilingual Accessibility**: AI voice interaction in Hindi, English, and Telugu for low-literacy farmers.
4. **Transparent Governance**: Every weighing calculation, quality rejection, and payment initiation creates an immutable audit trail.
