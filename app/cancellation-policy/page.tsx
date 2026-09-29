import { InfoPage } from '@/components/info-page';
export default function CancellationPolicyPage(){return <InfoPage eyebrow="CANCELLATIONS" title="Request first. Admin confirms." intro="Drift uses an approval-based cancellation workflow so a customer request does not silently remove an active booking." sections={[
{title:'Requesting a cancellation',paragraphs:['Signed-in clients can select Request cancellation in My Drift. The booking moves to Cancellation Requested while it waits for admin review.']},
{title:'Admin decision',paragraphs:['An admin can approve the cancellation, changing the booking to Cancelled, or keep the booking confirmed.']},
{title:'Fees and refunds',paragraphs:['No real payment provider is connected, so cancellation fees and refunds are not processed in this assignment version. A production implementation would apply the rental company rules before issuing any refund.']}
]}/>;}