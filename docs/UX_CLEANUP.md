# Catalogue and checkout cleanup

The homepage and /experience use the normal catalogue hero. Content no longer depends on scroll position. The catalogue supports wide displays up to a 1920px content width and four columns, with reduced-motion support.

All 70 vehicle entries remain. All referenced local main image paths exist. Existing photography is not universally 4K; several later entries reuse other model photographs. Accurate high-resolution replacement photography remains outstanding.

Preset customer details, rental dates, customer/payment records and booking seeds were removed. Reports use submitted bookings. Fleet specifications and indicative rates remain catalogue data, not verified live supplier inventory.

Guests can enter a name, email and dates and open checkout directly. Test card values are read-only and no card data is sent to the server. Successful API responses show simulated payment approval. Invalid requests show an error; totals are calculated from server rates. The existing backend remains in memory and resets on restart.

Validation: TypeScript and production build passed. Browser catalogue displayed 70 cards. Valid API booking approved at the server-calculated amount; malformed input returned 400. Repository lint still reports existing component accessibility and React conventions.
