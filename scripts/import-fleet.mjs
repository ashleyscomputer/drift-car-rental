import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
const fleet=JSON.parse(await readFile(new URL('../database/fleet.json',import.meta.url),'utf8'));
const db=await mysql.createConnection({host:process.env.MYSQL_HOST||'localhost',port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,ssl:process.env.MYSQL_SSL==='false'?undefined:{rejectUnauthorized:true}});
async function execute(sql,args=[]){const [r]=await db.execute(sql,args);return r;}
let added=0,skipped=0;
try{
 await execute("SELECT GET_LOCK('drift_fleet_import',10)").then(r=>{if(Object.values(r[0])[0]!==1)throw new Error('Another fleet import is running.');});
 await db.beginTransaction();
 await execute("INSERT INTO Province(province_name) VALUES('Northern Cape') ON DUPLICATE KEY UPDATE province_name=VALUES(province_name)");
 const [province]=await execute("SELECT province_id FROM Province WHERE province_name='Northern Cape'");
 await execute("INSERT INTO City(city_name,province_id) VALUES('Kimberley',?) ON DUPLICATE KEY UPDATE city_name=VALUES(city_name)",[province.province_id]);
 const [city]=await execute("SELECT city_id FROM City WHERE city_name='Kimberley' AND province_id=?",[province.province_id]);
 await execute("INSERT INTO Branch(branch_name,city_id) VALUES('Drift Kimberley',?) ON DUPLICATE KEY UPDATE branch_name=VALUES(branch_name)",[city.city_id]);
 const [branch]=await execute("SELECT branch_id FROM Branch WHERE branch_name='Drift Kimberley' AND city_id=?",[city.city_id]);
 for(const v of fleet.vehicles){
  const found=await execute('SELECT vehicle_id FROM Vehicle WHERE registration_no=?',[v.registration]);
  if(found.length){skipped++;continue;}
  await execute('INSERT INTO VehicleCategory(category_name) VALUES(?) ON DUPLICATE KEY UPDATE category_name=VALUES(category_name)',[v.type]);
  const [category]=await execute('SELECT category_id FROM VehicleCategory WHERE category_name=?',[v.type]);
  await execute('INSERT INTO VehicleModel(brand,model_name,category_id) VALUES(?,?,?) ON DUPLICATE KEY UPDATE model_name=VALUES(model_name)',[v.brand,v.model,category.category_id]);
  const [model]=await execute('SELECT model_id,category_id FROM VehicleModel WHERE brand=? AND model_name=?',[v.brand,v.model]);
  if(model.category_id!==category.category_id)throw new Error('Existing model has a different category: '+v.brand+' '+v.model);
  const result=await execute("INSERT INTO Vehicle(model_id,branch_id,registration_no,year,transmission,doors,colour,description,tier,daily_rate,status) VALUES(?,?,?,?,?,?,?,?,?,?,'Available')",[model.model_id,branch.branch_id,v.registration,v.year,v.transmission,v.doors,v.colour,v.description,v.tier,v.dailyRate]);
  const id=result.insertId;
  for(const [index,url] of v.images.entries())await execute('INSERT INTO VehicleImage(vehicle_id,image_url,alt_text,is_primary,sort_order) VALUES(?,?,?,?,?)',[id,url,v.brand+' '+v.model,index===0?1:0,index]);
  for(const feature of v.features){
   await execute('INSERT INTO Feature(feature_name) VALUES(?) ON DUPLICATE KEY UPDATE feature_name=VALUES(feature_name)',[feature]);
   await execute('INSERT INTO VehicleFeature(vehicle_id,feature_id) SELECT ?,feature_id FROM Feature WHERE feature_name=?',[id,feature]);
  }
  added++;
 }
 for(const e of fleet.extras)await execute('INSERT INTO RentalExtra(extra_code,extra_name,price,pricing_type) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE extra_code=VALUES(extra_code)',[e.id,e.label,e.price,e.pricing==='flat'?'once':'daily']);
 await db.commit();
 console.log(JSON.stringify({added,alreadyPresent:skipped,branch:'Drift Kimberley',extras: fleet.extras.length}));
}catch(e){await db.rollback();throw e;}finally{await execute("SELECT RELEASE_LOCK('drift_fleet_import')").catch(()=>{});await db.end();}
