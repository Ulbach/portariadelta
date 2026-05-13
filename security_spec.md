# Security Specification for Portaria Inteligente

## 1. Data Invariants
- A partner must belong to a company.
- An attendance record must reference a partner name (currently using names as identifiers in the sheet logic, but it should link to partner data).
- Timestamps must be valid server timestamps.
- Records are immutable once created (except for specialized admin cleanup).

## 2. The "Dirty Dozen" Payloads
1. **Identity Spoofing**: Attempt to create a record with another user's name but my own authentication context (if auth was enforced, but currently it's a kiosk-style app).
2. **Status Skipping**: Attempt to close an entry without a matching entry record (client-side logic but rules should prevent orphan exits if possible).
3. **Ghost Field**: Adding `isVerified: true` to a partner document.
4. **ID Poisoning**: Using a 1MB string as a document ID.
5. **PII Leak**: A non-admin user trying to read all partner documents (if restricted).
6. **Self-Assigned Admin**: A user trying to set `isAdmin: true` on their own profile.
7. **Future Timestamp**: Setting `timestamp` to a future date.
8. **Invalid Enum**: Setting `type` to "BREAKTIME" instead of "ENTRY" or "EXIT".
9. **Negative Duration**: (Not applicable to direct writes but to logic).
10. **Blanket Read**: Trying to query `attendance_records` without any filters.
11. **Shadow Update**: Changing a record's `company` after creation.
12. **Mass Delete**: Attempting to delete the `companies` collection.

## 3. Test Runner (Draft)
A `firestore.rules.test.ts` would verify that:
- Non-authenticated users cannot write (unless allowed for kiosk).
- Schema validation blocks invalid types.
- Immutable fields stay immutable.
