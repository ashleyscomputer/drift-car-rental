import { InfoPage } from '@/components/info-page';
export default function RentalTermsPage(){return <InfoPage eyebrow="RENTAL TERMS" title="Clear terms for a clear drive." intro="These terms describe the booking rules represented by the Drift university project." sections={[
{title:'Bookings and availability',paragraphs:['A booking is created only after the selected vehicle is available for the requested dates. Vehicle status and overlapping reservations may prevent a booking from being confirmed.']},
{title:'Pricing',paragraphs:['Displayed rates are daily rental rates used by the assignment. The booking total is recalculated by the server and may include selected optional extras.']},
{title:'Driver responsibility',paragraphs:['A real rental operation would verify driver eligibility, licence details, deposits, insurance and identity before handover. Those production checks are outside the current assignment scope.']},
{title:'Payment',paragraphs:['No real online payment provider is connected. Payments are automatically approved as simulations. Reservations are saved, but no money is charged.']}
]}/>;}