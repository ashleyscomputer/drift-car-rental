import { InfoPage } from '@/components/info-page';
export default function FaqPage(){return <InfoPage eyebrow="FAQ" title="Questions, answered." intro="Booking, availability, extras and cancellations." sections={[
 {title:'Do I need an account?',paragraphs:['Yes. Sign in or register to save a reservation and manage it from My Drift. Browsing the fleet does not require an account.']},
 {title:'How does availability work?',paragraphs:['The server checks vehicle status and overlapping dates before saving a booking. Pick-up and return dates are inclusive for availability.']},
 {title:'Can I add extras?',paragraphs:['Available extras and prices are loaded from the database. Your total is recalculated at checkout.']},
 {title:'How do cancellations work?',paragraphs:['Request cancellation from My Drift. An administrator must approve the request before the vehicle is released.']},
 {title:'What happens when I pay?',paragraphs:['Your payment is approved automatically and your reservation is saved. No card details are collected and no money is charged.']}
 ]}/>;}
