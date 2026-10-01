import {writeFile,access,unlink} from 'node:fs/promises';
import mysql from 'mysql2/promise';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000';
const tag='verify-'+randomBytes(6).toString('hex');
const emails=[tag+'@example.invalid',tag+'-other@example.invalid'];
const password=randomBytes(24).toString('hex');
const db=await mysql.createConnection({host:process.env.MYSQL_HOST,user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,decimalNumbers:true});
async function api(path,method='GET',body,cookie='',expected=200,origin=base){
 const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:body?JSON.stringify(body):undefined});
 const raw=await r.text();let data;try{data=JSON.parse(raw);}catch{data={error:raw.slice(0,200)};}assert.equal(r.status,expected,path+': '+JSON.stringify(data));return {data,cookie:r.headers.get('set-cookie')?.split(';')[0]||cookie};
}
const [originalCategories]=await db.execute("SELECT category_id FROM VehicleCategory WHERE category_name='Sedan'");
let vehicleId,branchId,extraId;
try{
 await api('/api/bookings','GET',undefined,'',401);
 await api('/api/database/schema','GET',undefined,'',401);
 await api('/api/reports/pdf','GET',undefined,'',401);
 await api('/api/account/documents','GET',undefined,'',401);
 const admin=await api('/api/auth/register','POST',{firstName:'Verification',lastName:tag,email:emails[0],password},'',201);
 const other=await api('/api/auth/register','POST',{firstName:'Verification',lastName:tag,email:emails[1],password},'',201);
 await api('/api/auth/login','POST',{email:emails[0],password:password+'x'},'',401);
 await api('/api/vehicles','POST',{},other.cookie,403);
 await api('/api/database/schema','GET',undefined,other.cookie,403);
 await api('/api/reports/pdf','GET',undefined,other.cookie,403);
 await api('/api/catalogue','POST',{},admin.cookie,403);
 await db.execute("UPDATE AppUser SET role='Admin' WHERE login_email=?",[emails[0]]);
 const session=await api('/api/auth/session','GET',undefined,admin.cookie);assert.equal(session.data.user.role,'admin');
 await api('/api/reports/pdf?kind=invalid','GET',undefined,admin.cookie,400);
 for (const kind of ['summary','booking-value','fleet-utilisation','booking-status','top-vehicles']) {
  const pdf = await fetch(base+'/api/reports/pdf?kind='+kind,{headers:{Cookie:admin.cookie}});
  assert.equal(pdf.status,200);assert.equal(pdf.headers.get('content-type'),'application/pdf');
  assert.equal(pdf.headers.get('cache-control'),'no-store');assert.ok(pdf.headers.get('content-disposition').includes('.pdf'));
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
 }
 const schema=await api('/api/database/schema','GET',undefined,admin.cookie);
 assert.ok(schema.data.tables.some(t=>t.name.toLowerCase()==='booking'&&t.ddl.startsWith('CREATE TABLE')&&t.columns.some(c=>c.key==='PRI')));
 assert.ok(schema.data.relations.some(r=>r.table.toLowerCase()==='booking'&&r.targetTable.toLowerCase()==='vehicle'));
 assert.ok(schema.data.tables.some(t=>t.checks.length>0));
 const branch=await api('/api/catalogue','POST',{kind:'branch',name:tag,province:tag,city:tag,address:'Temporary verification record'},admin.cookie,201);branchId=branch.data.id;
 const extra=await api('/api/catalogue','POST',{kind:'extra',name:tag,code:tag,price:50,pricing:'daily'},admin.cookie,201);extraId=extra.data.id;
 const vehicle={brand:tag,model:tag,year:2026,type:'Sedan',registration:tag,dailyRate:5010,transmission:'Automatic',doors:4,colour:'Verification',status:'Available',features:[],image:'',description:'Temporary verification record',branchId,tier:'Premium'};
 vehicleId=(await api('/api/vehicles','POST',vehicle,admin.cookie,201)).data.id;
 const fleet=await api('/api/vehicles');assert.ok(fleet.data.some(v=>v.id===vehicleId&&v.dailyRate===5010&&v.rating===null));
 if(process.argv.includes('--browser')){
  await writeFile('tmp/mysql-browser-fixture.json',JSON.stringify({vehicleId,branchId,email:emails[1],password}));
  console.log('Temporary browser fixture ready.');
  const deadline=Date.now()+600000;
  while(Date.now()<deadline){try{await access('tmp/mysql-browser-done');break;}catch{await new Promise(r=>setTimeout(r,500));}}
  for(const path of ['tmp/mysql-browser-fixture.json','tmp/mysql-browser-done'])await unlink(path).catch(()=>{});
 }
 const date=offset=>new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
 const booking={vehicleId,startDate:date(7),endDate:date(9),pickupBranchId:branchId,returnBranchId:branchId,extras:[tag],idempotencyKey:randomUUID(),expectedTotal:10120};
 await api('/api/bookings','POST',{...booking,expectedTotal:1},other.cookie,409);
 await api('/api/bookings','POST',booking,other.cookie,403,'https://untrusted.invalid');
 const pair=await Promise.all([api('/api/bookings','POST',booking,other.cookie,201),api('/api/bookings','POST',booking,other.cookie,201)]);
 assert.equal(pair[0].data.id,pair[1].data.id);assert.equal(pair[0].data.totalCost,10120);assert.equal(pair[0].data.paymentStatus,'DemoApproved');
 const id=pair[0].data.id;
 await api('/api/account/documents?booking='+id,'GET',undefined,admin.cookie,404);
 await api('/api/account/documents?booking=invalid','GET',undefined,other.cookie,400);
 for(const [suffix,file] of [['?booking='+id,'receipt'],['','report']]){
  const document=await fetch(base+'/api/account/documents'+suffix,{headers:{Cookie:other.cookie}});
  assert.equal(document.status,200);assert.equal(document.headers.get('content-type'),'application/pdf');
  assert.equal(document.headers.get('cache-control'),'private, no-store');
  const bytes=Buffer.from(await document.arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
  await writeFile('tmp/customer-'+file+'-verified.pdf',bytes);
 }
 if(process.argv.includes('--receipts-browser')){
  await writeFile('tmp/receipt-browser-fixture.json',JSON.stringify({email:emails[1],password,reference:id}));
  console.log('Receipt browser fixture ready.');
  const deadline=Date.now()+600000;
  while(Date.now()<deadline){try{await access('tmp/receipt-browser-done');break;}catch{await new Promise(r=>setTimeout(r,500));}}
  for(const path of ['tmp/receipt-browser-fixture.json','tmp/receipt-browser-done'])await unlink(path).catch(()=>{});
 }

 await api('/api/bookings','POST',{...booking,idempotencyKey:randomUUID()},other.cookie,409);
 const own=await api('/api/bookings','GET',undefined,other.cookie);assert.ok(own.data.some(b=>b.id===id));assert.equal(own.data[0].paymentStatus,'DemoApproved');
 const [payments]=await db.execute('SELECT p.status,p.is_demo,b.is_demo booking_demo FROM Payment p JOIN Booking b ON b.booking_id=p.booking_id WHERE b.booking_reference=?',[id]);
 assert.deepEqual(payments.map(p=>[p.status,p.is_demo,p.booking_demo]),[['DemoApproved',1,0]]);
 await api('/api/bookings','PATCH',{id,status:'Completed'},other.cookie,403);
 await api('/api/bookings','PATCH',{id,status:'Cancellation Requested'},other.cookie);
 await api('/api/bookings','POST',{...booking,idempotencyKey:randomUUID()},other.cookie,409);
 await api('/api/bookings','PATCH',{id,status:'Cancelled'},admin.cookie);
 const cancelledReceipt=await fetch(base+'/api/account/documents?booking='+id,{headers:{Cookie:other.cookie}});assert.equal(cancelledReceipt.status,200);await writeFile('tmp/customer-cancelled-verified.pdf',Buffer.from(await cancelledReceipt.arrayBuffer()));
 await api('/api/bookings','POST',{...booking,idempotencyKey:randomUUID()},other.cookie,201);
 await api('/api/vehicles','DELETE',{id:vehicleId},admin.cookie,409);
 const report=await api('/api/reports','GET',undefined,admin.cookie);assert.ok(report.data.revenue.total>=0);
 await api('/api/database','GET',undefined,other.cookie,403);
 await api('/api/auth/logout','POST',{},other.cookie);
 await api('/api/bookings','GET',undefined,other.cookie,401);
 console.log('PASS: real MySQL registration, sessions, permissions, fleet, server pricing, concurrent retry deduplication, overlap prevention, payment simulation, cancellation and logout.');
}finally{
 await db.beginTransaction();
 try{
  const [bookings]=await db.execute('SELECT booking_id FROM Booking WHERE customer_email IN (?,?)',emails);
  for(const {booking_id:id} of bookings){
   for(const table of ['VehicleReview','BookingEmail','CancellationRequest','BookingStatusHistory','Payment','BookingExtra'])await db.execute('DELETE FROM '+table+' WHERE booking_id=?',[id]);
   await db.execute('DELETE FROM Booking WHERE booking_id=?',[id]);
  }
  const [users]=await db.execute('SELECT user_id,customer_id FROM AppUser WHERE login_email IN (?,?)',emails);
  for(const u of users){
   await db.execute('DELETE FROM UserSession WHERE user_id=?',[u.user_id]);
   await db.execute('DELETE FROM AppUser WHERE user_id=?',[u.user_id]);
   await db.execute('DELETE FROM Customer WHERE customer_id=?',[u.customer_id]);
  }
  if(vehicleId){for(const table of ['VehicleImage','VehicleFeature'])await db.execute('DELETE FROM '+table+' WHERE vehicle_id=?',[vehicleId]);await db.execute('DELETE FROM Vehicle WHERE vehicle_id=?',[vehicleId]);}
  await db.execute('DELETE FROM VehicleModel WHERE brand=? AND model_name=?',[tag,tag]);
  if(!originalCategories.length)await db.execute("DELETE FROM VehicleCategory WHERE category_name='Sedan' AND NOT EXISTS(SELECT 1 FROM VehicleModel WHERE VehicleModel.category_id=VehicleCategory.category_id)");
  if(extraId)await db.execute('DELETE FROM RentalExtra WHERE extra_id=?',[extraId]);
  if(branchId)await db.execute('DELETE FROM Branch WHERE branch_id=?',[branchId]);
  await db.execute('DELETE FROM City WHERE city_name=?',[tag]);await db.execute('DELETE FROM Province WHERE province_name=?',[tag]);
  await db.commit();console.log('Temporary verification accounts and records removed.');
 }catch(e){await db.rollback();throw e;}finally{await db.end();}
}
