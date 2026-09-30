import { InfoPage } from '@/components/info-page';
export default function PrivacyPage(){return <InfoPage eyebrow="PRIVACY" title="Privacy, without the fog." intro="Drift collects only the information needed to represent the booking workflow in this university assignment." sections={[
{title:'Information used',paragraphs:['The booking flow uses a customer name, email address, rental dates, branch choices, selected vehicle and optional extras.']},
{title:'Storage',paragraphs:['Accounts and bookings are stored in MySQL. Passwords are stored as salted hashes. Sign-in uses a revocable session cookie.']},
{title:'Payment data',paragraphs:['Drift does not currently collect or store card details because no payment provider is connected.']},
{title:'Email confirmations',paragraphs:['Email delivery is not enabled. Booking references and status are available in My Drift.']}
]}/>;}