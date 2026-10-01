import mysql from 'mysql2/promise';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:3000',tag='tablecheck_'+randomBytes(5).toString('hex'),email=tag+'@example.invalid';
const table='custom_'+tag;
const db=await mysql.createConnection({host:process.env.MYSQL_HOST,user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE});
let cookie='',created=false;
async function api(method,body,expected=200,path='/api/database/tables'){
 const r=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});
 const data=await r.json();assert.equal(r.status,expected,JSON.stringify(data));return data;
}
try{
 await api('GET',undefined,401);
 const r=await fetch(base+'/api/auth/register',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({firstName:'Table',lastName:'Verification',email,password:randomBytes(24).toString('hex')})});
 assert.equal(r.status,201);cookie=r.headers.get('set-cookie').split(';')[0];
 await api('GET',undefined,403);await api('POST',{name:tag,columns:[{name:'note',type:'text'}]},403);
 await db.execute("UPDATE AppUser SET role='Admin' WHERE login_email=?",[email]);
 await api('DELETE',{table:'vehicle',confirm:'vehicle'},400);
 await api('POST',{name:'bad; DROP TABLE Vehicle',columns:[{name:'note',type:'text'}]},400);
 await api('POST',{name:tag,columns:[{name:'id',type:'text'}]},400);
 await api('POST',{name:tag,columns:[{name:'note',type:'text'},{name:'amount',type:'decimal'},{name:'visit',type:'date'}]},201);created=true;
 const row=await api('PATCH',{table,values:{note:'First entry',amount:'42.50',visit:'2026-10-01'}});
 let data=await api('GET',undefined,200,'/api/database/tables?table='+table);assert.equal(data.records[0].note,'First entry');assert.equal(Number(data.records[0].amount),42.5);
 await api('PATCH',{table,id:row.id,values:{note:'Updated entry',amount:43,visit:null}});
 data=await api('GET',undefined,200,'/api/database/tables?table='+table);assert.equal(data.records[0].note,'Updated entry');assert.equal(data.records[0].visit,null);
 await api('PATCH',{table,id:row.id,values:{amount:'wrong'}},400);
 await api('DELETE',{table,id:row.id});data=await api('GET',undefined,200,'/api/database/tables?table='+table);assert.equal(data.records.length,0);
 await api('DELETE',{table,confirm:'wrong'},400);await api('DELETE',{table,confirm:table});created=false;
 const [found]=await db.execute('SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?',[table]);assert.equal(found.length,0);
 console.log('PASS: admin-only table creation, record insert/update/delete, table removal, validation and core-table protection.');
}finally{
 if(created)await db.query('DROP TABLE `'+table+'`');
 const [users]=await db.execute('SELECT user_id,customer_id FROM AppUser WHERE login_email=?',[email]);
 for(const u of users){await db.execute('DELETE FROM UserSession WHERE user_id=?',[u.user_id]);await db.execute('DELETE FROM AppUser WHERE user_id=?',[u.user_id]);await db.execute('DELETE FROM Customer WHERE customer_id=?',[u.customer_id]);}
 await db.end();console.log('Temporary verification account and table removed.');
}
