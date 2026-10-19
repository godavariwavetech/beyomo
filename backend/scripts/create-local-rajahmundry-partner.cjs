require('dotenv').config({quiet:true});
const assert = require('node:assert/strict');
const {sequelize} = require('../utils/dbconnect');
const {signToken} = require('../utils/jwtUtils');
(async()=>{
  assert.ok(['localhost','127.0.0.1','::1'].includes(process.env.DB_HOST || 'localhost'),'Local database only');
  const [cities] = await sequelize.query('SELECT id, name, isActive FROM cities WHERE LOWER(name) LIKE :name OR LOWER(name) LIKE :alias',
    {replacements:{name:'%raja%',alias:'%rajah%'}});
  console.log('Matching cities:',JSON.stringify(cities));
  try {
    const city=cities.find(c=>c.name==='Rajahmundry' && c.isActive);
    assert.ok(city,'Rajahmundry must be an active local service city');
    const headers={Authorization:`Bearer ${signToken({userId:1,userType:'admin',role:'super_admin'},'1h')}`,
      'Content-Type':'application/json'};
    const base='http://localhost:3000/api/v1/admin';
    const request=async(path,method='GET',body)=>{
      const response=await fetch(base+path,{method,headers,body:body?JSON.stringify(body):undefined});
      const result=await response.json();
      assert.ok(response.ok,JSON.stringify({status:response.status,message:result.message}));
      return result;
    };
    const existing=await request('/partners?search=9000000020');
    let partner=(Array.isArray(existing.data)?existing.data:existing.data?.data||[])
      .find(p=>p.phone==='9000000020' && p.name==='Rajahmundry Test Partner');
    if (!partner) partner=(await request('/partners','POST',{
      name:'Rajahmundry Test Partner',phone:'9000000020',city:city.name,experience:0,
    })).data;
    assert.equal(Number(partner.cityId),Number(city.id));
    if (partner.status!=='approved') partner=(await request(`/partners/${partner.id}/status`,'PATCH',{status:'approved'})).data;
    const eligible=await request(`/partners?status=approved&cityIds=${city.id}&limit=1000`);
    const rows=Array.isArray(eligible.data)?eligible.data:eligible.data?.data||[];
    assert.ok(rows.some(p=>p.id===partner.id),'Partner must appear in booking selector query');
    console.log('CREATED AND VERIFIED LOCAL PARTNER:',JSON.stringify({id:partner.id,name:partner.name,
      phone:partner.phone,city:partner.locationCity,cityId:partner.cityId,status:partner.status}));
  } finally {await sequelize.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
