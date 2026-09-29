# Catalogue and checkout cleanup

The homepage and /experience use the normal catalogue hero. Content no longer depends on scroll position. The catalogue supports wide displays up to a 1920px content width and four columns, with reduced-motion support.

All 70 vehicle entries remain. All referenced local main image paths exist. Existing photography is not universally 4K; several later entries reuse other model photographs. Accurate high-resolution replacement photography remains outstanding.

Preset customer details, rental dates, customer/payment records and fabricated report metrics were removed. Reports now use submitted bookings. Fleet specifications and indicative rates remain catalogue data, not verified live supplier inventory.

Authentication now has a server-checked temporary account layer with admin and client roles. The UI stores only the signed-in user profile, not the password. This layer is intentionally shaped so it can be replaced by persistent users and sessions when the production database/auth provider is connected.

Checkout no longer displays test card values or wallet placeholders. It creates the booking from validated server-side pricing and records payment as pending until a payment provider is connected. No card details are collected.

The backend still uses server memory for bookings and admin data, so persistent storage remains the main integration step before real-world launch. Accurate high-resolution fleet photography and final cross-device visual QA also remain outstanding.