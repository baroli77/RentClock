import RentClockDashboard from '@/components/RentClockDashboard';
import { demoProperties } from '@/lib/onboarding';
import { reminderEmail } from '@/lib/email';
import { pageMetadata } from '@/lib/site';
export const dynamic='force-dynamic';
export const metadata=pageMetadata({title:'Try the RentClock Demo',description:'Explore a fictional landlord compliance ledger and preview a reminder email. No account or card needed.',path:'/demo',eyebrow:'Interactive RentClock demo'});
export default function DemoPage(){
 const {html}=reminderEmail({site:'https://rentclock.com',lines:[{item:'Gas Safety Certificate (CP12)',property:'12 Mill Road (fictional)',status:'OVERDUE by 7 days',tone:'overdue'},{item:'Gas Safety Certificate (CP12)',property:'Park View flat (fictional)',status:'Due in 14 days',tone:'soon'}]});
 return <RentClockDashboard initialProperties={demoProperties()} email="Fictional demo account" access={true} billingOn={false} demo={true} reminderHTML={html}/>;
}
