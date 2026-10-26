require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const {signToken}=require('../utils/jwtUtils');
const headers={Authorization:`Bearer ${signToken({userId:1,userType:'admin',role:'super_admin'},'1h')}`,'Content-Type':'application/json'};
(async()=>{
  const base='http://localhost:3000/api/v1/admin';
  const users=await fetch(`${base}/users?search=9000000019`,{headers}).then(r=>r.json());
  const rows=Array.isArray(users.data)?users.data:users.data?.data||[];
  const user=rows.find(u=>u.phone==='9000000019'); assert.ok(user);
  const cities=await fetch(`${base}/cities`,{headers}).then(r=>r.json());
  const city=cities.data.find(c=>c.isActive && c.name==='Nellore');assert.ok(city);
  const response=await fetch(`${base}/bookings/preview`,{method:'POST',headers,body:JSON.stringify({
    useCustomerFlow:true,userId:user.id,cityId:city.id,paymentMode:'paid',
    services:[{isAddOn:true,name:'Paid preview verification only',price:500,qty:1}],packages:[],
    address:{line1:'Local test address',city:city.name,state:'Andhra Pradesh',pincode:''},
    scheduledAt:new Date(Date.now()+86400000).toISOString(),
  })});
  const result=await response.json();
  assert.equal(response.status,200,JSON.stringify(result));
  assert.equal(result.data.paymentStatus,'paid');
  console.log('PASS: running local backend accepts Paid and previews paid status. No booking created.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
