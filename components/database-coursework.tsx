'use client';
import { useState } from 'react';
import { ArrowDown } from 'lucide-react';

const stages = [
  {
    name: 'UNF',
    title: 'Start with one rental worksheet',
    rule: 'Repeating groups make the data difficult to maintain.',
    before:
      'Rental(BookingID, CustomerName, Vehicle,\n  {ExtraID, ExtraName, Price, Quantity},\n  {FeatureID, FeatureName}, {ImageURL})',
    after: 'One booking contains lists of extras, features and images.',
    why: 'Repeating values cause duplicated data and inconsistent updates.',
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
    why: 'Move extras, features and images into separate rows with identifiable keys.',
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
    why: 'Keep feature names in Feature and current extra definitions in RentalExtra. BookingExtra stores the quantity and agreed price for each booking.',
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
    why: 'Store customer, model, category and location details once, linked by foreign keys.',
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
export function DatabaseCoursework({
  onExplore,
}: {
  onExplore: (table: string) => void;
}) {
  const [stage, setStage] = useState(0);
  const current = stages[stage];
  return (
    <section
      className="my-7 overflow-hidden rounded-3xl border border-black/10 bg-white"
      aria-labelledby="coursework-title"
    >
      <div className="p-6 pb-0 sm:p-8 sm:pb-0">
        <h2
          id="coursework-title"
          className="text-2xl font-semibold tracking-tight"
        >
          Normalization
        </h2>
      </div>
      <div className="p-6 sm:p-8">
        <div>
          <div
            className="grid grid-cols-4 gap-2"
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
              <div className="min-w-0 rounded-2xl bg-[#f5f5f7] p-5" key={label}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-black/45">
                  {label}
                </p>
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6">
                  {code}
                </pre>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-black/65">{current.why}</p>
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
          {stage === 3 && (
            <p className="mt-5 text-xs leading-5 text-black/50">
              Historical booking snapshots and stored totals are intentional
              exceptions to strict physical 3NF.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
