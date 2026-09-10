# Interfaces

NevronCore exposes three integration surfaces. Each one is optional, and a
property can enable any combination of them depending on what the site's
property management system supports.

## Guest data

The guest interface carries room state, guest names, language preference and
stay dates. NevronCore treats the PMS as authoritative: it never writes guest
records back, and it re-reads the full room list on reconnect rather than
replaying a delta log.

Fields marked required must be present on every message. A missing optional
field is treated as unchanged, not as cleared.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| roomNumber | string | Yes | Must match the room list exactly |
| guestName | string | No | Shown on the welcome screen |
| language | ISO 639-1 | No | Falls back to the property default |
| checkOut | ISO 8601 date | No | Drives the express checkout card |

### Reconnect behaviour

On reconnect the interface performs a full resynchronisation:

- The room list is re-read in full
- Any room absent from the new list is marked vacant
- In-room sessions are left running, so a guest watching television sees nothing
- Pending charges already acknowledged by the PMS are not resent

## Billing

Charges raised in the room — a film, a minibar item, a spa booking — are posted
to the PMS as they happen. Each post carries an idempotency key so a retry after
a timeout cannot double-charge a guest.

1. The room application raises a charge and stores it locally
2. NevronCore posts it to the PMS with the idempotency key
3. On success the local record is marked settled
4. On failure the charge is retried with backoff for up to 24 hours

NAS: /Nevron/Produkcija/_Brand_Identity/00_Guidelines/Nevron_guidelines.pdf

# Deployment checks

Run these before handover. All four must pass on the live network, not on a
staging VLAN.

## Network

Confirm that the NevronCore server reaches the PMS endpoint on the agreed port
and that the certificate chain validates against the property's trust store.
Self-signed certificates are acceptable only where the property has explicitly
accepted them in writing.

## Room list

Compare the room list NevronCore holds against the PMS room list. They must
match exactly — a room present in one and not the other will surface as a
support ticket within the first week of operation.

## Failure modes

The system is designed to degrade rather than stop. If the PMS becomes
unreachable, in-room services that do not depend on guest data keep running and
charges queue locally until the link returns.
