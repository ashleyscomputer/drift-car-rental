'use client';
import { useState } from 'react';
import { BookOpen, ArrowDown, ArrowRight } from 'lucide-react';

const stages = [
  {
    name: 'UNF',
    title: 'Start with one rental worksheet',
    rule: 'Repeating groups make the data difficult to maintain.',
    before:
      'Rental(BookingID, CustomerName, Vehicle,\n  {ExtraID, ExtraName, Price, Quantity},\n  {FeatureID, FeatureName}, {ImageURL})',
    after: 'One booking contains lists of extras, features and images.',
    why: 'A single cell would contain several values. Editing a feature or extra could require changing many rental records, and deleting the last booking could lose catalogue information.',
    tables: ['booking', 'vehicle'],
  },
  {
    name: '1NF',
    title: 'Give each field one value',
    rule: 'Remove repeating groups and identify each row with a key.',
    before:
      'Vehicle: Features = {Air conditioning, Bluetooth}\nBooking: Extras = {Extra A, Extra B}',
    after:
      'BookingFlat(BookingID, CustomerID, VehicleID, ...)\nBookingExtraFlat(BookingID, ExtraID, ExtraName, Price, Quantity)\nVehicleFeatureFlat(VehicleID, FeatureID, FeatureName)\nVehicleImage(ImageID, VehicleID, ImageURL)',
    why: 'Extras, features and images become separate rows. The paired IDs identify association rows. Descriptive fields are still repeated at this intermediate stage.',
    tables: ['bookingextra', 'vehiclefeature', 'vehicleimage'],
  },
  {
    name: '2NF',
    title: 'Depend on the whole key',
    rule: 'Remove partial dependencies from relations with composite keys.',
    before:
      '(VehicleID, FeatureID) → FeatureName\nBut FeatureID alone determines FeatureName.',
    after:
      'Feature(FeatureID PK, FeatureName)\nVehicleFeature(VehicleID PK/FK, FeatureID PK/FK)\nRentalExtra(ExtraID PK, current name, current price)\nBookingExtra(BookingID, ExtraID, agreed price, quantity)',
    why: 'Feature descriptions belong to Feature. Current extra definitions belong to RentalExtra; the quantity and price agreed for a specific booking belong to BookingExtra. Its booking/extra pair is unique even though it also has a surrogate primary key.',
    tables: ['feature', 'vehiclefeature', 'rentalextra', 'bookingextra'],
  },
  {
    name: '3NF',
    title: 'Remove indirect dependencies',
    rule: 'Move facts about another entity into that entity’s own table.',
    before:
      'BookingID → VehicleID → ModelID → CategoryID\nBranchID → CityID → ProvinceID → ProvinceName',
    after:
      'Booking → Customer, Vehicle, pickup Branch, return Branch\nVehicle → VehicleModel → VehicleCategory\nVehicle → Branch → City → Province',
    why: 'Store current customer, model, category and location details once and reference them with foreign keys. Changes to a province name or model description no longer require updating every booking.',
    tables: [
      'customer',
      'vehiclemodel',
      'vehiclecategory',
      'branch',
      'city',
      'province',
    ],
  },
];
const requirements = [
  [
    'Create/add tables',
    'Admin → Database → Manage your tables',
    'Creates actual custom_ tables with a primary key and chosen columns. The brief repeats this requirement in items 1 and 4.',
  ],
  [
    'Add and update data',
    'Admin → Vehicles or Manage your tables',
    'Add a vehicle or a custom-table record, edit it, then reload to show persistence.',
  ],
  [
    'Remove data',
    'Manage your tables → Delete',
    'Deletes a custom-table row. Vehicle removal archives the asset to preserve booking history.',
  ],
  [
    'Remove a table',
    'Manage your tables → Remove table permanently',
    'Type its full name to confirm. Core account and rental tables are protected.',
  ],
  [
    'Produce at least four reports',
    'Admin → Reports',
    'Booking value, fleet status, booking status and top vehicles each export to PDF.',
  ],
  [
    'System overview',
    'Overview in this section + written report',
    'Explain the rental setting, users, automated processes and data flow.',
  ],
  [
    'ER diagram and implemented tables',
    'Schema explorer below + written report',
    'Inspect the real primary/foreign keys. The report covers all 24 core relationships across 21 core tables.',
  ],
  [
    'UNF → 3NF process',
    'Normalization in this section + written report',
    'Explain the decomposition and the physical snapshot/derived-value exceptions.',
  ],
];
const sections = [
  'Overview',
  'Normalization',
  'Rubric checklist',
  'Presentation guide',
] as const;

export function DatabaseCoursework({
  onExplore,
}: {
  onExplore: (table: string) => void;
}) {
  const [section, setSection] =
    useState<(typeof sections)[number]>('Normalization');
  const [stage, setStage] = useState(0);
  const current = stages[stage];
  return (
    <section
      className="my-7 overflow-hidden rounded-3xl border border-black/10 bg-white"
      aria-labelledby="coursework-title"
    >
      <div className="border-b border-black/5 p-6 sm:p-8">
        <p className="flex items-center gap-2 text-xs font-semibold tracking-widest text-[#0071e3]">
          <BookOpen size={16} />
          DATABASE SYSTEMS · 2026
        </p>
        <h2
          id="coursework-title"
          className="mt-3 text-2xl font-semibold tracking-tight"
        >
          Understand the design.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-black/50">
          Explore how Drift’s database is structured and connect the working
          system to your assignment requirements.
        </p>
        <nav
          className="mt-5 flex flex-wrap gap-2"
          aria-label="Database coursework sections"
        >
          {sections.map((s) => (
            <button
              type="button"
              key={s}
              aria-pressed={section === s}
              onClick={() => setSection(s)}
              className={`rounded-full px-4 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-blue-600 ${section === s ? 'bg-[#0071e3] text-white' : 'bg-[#f5f5f7] text-black/60 hover:bg-black/10'}`}
            >
              {s}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6 sm:p-8">
        {section === 'Overview' && (
          <div className="space-y-5 text-sm leading-6">
            <h3 className="text-xl font-semibold">
              A car-rental service, connected by data.
            </h3>
            <p>
              Customers browse vehicles, choose rental dates and extras, create
              reservations, request cancellations and download receipts.
              Administrators manage the fleet, review bookings, approve
              cancellations and produce reports.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [
                  'Customer interface',
                  'Collects rental choices and displays the customer’s own bookings.',
                ],
                [
                  'Application server',
                  'Checks sessions, permissions, prices and booking conflicts.',
                ],
                [
                  'MySQL database',
                  'Stores accounts, vehicles, reservations and audit history.',
                ],
              ].map(([title, text]) => (
                <article key={title} className="rounded-2xl bg-[#f5f5f7] p-5">
                  <h4 className="font-semibold">{title}</h4>
                  <p className="mt-2 text-black/55">{text}</p>
                </article>
              ))}
            </div>
            <p>
              The 21 core tables separate locations, fleet definitions, accounts
              and rental transactions. Payments approve automatically without
              collecting money. The schema explorer below reads actual database
              metadata; custom tables are additional to the core model.
            </p>
          </div>
        )}
        {section === 'Normalization' && (
          <div>
            <p className="text-xs text-black/50">
              Illustrative schema walkthrough · does not insert or change
              database records
            </p>
            <div
              className="mt-4 grid grid-cols-4 gap-2"
              aria-label="Normalization stages"
            >
              {stages.map((s, i) => (
                <button
                  type="button"
                  key={s.name}
                  aria-pressed={stage === i}
                  onClick={() => setStage(i)}
                  className={`rounded-xl border p-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-600 ${stage === i ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-black/10 text-black/50'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <h3 className="mt-6 text-xl font-semibold">{current.title}</h3>
            <p className="mt-2 text-sm text-black/55">{current.rule}</p>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {[
                ['Starting point', current.before],
                ['Result', current.after],
              ].map(([label, code]) => (
                <div
                  className="min-w-0 rounded-2xl bg-[#f5f5f7] p-5"
                  key={label}
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-black/45">
                    {label}
                  </p>
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6">
                    {code}
                  </pre>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-black/65">
              {current.why}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {current.tables.map((t) => (
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-xs text-blue-700 hover:bg-blue-50"
                  key={t}
                  onClick={() => onExplore(t)}
                >
                  Inspect {t}
                  <ArrowDown size={12} />
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-between">
              <button
                type="button"
                disabled={stage === 0}
                className="text-sm text-black/60 disabled:opacity-30"
                onClick={() => setStage(stage - 1)}
              >
                Previous stage
              </button>
              <button
                type="button"
                disabled={stage === 3}
                className="flex items-center gap-2 text-sm text-blue-700 disabled:opacity-30"
                onClick={() => setStage(stage + 1)}
              >
                Next stage
                <ArrowRight size={14} />
              </button>
            </div>
            <details
              className="mt-6 rounded-2xl border border-blue-100 p-5"
              open
            >
              <summary className="cursor-pointer text-sm font-semibold">
                Logical 3NF and the physical implementation
              </summary>
              <p className="mt-3 text-sm leading-6 text-black/60">
                Drift keeps historical names and prices on reservations so later
                profile or catalogue edits do not rewrite booking history.
                Generated subtotals and totals, and the stored extras total,
                also materialize derived values. These are deliberate physical
                exceptions: do not claim that every stored column is strictly
                3NF. Explain the normalized decomposition and these trade-offs
                in your report. Custom tables must be normalized by their
                designer; creating a primary key alone does not establish 3NF.
              </p>
            </details>
          </div>
        )}
        {section === 'Rubric checklist' && (
          <div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Report', '40 marks'],
                ['Implementation', '50 marks'],
                ['Extra effort', '10 marks'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[#f5f5f7] p-4">
                  <p className="text-xs text-black/50">{label}</p>
                  <p className="mt-1 font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-black/50">
              Mapped to the supplied Database Systems project 2026 brief. This
              is an evidence guide, not an awarded mark or confirmation of
              submission.
            </p>
            <div className="mt-5 space-y-3">
              {requirements.map(([title, where, evidence]) => (
                <article
                  key={title}
                  className="rounded-2xl border border-black/10 p-4"
                >
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-1 text-xs font-medium text-blue-700">
                    {where}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-black/55">
                    {evidence}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-[#f5f5f7] p-5">
              <h3 className="font-semibold">Still owned by the group</h3>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Confirm five members, with at least one from ICT, Data Science
                and Computer Science. Include names, student numbers and streams
                in the written report. Submit the report and system on Moodle by
                12 October 2026. The brief lists presentations for 11–12
                October, 09:00–17:00; confirm your allocated slot.
              </p>
            </div>
          </div>
        )}
        {section === 'Presentation guide' && (
          <div>
            <h3 className="text-xl font-semibold">
              Show the database doing the work.
            </h3>
            <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-black/65">
              {[
                'Explain the rental service and the customer/admin roles.',
                'Walk through UNF, 1NF, 2NF and 3NF using the normalization stages.',
                'Use the schema explorer to show primary keys, foreign keys, CHECK constraints and generated columns.',
                'Create a custom table with suitable columns. Add a record, edit it, reload and show that the changes persisted.',
                'Delete the record, then remove the custom table using its exact name.',
                'Create a reservation and explain server pricing, date-conflict prevention and automatic payment approval.',
                'Download each of the four admin reports and a customer receipt. Explain why booking value is not collected revenue.',
                'Show a cancellation request and administrator approval, then point to the audit-history relationship.',
              ].map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="mt-6 rounded-2xl bg-blue-50 p-5 text-sm leading-6 text-blue-900">
              Extra-effort evidence: the live schema explorer, PDF downloads,
              role-based access, transaction locking, cancellation history and
              responsive interface. Explain what is implemented without
              promising a particular mark.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
