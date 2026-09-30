export const dynamic = 'force-dynamic';
import { InfoPage } from '@/components/info-page';
import { catalogue } from '@/lib/repository';
export default async function ContactPage(){
 const {branches}=await catalogue();
 return <InfoPage eyebrow="CONTACT" title="Need a hand?" intro="Keep your booking reference available when asking your rental administrator for help." sections={[
 {title:'Branches',paragraphs:branches.length?branches.map(b=>b.name+' · '+b.city):['No branch contact information has been added yet.']},
 {title:'Your booking',paragraphs:['View saved reservations and request cancellation from My Drift.']}
 ]}/>;
}
