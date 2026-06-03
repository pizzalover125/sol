# sol

all-in-one event organizing platform. open source alternative to luma.

## current features

- account creation
- page creation
- RSVP
- custom registration forms

## planned features

- emails
  - planning to add with Resend (resend.com)
  - confirmation email sent when somebody registers
- check-in w/ QR codes
  - user gets a "ticket" in PDF format and organizer can scan it to check them in
- calendar integration
  - .ics file + Apple Calendar / Google Calendar support
- invite only (with passcode set by org)
- CSV export
- waitlist
- page customization

## known bugs

- if you find bugs, email me at <adi@apanda.dev> or preferably PR!

## technical inforation

made with SvelteKit and Supabase. SvelteKit handles frontend + backend. Supabase handles auth + db.
