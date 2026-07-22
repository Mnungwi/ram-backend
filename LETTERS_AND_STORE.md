# Letters & Store Module — API Reference

## LETTER PROCESSING

### Letter Lifecycle
```
draft → pending_approval → approved → sent → archived
           ↑ submit()        ↑ approve()  ↑ send()
```

### Compose a Letter
```
POST /api/letters
POST /api/projects/:projectId/letters
```
```json
{
  "subject": "Re: Site Inspection Schedule",
  "body": "Dear Sir,\n\nWith reference to the above subject...\n\nWe remain yours faithfully.",
  "letterDate": "2026-06-29",
  "type": "outgoing",
  "priority": "high",
  "toName": "Hassan Juma",
  "toTitle": "Site Engineer",
  "toOrg": "Farida Projects Ltd",
  "toEmail": "hassan@farida.co.tz",
  "fromName": "Ali Mohamed",
  "fromTitle": "Project Manager",
  "fromOrg": "Farida Projects Ltd",
  "ccRecipients": [
    { "name": "Fatma Salum",   "title": "Finance Officer", "email": "fatma@farida.co.tz" },
    { "name": "Mohamed Said",  "title": "QS",              "email": "msaid@farida.co.tz" }
  ],
  "referenceNo": "ZAE-2026-001"
}
```

### Letter Workflow Endpoints

| Action | Method | Endpoint | Permission |
|--------|--------|----------|------------|
| Create | POST | `/api/letters` | `letter:create` |
| Edit | PUT | `/api/letters/:id` | `letter:update` |
| Submit for approval | POST | `/api/letters/:id/submit` | `letter:send` |
| Approve | POST | `/api/letters/:id/approve` | `letter:approve` |
| Send | POST | `/api/letters/:id/send` | `letter:send` |
| Archive | POST | `/api/letters/:id/archive` | `letter:update` |
| Delete (draft only) | DELETE | `/api/letters/:id` | `letter:delete` |
| **Preview (HTML)** | GET | `/api/letters/:id/preview` | `letter:view` |
| **Download PDF** | GET | `/api/letters/:id/download` | `letter:download` |
| My inbox | GET | `/api/letters/inbox` | `letter:view` |
| Stats | GET | `/api/projects/:id/letters/stats` | `letter:view` |

### PDF Download
- With puppeteer installed → returns `application/pdf`
- Without puppeteer → returns print-ready HTML (triggers `window.print()` on load)
- Install: `npm install puppeteer`

### CC Recipients
CC is stored as a JSON array on the letter. Each entry:
```json
{ "name": "Full Name", "title": "Job Title", "email": "email@example.com" }
```
CC recipients appear in the rendered letterhead and PDF.

### Letter Types
`outgoing` · `incoming` · `internal` · `memo`

### Priority Levels
`low` · `normal` · `high` · `urgent` (color-coded in letterhead)

---

## STORE / INVENTORY MODULE

### Store Lifecycle

#### Receiving Items (GRN — Goods Received Note)
```
Purchase Order → GRN created → items received → stock increased
```

```
POST /api/store/receipts
POST /api/projects/:projectId/store/receipts
```
```json
{
  "receivedDate": "2026-06-29",
  "supplierId": "uuid-of-supplier",
  "purchaseOrderId": "uuid-of-po",
  "deliveryNote": "DN-2026-055",
  "invoiceRef": "INV-2026-030",
  "notes": "Partial delivery — cement bags short by 10",
  "lines": [
    {
      "storeItemId": "uuid-of-item",
      "qtyOrdered": 100,
      "qtyReceived": 90,
      "qtyRejected": 0,
      "unitCost": 25000,
      "batchNo": "B2026-06"
    }
  ]
}
```
Stock is **updated atomically** — each received line posts to the stock ledger immediately.

#### Issuing Items (MIN — Material Issue Note)
```
Request created → pending_approval → approved → dispatched → (returned)
```

**Step 1 — Create request:**
```
POST /api/store/issues
POST /api/projects/:projectId/store/issues
```
```json
{
  "issueDate": "2026-06-29",
  "issuedToName": "Hassan Juma",
  "activityId": "uuid-of-activity",
  "purpose": "Foundation works — concrete mix",
  "lines": [
    { "storeItemId": "uuid", "qtyRequested": 20, "unitCost": 25000 },
    { "storeItemId": "uuid", "qtyRequested": 5,  "unitCost": 15000 }
  ]
}
```

**Step 2 — Approve:**
```
POST /api/store/issues/:issueId/approve
```

**Step 3 — Dispatch (deducts stock):**
```
POST /api/store/issues/:issueId/dispatch
```
```json
{
  "lines": [
    { "issueLineId": "uuid-of-line", "qtyIssued": 20 }
  ]
}
```

**Step 4 — Return (optional):**
```
POST /api/store/issues/:issueId/return
```
```json
{ "lines": [{ "issueLineId": "uuid", "qtyReturned": 3 }] }
```

### Stock Endpoints

| Endpoint | Description | Permission |
|----------|-------------|------------|
| `GET /api/store/overview` | Dashboard stats + low-stock list | `store:view` |
| `GET /api/store` | List all items | `store:view` |
| `POST /api/store` | Add new item | `store:create` |
| `GET /api/store/items/:id` | Item detail + recent transactions | `store:view` |
| `PUT /api/store/items/:id` | Update item | `store:update` |
| `POST /api/store/items/:id/adjust` | Manual stock adjustment | `store:adjust` |
| `GET /api/store/items/:id/ledger` | Full transaction history | `store:view` |
| `GET /api/store/receipts` | List GRNs | `store:view` |
| `POST /api/store/receipts` | Create GRN (receive items) | `store:receive` |
| `GET /api/store/issues` | List MINs | `store:view` |
| `POST /api/store/issues` | Create MIN (request items) | `store:issue` |
| `POST /api/store/issues/:id/approve` | Approve issue | `store:issue` |
| `POST /api/store/issues/:id/dispatch` | Dispatch items | `store:issue` |
| `POST /api/store/issues/:id/return` | Return items | `store:issue` |

### Store Overview Response
```json
{
  "totalItems": 42,
  "totalValue": 18500000,
  "receiptsThisMonth": 8,
  "issuesThisMonth": 15,
  "lowStockItems": [
    { "id": "...", "name": "Cement (50kg bags)", "stockOnHand": 5, "reorderLevel": 20, "unit": "bags" }
  ]
}
```

### Stock Transaction Types
`receipt` · `issue` · `return` · `adjustment` · `transfer`

Positive qty = stock in. Negative qty = stock out. Every transaction is **immutable** (no updates or deletes on `stock_transactions`).
