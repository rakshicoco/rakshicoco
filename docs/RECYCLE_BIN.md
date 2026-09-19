# Dependency-Safe Recycle Bin Architecture & Policy

## 1. Overview
The Rakshi Coco ERP Recycle Bin provides a robust, dependency-safe retention framework for deleted business objects. It guarantees that accidental deletions can be restored within 90 days, while strictly preventing any destruction of historical business traceability, accounting integrity, or active operational dependencies.

---

## 2. Entity Classifications

All ERP entities are classified into three immutable categories:

| Classification | Entities | Soft Delete Rule | 90-Day Permanent Cleanup Rule |
|---|---|---|---|
| **MASTER** | `farms`, `buyers`, `teams`, `workers` | Permitted (sets `active = false` or soft-delete state). | Permitted **ONLY IF** zero downstream dependencies exist (e.g. no associated purchases, sales, or batches). |
| **OPERATIONAL** | `purchases`, `cutting_batches`, `grouping_batches`, `transport_trips`, `dispatches` | Permitted **ONLY IF** no downstream operational dependency exists. | Permitted **ONLY IF** zero downstream links exist. If dependencies exist, converted to **ARCHIVED**. |
| **FINANCIAL** | `bills`, `payments`, `expenses`, sales orders with invoices | Soft delete moves record to `VOIDED` or `CANCELLED`. | **NEVER PHYSICALLY DELETED**. Financial records are permanent for statutory accounting, tax, and audit compliance. |

---

## 3. Dependency Verification Engine

Before an operational record can be trashed, or any record permanently deleted:
1. **Farms**: Checked against `purchases` (`farm_id`).
2. **Buyers**: Checked against `sales_orders` and commercial `bills` (`buyer_id` / `entity_id`).
3. **Teams**: Checked against active `cutting_batches` (`team_id`).
4. **Purchases**: Checked against `cutting_batches` and farm payments.
5. **Sales Orders**: Checked against `dispatches` and bills.
6. **Financial Records**: Physically undeletable. Protected by hard application constraints.

---

## 4. 90-Day Retention Lifecycle

```
User Deletes Record
       ↓
Dependency Check Executed
       ↓
Record Moved to Recycle Bin
       ↓
Audit Event Created: action='TRASH' (stores scheduled_delete_at = now + 90 days)
       ↓
Within 90 Days:
   ├── User clicks "Restore" → status reverted, audit event action='RESTORE'
   └── Admin clicks "Delete" → permitted ONLY IF zero dependencies & non-financial
       ↓
After 90 Days (Automated Cron Job):
   ├── IF Zero Dependencies: Permanently deleted; audit event action='PERMANENT_DELETE'
   └── IF Active Dependencies: Preserved as ARCHIVED; audit event action='ARCHIVE'
```

---

## 5. Security of Cleanup Endpoint

Endpoint: `/api/cron/cleanup-trash` (Method: `POST`)

- **Authorization**: Requires `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>` matching server environment `CRON_SECRET`.
- **Zero Client Input**: The endpoint does not accept `entity_id`, `user_id`, or confirmation parameters from incoming requests.
- **Server Execution**: Exclusively processes expired records meeting the 90-day threshold and executes dependency checks on each record individually.
