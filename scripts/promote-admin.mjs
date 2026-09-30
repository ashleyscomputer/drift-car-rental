import mysql from 'mysql2/promise';
const email=process.argv[2]?.trim().toLowerCase();
if(!email||!email.includes('@'))throw new Error('Usage: npm run admin:promote -- your-email');
const c=await mysql.createConnection({host:process.env.MYSQL_HOST||'localhost',port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,ssl:process.env.MYSQL_SSL==='false'?undefined:{rejectUnauthorized:true}});
try{const [r]=await c.execute("UPDATE AppUser SET role='Admin' WHERE login_email=? AND is_active=1",[email]);if(!r.affectedRows)throw new Error('Register that account first.');console.log('Administrator access enabled. Refresh Drift to open the admin area.');}finally{await c.end();}
