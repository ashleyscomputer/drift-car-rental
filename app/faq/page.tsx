import { InfoPage } from '@/components/info-page';
export default function FaqPage(){return <InfoPage eyebrow="FAQ" title="Questions, answered." intro="The essentials about booking, availability, extras and cancellations." sections={[
{title:'Can I book without an account?',paragraphs:['Yes. Drift keeps guest booking available. Signing in gives you the My Drift dashboard, where your bookings are easier to manage.']},
{title:'How does availability work?',paragraphs:['Vehicle status is checked when you book, and overlapping rental dates for the same vehicle are rejected before confirmation.']},
{title:'Can I add extras?',paragraphs:['Yes. Optional extras include enhanced cover, an additional driver, child seat, GPS, unlimited mileage and vehicle delivery. The server recalculates extras before the booking is created.']},
{title:'How do cancellations work?',paragraphs:['Signed-in clients can request a cancellation from My Drift. The request appears in the admin dashboard and must be approved before the booking changes to Cancelled.']},
{title:'Are online payments active?',paragraphs:['No payment provider is connected for this university assignment. Confirmed bookings remain marked as Payment Pending.']}
]}/>;}