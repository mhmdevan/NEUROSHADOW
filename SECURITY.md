# NEUROSHADOW Security Notes

## Current Security Practices

- Feedback input is validated on the backend with Zod.
- Text fields are sanitized before storage or display.
- React renders user content as text, not dangerous HTML.
- API responses use no-store caching and `X-Content-Type-Options: nosniff`.
- The UI displays a demo secure session token to make session state visible during judging.
- No real medical, biometric, or sensitive health data is collected.
- No paid external API keys are required.

## Input Validation

The feedback API checks:

- Name length.
- Optional email format if provided.
- Message length.
- Rating range from 1 to 5.

Invalid submissions return clear JSON errors.

## Safe Rendering

The app does not use `dangerouslySetInnerHTML`. Generated reports and API previews are rendered as text in modal panels.

## Demo Token

The secure token in the sidebar is a visual demo token, not authentication. It helps judges understand where a real session/security layer would appear.

## Future Authentication

A production system should add:

- User authentication.
- Role-based access.
- Study/team permissions.
- API rate limiting.
- CSRF protections for authenticated mutations.
- Audit review tools.

## Future Encryption

A production research system should add:

- TLS everywhere.
- Database encryption at rest.
- Secrets management.
- Field-level encryption for sensitive study data.
- Short retention windows.
- Export/delete controls.

## Medical Data Warning

NEUROSHADOW is an educational simulation. A real cognitive monitoring platform would require consent, privacy review, clinical validation where relevant, and strict governance before handling any real health or biometric data.
