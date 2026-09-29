import { InfoPage } from '@/components/info-page';
export default function PrivacyPage(){return <InfoPage eyebrow="PRIVACY" title="Privacy, without the fog." intro="Drift collects only the information needed to represent the booking workflow in this university assignment." sections={[
{title:'Information used',paragraphs:['The booking flow uses a customer name, email address, rental dates, branch choices, selected vehicle and optional extras.']},
{title:'Storage',paragraphs:['Persistent database storage has not been connected yet. Current server data can reset when the application restarts. Production database and session security are planned as the next backend phase.']},
{title:'Payment data',paragraphs:['Drift does not currently collect or store card details because no payment provider is connected.']},
{title:'Email confirmations',paragraphs:['When a configured Hostinger mailbox is available, Drift can send a confirmation email containing booking details and the booking reference.']}
]}/>;}