export const ROLE_PERMISSIONS = {
  super_admin: ['dashboard','users','partners','bookings','services','skills','earnings','settlements','offers','packages','combos','banners','reviews','notifications','reports','settings','permissions','feedback','zones','cities','contacts'],
  admin:       ['dashboard','users','partners','bookings','services','skills','earnings','settlements','offers','packages','combos','banners','reviews','notifications','reports','feedback','zones','cities','contacts'],
  manager:     ['dashboard','users','partners','bookings','skills','reviews','notifications','feedback','contacts'],
  analyst:     ['dashboard','reports'],
  support:     ['dashboard','users','bookings','reviews','contacts'],
};

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin:       'Admin',
  manager:     'Manager',
  analyst:     'Analyst',
  support:     'Support',
};

export const ROLE_COLORS = {
  super_admin: { bg: '#FEF3C7', text: '#92400E' },
  admin:       { bg: '#DBEAFE', text: '#1E40AF' },
  manager:     { bg: '#D1FAE5', text: '#065F46' },
  analyst:     { bg: '#EDE9FE', text: '#5B21B6' },
  support:     { bg: '#FCE7F3', text: '#9D174D' },
};

export const ADMIN_USERS = [
  { id: 1, name: 'Super Admin',  email: 'admin@beyomo.com', password: 'Admin@123', role: 'super_admin', avatar: 'SA', status: 'active', lastLogin: '2026-05-24T10:30:00', createdAt: '2024-01-01', customPermissions: null },
];

export const USERS = [
  { id:'USR0001', name:'Priya Sharma',     phone:'+91 98765 43210', email:'priya.sharma@gmail.com',    joinedDate:'2024-01-15', bookings:18, status:'active',    totalSpent:24500, addresses:2, lastActive:'2026-05-23', avatar:'PS' },
  { id:'USR0002', name:'Rahul Kumar',      phone:'+91 98765 43211', email:'rahul.kumar@gmail.com',     joinedDate:'2024-02-20', bookings:7,  status:'active',    totalSpent:8900,  addresses:1, lastActive:'2026-05-20', avatar:'RK' },
  { id:'USR0003', name:'Anita Patel',      phone:'+91 98765 43212', email:'anita.patel@gmail.com',     joinedDate:'2024-01-08', bookings:25, status:'active',    totalSpent:38750, addresses:3, lastActive:'2026-05-24', avatar:'AP' },
  { id:'USR0004', name:'Vikram Singh',     phone:'+91 98765 43213', email:'vikram.singh@gmail.com',    joinedDate:'2024-03-05', bookings:3,  status:'suspended', totalSpent:2100,  addresses:1, lastActive:'2026-04-10', avatar:'VS' },
  { id:'USR0005', name:'Meera Gupta',      phone:'+91 98765 43214', email:'meera.gupta@gmail.com',     joinedDate:'2024-01-22', bookings:32, status:'active',    totalSpent:52800, addresses:2, lastActive:'2026-05-24', avatar:'MG' },
  { id:'USR0006', name:'Amit Verma',       phone:'+91 98765 43215', email:'amit.verma@gmail.com',      joinedDate:'2024-04-10', bookings:5,  status:'active',    totalSpent:6750,  addresses:1, lastActive:'2026-05-18', avatar:'AV' },
  { id:'USR0007', name:'Sneha Joshi',      phone:'+91 98765 43216', email:'sneha.joshi@gmail.com',     joinedDate:'2024-02-14', bookings:14, status:'active',    totalSpent:19600, addresses:2, lastActive:'2026-05-22', avatar:'SJ' },
  { id:'USR0008', name:'Deepak Rao',       phone:'+91 98765 43217', email:'deepak.rao@gmail.com',      joinedDate:'2024-03-28', bookings:2,  status:'suspended', totalSpent:1800,  addresses:1, lastActive:'2026-03-15', avatar:'DR' },
  { id:'USR0009', name:'Kavitha Nair',     phone:'+91 98765 43218', email:'kavitha.nair@gmail.com',    joinedDate:'2024-01-30', bookings:21, status:'active',    totalSpent:31200, addresses:3, lastActive:'2026-05-23', avatar:'KN' },
  { id:'USR0010', name:'Ravi Desai',       phone:'+91 98765 43219', email:'ravi.desai@gmail.com',      joinedDate:'2024-04-18', bookings:6,  status:'active',    totalSpent:7400,  addresses:1, lastActive:'2026-05-19', avatar:'RD' },
  { id:'USR0011', name:'Pooja Mehta',      phone:'+91 98765 43220', email:'pooja.mehta@gmail.com',     joinedDate:'2024-02-05', bookings:28, status:'active',    totalSpent:44200, addresses:2, lastActive:'2026-05-24', avatar:'PM' },
  { id:'USR0012', name:'Arjun Reddy',      phone:'+91 98765 43221', email:'arjun.reddy@gmail.com',     joinedDate:'2024-03-15', bookings:9,  status:'active',    totalSpent:12600, addresses:2, lastActive:'2026-05-21', avatar:'AR' },
  { id:'USR0013', name:'Sunita Iyer',      phone:'+91 98765 43222', email:'sunita.iyer@gmail.com',     joinedDate:'2024-01-12', bookings:16, status:'active',    totalSpent:22800, addresses:1, lastActive:'2026-05-22', avatar:'SI' },
  { id:'USR0014', name:'Kiran Shah',       phone:'+91 98765 43223', email:'kiran.shah@gmail.com',      joinedDate:'2024-04-25', bookings:1,  status:'active',    totalSpent:800,   addresses:1, lastActive:'2026-05-10', avatar:'KS' },
  { id:'USR0015', name:'Divya Krishnan',   phone:'+91 98765 43224', email:'divya.krishnan@gmail.com',  joinedDate:'2024-02-28', bookings:19, status:'active',    totalSpent:28900, addresses:2, lastActive:'2026-05-24', avatar:'DK' },
  { id:'USR0016', name:'Manoj Tiwari',     phone:'+91 98765 43225', email:'manoj.tiwari@gmail.com',    joinedDate:'2026-05-02', bookings:0,  status:'active',    totalSpent:0,     addresses:1, lastActive:'2026-05-02', avatar:'MT' },
  { id:'USR0017', name:'Asha Pillai',      phone:'+91 98765 43226', email:'asha.pillai@gmail.com',     joinedDate:'2024-03-08', bookings:12, status:'active',    totalSpent:16800, addresses:2, lastActive:'2026-05-20', avatar:'AP2'},
  { id:'USR0018', name:'Suresh Bhat',      phone:'+91 98765 43227', email:'suresh.bhat@gmail.com',     joinedDate:'2024-01-25', bookings:22, status:'suspended', totalSpent:33000, addresses:1, lastActive:'2026-02-20', avatar:'SB' },
  { id:'USR0019', name:'Rekha Malhotra',   phone:'+91 98765 43228', email:'rekha.malhotra@gmail.com',  joinedDate:'2024-02-18', bookings:15, status:'active',    totalSpent:21500, addresses:3, lastActive:'2026-05-23', avatar:'RM' },
  { id:'USR0020', name:'Gaurav Sinha',     phone:'+91 98765 43229', email:'gaurav.sinha@gmail.com',    joinedDate:'2024-04-30', bookings:4,  status:'active',    totalSpent:5200,  addresses:1, lastActive:'2026-05-17', avatar:'GS' },
  { id:'USR0021', name:'Nandita Roy',      phone:'+91 98765 43230', email:'nandita.roy@gmail.com',     joinedDate:'2024-05-10', bookings:8,  status:'active',    totalSpent:11200, addresses:2, lastActive:'2026-05-24', avatar:'NR' },
  { id:'USR0022', name:'Harish Pandey',    phone:'+91 98765 43231', email:'harish.pandey@gmail.com',   joinedDate:'2024-03-22', bookings:11, status:'active',    totalSpent:15400, addresses:1, lastActive:'2026-05-21', avatar:'HP' },
  { id:'USR0023', name:'Lakshmi Das',      phone:'+91 98765 43232', email:'lakshmi.das@gmail.com',     joinedDate:'2024-01-05', bookings:30, status:'active',    totalSpent:47800, addresses:3, lastActive:'2026-05-24', avatar:'LD' },
  { id:'USR0024', name:'Bharat Jain',      phone:'+91 98765 43233', email:'bharat.jain@gmail.com',     joinedDate:'2024-04-08', bookings:4,  status:'active',    totalSpent:4800,  addresses:1, lastActive:'2026-05-15', avatar:'BJ' },
  { id:'USR0025', name:'Chitra Negi',      phone:'+91 98765 43234', email:'chitra.negi@gmail.com',     joinedDate:'2024-02-12', bookings:17, status:'suspended', totalSpent:23400, addresses:2, lastActive:'2026-04-01', avatar:'CN' },
];

export const PARTNERS = [
  { id:'PTR001', name:'Sonal Kapoor',     phone:'+91 99000 11001', email:'sonal.kapoor@gmail.com',    services:['Facial','Skin Care'],       rating:4.8, totalJobs:124, monthlyEarnings:28500, totalEarnings:342000, status:'active',   isOnline:true,  verifiedAt:'2024-01-20', joinedDate:'2024-01-15', avatar:'SK', city:'Mumbai',    experience:'5 yrs' },
  { id:'PTR002', name:'Renu Sharma',      phone:'+91 99000 11002', email:'renu.sharma@gmail.com',     services:['Haircut','Hair Spa'],        rating:4.5, totalJobs:98,  monthlyEarnings:22000, totalEarnings:264000, status:'active',   isOnline:true,  verifiedAt:'2024-02-01', joinedDate:'2024-01-28', avatar:'RS', city:'Delhi',     experience:'4 yrs' },
  { id:'PTR003', name:'Pooja Yadav',      phone:'+91 99000 11003', email:'pooja.yadav@gmail.com',     services:['Makeup','Bridal Makeup'],    rating:4.9, totalJobs:68,  monthlyEarnings:45000, totalEarnings:540000, status:'active',   isOnline:false, verifiedAt:'2024-01-25', joinedDate:'2024-01-20', avatar:'PY', city:'Bangalore', experience:'7 yrs' },
  { id:'PTR004', name:'Kavya Menon',      phone:'+91 99000 11004', email:'kavya.menon@gmail.com',     services:['Waxing','Threading'],        rating:4.2, totalJobs:145, monthlyEarnings:18000, totalEarnings:216000, status:'active',   isOnline:true,  verifiedAt:'2024-02-10', joinedDate:'2024-02-05', avatar:'KM', city:'Mumbai',    experience:'3 yrs' },
  { id:'PTR005', name:'Ananya Singh',     phone:'+91 99000 11005', email:'ananya.singh@gmail.com',    services:['Pedicure','Manicure'],       rating:4.6, totalJobs:112, monthlyEarnings:24000, totalEarnings:288000, status:'active',   isOnline:false, verifiedAt:'2024-01-30', joinedDate:'2024-01-25', avatar:'AS', city:'Hyderabad', experience:'4 yrs' },
  { id:'PTR006', name:'Preethi Raj',      phone:'+91 99000 11006', email:'preethi.raj@gmail.com',     services:['Massage','Wellness'],        rating:4.7, totalJobs:89,  monthlyEarnings:32000, totalEarnings:384000, status:'active',   isOnline:true,  verifiedAt:'2024-02-15', joinedDate:'2024-02-12', avatar:'PR', city:'Chennai',   experience:'6 yrs' },
  { id:'PTR007', name:'Rashmi Kulkarni',  phone:'+91 99000 11007', email:'rashmi.kulkarni@gmail.com', services:['Facial','Skin Care'],        rating:3.9, totalJobs:56,  monthlyEarnings:14000, totalEarnings:168000, status:'active',   isOnline:false, verifiedAt:'2024-03-01', joinedDate:'2024-02-25', avatar:'RK', city:'Pune',      experience:'2 yrs' },
  { id:'PTR008', name:'Shilpa Dubey',     phone:'+91 99000 11008', email:'shilpa.dubey@gmail.com',    services:['Haircut','Threading'],       rating:4.3, totalJobs:134, monthlyEarnings:20000, totalEarnings:240000, status:'active',   isOnline:true,  verifiedAt:'2024-02-20', joinedDate:'2024-02-18', avatar:'SD', city:'Delhi',     experience:'3 yrs' },
  { id:'PTR009', name:'Meghna Iyer',      phone:'+91 99000 11009', email:'meghna.iyer@gmail.com',     services:['Nail Art','Manicure'],       rating:4.4, totalJobs:78,  monthlyEarnings:19500, totalEarnings:234000, status:'active',   isOnline:false, verifiedAt:'2024-03-05', joinedDate:'2024-03-01', avatar:'MI', city:'Bangalore', experience:'5 yrs' },
  { id:'PTR010', name:'Tanvi Gaikwad',    phone:'+91 99000 11010', email:'tanvi.gaikwad@gmail.com',   services:['Makeup','Facial'],           rating:4.1, totalJobs:45,  monthlyEarnings:16000, totalEarnings:192000, status:'pending',  isOnline:false, verifiedAt:null,          joinedDate:'2026-05-10', avatar:'TG', city:'Pune',      experience:'2 yrs' },
  { id:'PTR011', name:'Bhavna Nair',      phone:'+91 99000 11011', email:'bhavna.nair@gmail.com',     services:['Massage','Skin Care'],       rating:4.8, totalJobs:102, monthlyEarnings:38000, totalEarnings:456000, status:'active',   isOnline:true,  verifiedAt:'2024-03-10', joinedDate:'2024-03-05', avatar:'BN', city:'Kochi',     experience:'8 yrs' },
  { id:'PTR012', name:'Savita More',      phone:'+91 99000 11012', email:'savita.more@gmail.com',     services:['Waxing','Pedicure'],         rating:3.8, totalJobs:67,  monthlyEarnings:15000, totalEarnings:180000, status:'suspended',isOnline:false, verifiedAt:'2024-02-28', joinedDate:'2024-02-22', avatar:'SM', city:'Mumbai',    experience:'3 yrs' },
  { id:'PTR013', name:'Harleen Kaur',     phone:'+91 99000 11013', email:'harleen.kaur@gmail.com',    services:['Bridal Makeup','Makeup'],    rating:5.0, totalJobs:34,  monthlyEarnings:52000, totalEarnings:624000, status:'active',   isOnline:false, verifiedAt:'2024-03-15', joinedDate:'2024-03-12', avatar:'HK', city:'Delhi',     experience:'9 yrs' },
  { id:'PTR014', name:'Deepa Krishnan',   phone:'+91 99000 11014', email:'deepa.krishnan@gmail.com',  services:['Hair Spa','Haircut'],        rating:4.4, totalJobs:88,  monthlyEarnings:21000, totalEarnings:252000, status:'active',   isOnline:true,  verifiedAt:'2024-03-20', joinedDate:'2024-03-18', avatar:'DK', city:'Chennai',   experience:'4 yrs' },
  { id:'PTR015', name:'Vandana Tiwari',   phone:'+91 99000 11015', email:'vandana.tiwari@gmail.com',  services:['Facial','Makeup'],           rating:4.6, totalJobs:76,  monthlyEarnings:26000, totalEarnings:312000, status:'pending',  isOnline:false, verifiedAt:null,          joinedDate:'2026-05-18', avatar:'VT', city:'Lucknow',   experience:'3 yrs' },
];

export const BOOKINGS = [
  { id:'BKG001', userId:'USR0005', userName:'Meera Gupta',    partnerId:'PTR001', partnerName:'Sonal Kapoor',   service:'Facial',        amount:1200, status:'completed',   date:'2026-05-23', slot:'10:00 AM', address:'204, Park Ave, Mumbai', paymentMethod:'Razorpay', commission:240 },
  { id:'BKG002', userId:'USR0003', userName:'Anita Patel',    partnerId:'PTR006', partnerName:'Preethi Raj',    service:'Massage',       amount:1800, status:'completed',   date:'2026-05-23', slot:'02:00 PM', address:'12, MG Road, Bangalore', paymentMethod:'UPI', commission:360 },
  { id:'BKG003', userId:'USR0011', userName:'Pooja Mehta',    partnerId:'PTR003', partnerName:'Pooja Yadav',    service:'Makeup',        amount:2500, status:'in-progress', date:'2026-05-24', slot:'11:00 AM', address:'56, DLF Phase 2, Delhi', paymentMethod:'Card', commission:500 },
  { id:'BKG004', userId:'USR0023', userName:'Lakshmi Das',    partnerId:'PTR002', partnerName:'Renu Sharma',    service:'Haircut',       amount:600,  status:'completed',   date:'2026-05-24', slot:'09:00 AM', address:'34, Andheri, Mumbai', paymentMethod:'UPI', commission:120 },
  { id:'BKG005', userId:'USR0001', userName:'Priya Sharma',   partnerId:'PTR004', partnerName:'Kavya Menon',    service:'Waxing',        amount:800,  status:'pending',     date:'2026-05-24', slot:'03:00 PM', address:'78, Powai, Mumbai', paymentMethod:'Razorpay', commission:160 },
  { id:'BKG006', userId:'USR0015', userName:'Divya Krishnan', partnerId:'PTR014', partnerName:'Deepa Krishnan', service:'Hair Spa',      amount:1500, status:'assigned',    date:'2026-05-24', slot:'04:00 PM', address:'23, T Nagar, Chennai', paymentMethod:'Card', commission:300 },
  { id:'BKG007', userId:'USR0009', userName:'Kavitha Nair',   partnerId:'PTR005', partnerName:'Ananya Singh',   service:'Pedicure',      amount:700,  status:'completed',   date:'2026-05-22', slot:'12:00 PM', address:'45, Hitech City, Hyderabad', paymentMethod:'UPI', commission:140 },
  { id:'BKG008', userId:'USR0021', userName:'Nandita Roy',    partnerId:'PTR011', partnerName:'Bhavna Nair',    service:'Skin Care',     amount:1800, status:'completed',   date:'2026-05-22', slot:'10:30 AM', address:'12, Kakkanad, Kochi', paymentMethod:'Razorpay', commission:360 },
  { id:'BKG009', userId:'USR0019', userName:'Rekha Malhotra', partnerId:'PTR008', partnerName:'Shilpa Dubey',   service:'Threading',     amount:250,  status:'cancelled',   date:'2026-05-21', slot:'05:00 PM', address:'89, Dwarka, Delhi', paymentMethod:'UPI', commission:0 },
  { id:'BKG010', userId:'USR0023', userName:'Lakshmi Das',    partnerId:'PTR013', partnerName:'Harleen Kaur',   service:'Bridal Makeup', amount:8000, status:'completed',   date:'2026-05-20', slot:'08:00 AM', address:'56, Connaught Place, Delhi', paymentMethod:'Card', commission:1600 },
  { id:'BKG011', userId:'USR0007', userName:'Sneha Joshi',    partnerId:'PTR009', partnerName:'Meghna Iyer',    service:'Nail Art',      amount:900,  status:'completed',   date:'2026-05-20', slot:'01:00 PM', address:'23, Whitefield, Bangalore', paymentMethod:'UPI', commission:180 },
  { id:'BKG012', userId:'USR0013', userName:'Sunita Iyer',    partnerId:'PTR001', partnerName:'Sonal Kapoor',   service:'Facial',        amount:1200, status:'pending',     date:'2026-05-25', slot:'11:00 AM', address:'34, Matunga, Mumbai', paymentMethod:'Razorpay', commission:240 },
  { id:'BKG013', userId:'USR0022', userName:'Harish Pandey',  partnerId:'PTR006', partnerName:'Preethi Raj',    service:'Massage',       amount:2200, status:'completed',   date:'2026-05-19', slot:'03:30 PM', address:'12, Adyar, Chennai', paymentMethod:'Card', commission:440 },
  { id:'BKG014', userId:'USR0005', userName:'Meera Gupta',    partnerId:'PTR015', partnerName:'Vandana Tiwari', service:'Makeup',        amount:1800, status:'pending',     date:'2026-05-25', slot:'02:00 PM', address:'45, Gomti Nagar, Lucknow', paymentMethod:'UPI', commission:360 },
  { id:'BKG015', userId:'USR0017', userName:'Asha Pillai',    partnerId:'PTR004', partnerName:'Kavya Menon',    service:'Waxing',        amount:600,  status:'in-progress', date:'2026-05-24', slot:'10:00 AM', address:'78, Vashi, Navi Mumbai', paymentMethod:'Razorpay', commission:120 },
  { id:'BKG016', userId:'USR0024', userName:'Bharat Jain',    partnerId:'PTR002', partnerName:'Renu Sharma',    service:'Haircut',       amount:500,  status:'assigned',    date:'2026-05-24', slot:'05:00 PM', address:'56, Jaipur', paymentMethod:'UPI', commission:100 },
  { id:'BKG017', userId:'USR0012', userName:'Arjun Reddy',    partnerId:'PTR011', partnerName:'Bhavna Nair',    service:'Skin Care',     amount:1600, status:'cancelled',   date:'2026-05-18', slot:'12:30 PM', address:'12, Jubilee Hills, Hyderabad', paymentMethod:'Card', commission:0 },
  { id:'BKG018', userId:'USR0003', userName:'Anita Patel',    partnerId:'PTR005', partnerName:'Ananya Singh',   service:'Manicure',      amount:650,  status:'completed',   date:'2026-05-18', slot:'04:00 PM', address:'34, Baner, Pune', paymentMethod:'UPI', commission:130 },
  { id:'BKG019', userId:'USR0009', userName:'Kavitha Nair',   partnerId:'PTR007', partnerName:'Rashmi Kulkarni',service:'Facial',        amount:900,  status:'completed',   date:'2026-05-17', slot:'11:00 AM', address:'78, FC Road, Pune', paymentMethod:'Razorpay', commission:180 },
  { id:'BKG020', userId:'USR0011', userName:'Pooja Mehta',    partnerId:'PTR003', partnerName:'Pooja Yadav',    service:'Bridal Makeup', amount:12000,status:'completed',   date:'2026-05-15', slot:'07:00 AM', address:'23, Sector 62, Noida', paymentMethod:'Card', commission:2400 },
  { id:'BKG021', userId:'USR0015', userName:'Divya Krishnan', partnerId:'PTR008', partnerName:'Shilpa Dubey',   service:'Threading',     amount:200,  status:'completed',   date:'2026-05-16', slot:'09:30 AM', address:'45, Adyar, Chennai', paymentMethod:'UPI', commission:40 },
  { id:'BKG022', userId:'USR0001', userName:'Priya Sharma',   partnerId:'PTR006', partnerName:'Preethi Raj',    service:'Massage',       amount:1500, status:'completed',   date:'2026-05-14', slot:'02:00 PM', address:'67, Worli, Mumbai', paymentMethod:'Razorpay', commission:300 },
  { id:'BKG023', userId:'USR0019', userName:'Rekha Malhotra', partnerId:'PTR014', partnerName:'Deepa Krishnan', service:'Hair Spa',      amount:1200, status:'completed',   date:'2026-05-13', slot:'01:00 PM', address:'23, Anna Nagar, Chennai', paymentMethod:'Card', commission:240 },
  { id:'BKG024', userId:'USR0023', userName:'Lakshmi Das',    partnerId:'PTR005', partnerName:'Ananya Singh',   service:'Pedicure',      amount:800,  status:'completed',   date:'2026-05-12', slot:'04:30 PM', address:'12, Jubilee Hills, Hyderabad', paymentMethod:'UPI', commission:160 },
  { id:'BKG025', userId:'USR0007', userName:'Sneha Joshi',    partnerId:'PTR001', partnerName:'Sonal Kapoor',   service:'Skin Care',     amount:1400, status:'completed',   date:'2026-05-11', slot:'10:00 AM', address:'56, Powai, Mumbai', paymentMethod:'Card', commission:280 },
];

export const COUPONS = [
  { id:'CPN001', code:'WELCOME20', type:'percentage', discount:20, minOrder:500,  usedCount:245, usageLimit:1000, expiryDate:'2026-06-30', status:'active',   description:'New user welcome discount', applicable:'all' },
  { id:'CPN002', code:'FLAT150',   type:'flat',       discount:150,minOrder:800,  usedCount:89,  usageLimit:500,  expiryDate:'2026-05-31', status:'active',   description:'Flat ₹150 off on orders above ₹800', applicable:'all' },
  { id:'CPN003', code:'BRIDAL30',  type:'percentage', discount:30, minOrder:3000, usedCount:18,  usageLimit:100,  expiryDate:'2026-07-31', status:'active',   description:'Special bridal discount', applicable:'bridal' },
  { id:'CPN004', code:'SUMMER25',  type:'percentage', discount:25, minOrder:600,  usedCount:312, usageLimit:500,  expiryDate:'2026-05-15', status:'expired',  description:'Summer special offer', applicable:'all' },
  { id:'CPN005', code:'HAIR200',   type:'flat',       discount:200,minOrder:1000, usedCount:67,  usageLimit:300,  expiryDate:'2026-06-15', status:'active',   description:'Hair services special discount', applicable:'hair' },
  { id:'CPN006', code:'NAILS10',   type:'percentage', discount:10, minOrder:300,  usedCount:134, usageLimit:1000, expiryDate:'2026-08-31', status:'active',   description:'Nail care services discount', applicable:'nails' },
  { id:'CPN007', code:'MONSOON15', type:'percentage', discount:15, minOrder:500,  usedCount:0,   usageLimit:800,  expiryDate:'2026-09-30', status:'scheduled',description:'Monsoon season special', applicable:'all' },
  { id:'CPN008', code:'REFER100',  type:'flat',       discount:100,minOrder:400,  usedCount:456, usageLimit:9999, expiryDate:'2026-12-31', status:'active',   description:'Referral program reward', applicable:'all' },
  { id:'CPN009', code:'FIRST500',  type:'flat',       discount:500,minOrder:2000, usedCount:23,  usageLimit:200,  expiryDate:'2026-04-30', status:'expired',  description:'First luxury booking discount', applicable:'luxury' },
  { id:'CPN010', code:'WELLNESS20',type:'percentage', discount:20, minOrder:700,  usedCount:78,  usageLimit:400,  expiryDate:'2026-07-15', status:'active',   description:'Wellness services discount', applicable:'wellness' },
];

export const REVIEWS = [
  { id:'RVW001', userId:'USR0005', userName:'Meera Gupta',    partnerId:'PTR001', partnerName:'Sonal Kapoor',    service:'Facial',       rating:5, comment:'Amazing facial! Skin feels so rejuvenated. Will definitely book again.',                    date:'2026-05-23', status:'approved', bookingId:'BKG001' },
  { id:'RVW002', userId:'USR0003', userName:'Anita Patel',    partnerId:'PTR006', partnerName:'Preethi Raj',     service:'Massage',      rating:4, comment:'Great massage session, felt very relaxed. On time and professional.',                       date:'2026-05-23', status:'approved', bookingId:'BKG002' },
  { id:'RVW003', userId:'USR0009', userName:'Kavitha Nair',   partnerId:'PTR005', partnerName:'Ananya Singh',    service:'Pedicure',     rating:5, comment:'Perfect pedicure, very hygienic and quick service!',                                       date:'2026-05-22', status:'approved', bookingId:'BKG007' },
  { id:'RVW004', userId:'USR0021', userName:'Nandita Roy',    partnerId:'PTR011', partnerName:'Bhavna Nair',     service:'Skin Care',    rating:5, comment:'Bhavna is absolutely professional. My skin has never looked better.',                       date:'2026-05-22', status:'approved', bookingId:'BKG008' },
  { id:'RVW005', userId:'USR0023', userName:'Lakshmi Das',    partnerId:'PTR013', partnerName:'Harleen Kaur',    service:'Bridal Makeup',rating:5, comment:'I looked stunning on my wedding day! Harleen is a true artist. Highly recommend!',          date:'2026-05-20', status:'approved', bookingId:'BKG010' },
  { id:'RVW006', userId:'USR0007', userName:'Sneha Joshi',    partnerId:'PTR009', partnerName:'Meghna Iyer',     service:'Nail Art',     rating:4, comment:'Beautiful nail art designs. Good work but took a bit longer than expected.',                date:'2026-05-20', status:'approved', bookingId:'BKG011' },
  { id:'RVW007', userId:'USR0013', userName:'Sunita Iyer',    partnerId:'PTR007', partnerName:'Rashmi Kulkarni', service:'Facial',       rating:3, comment:'Average service. Expected better for the price. The products used felt cheap.',              date:'2026-05-17', status:'pending',  bookingId:'BKG019' },
  { id:'RVW008', userId:'USR0011', userName:'Pooja Mehta',    partnerId:'PTR003', partnerName:'Pooja Yadav',     service:'Bridal Makeup',rating:5, comment:'Absolutely magical transformation! Every guest complimented my look. BEST EVER!',            date:'2026-05-15', status:'approved', bookingId:'BKG020' },
  { id:'RVW009', userId:'USR0001', userName:'Priya Sharma',   partnerId:'PTR006', partnerName:'Preethi Raj',     service:'Massage',      rating:5, comment:'Incredible massage. Preethi knows exactly how to relieve stress. Already booked next one!', date:'2026-05-14', status:'approved', bookingId:'BKG022' },
  { id:'RVW010', userId:'USR0022', userName:'Harish Pandey',  partnerId:'PTR006', partnerName:'Preethi Raj',     service:'Massage',      rating:4, comment:'Good experience. Preethi was professional and the massage was relaxing.',                    date:'2026-05-19', status:'approved', bookingId:'BKG013' },
  { id:'RVW011', userId:'USR0015', userName:'Divya Krishnan', partnerId:'PTR008', partnerName:'Shilpa Dubey',    service:'Threading',    rating:4, comment:'Quick and painless threading. Very skilled hands!',                                         date:'2026-05-16', status:'approved', bookingId:'BKG021' },
  { id:'RVW012', userId:'USR0019', userName:'Rekha Malhotra', partnerId:'PTR014', partnerName:'Deepa Krishnan',  service:'Hair Spa',     rating:5, comment:'My hair has never been softer! Deepa does an excellent job. Very professional.',            date:'2026-05-13', status:'pending',  bookingId:'BKG023' },
  { id:'RVW013', userId:'USR0004', userName:'Vikram Singh',   partnerId:'PTR012', partnerName:'Savita More',     service:'Waxing',       rating:2, comment:'Not satisfied. The wax was too hot and caused minor burns. Need better training.',           date:'2026-04-10', status:'flagged',  bookingId:'BKG009' },
  { id:'RVW014', userId:'USR0023', userName:'Lakshmi Das',    partnerId:'PTR005', partnerName:'Ananya Singh',    service:'Pedicure',     rating:5, comment:'Lovely experience! Clean kit, soothing massage, perfect result.',                          date:'2026-05-12', status:'approved', bookingId:'BKG024' },
  { id:'RVW015', userId:'USR0007', userName:'Sneha Joshi',    partnerId:'PTR001', partnerName:'Sonal Kapoor',    service:'Skin Care',    rating:5, comment:'Sonal is knowledgeable and caring. My skin issues are visibly better now.',                 date:'2026-05-11', status:'approved', bookingId:'BKG025' },
];

export const NOTIFICATIONS_HISTORY = [
  { id:'NTF001', title:'Weekend Special Offer!',       body:'Get 25% off on all beauty services this weekend. Book now!',          target:'all_users',    sentAt:'2026-05-22T10:00:00', delivered:2634, opened:892,  status:'sent' },
  { id:'NTF002', title:'New Job Requests Available',   body:'There are 5 new job requests near you. Go online to accept.',         target:'all_partners', sentAt:'2026-05-22T09:00:00', delivered:161,  opened:134,  status:'sent' },
  { id:'NTF003', title:'Complete Your Profile',        body:'Add your profile photo and complete your details to get more bookings.',target:'partners',     sentAt:'2026-05-20T14:00:00', delivered:45,   opened:32,   status:'sent' },
  { id:'NTF004', title:'Booking Confirmed!',           body:'Your booking #BKG005 for Waxing has been confirmed for 3 PM today.',  target:'specific',     sentAt:'2026-05-24T08:00:00', delivered:1,    opened:1,    status:'sent' },
  { id:'NTF005', title:'Rate Your Experience',         body:'How was your session? Please take a moment to leave a review.',       target:'all_users',    sentAt:'2026-05-19T18:00:00', delivered:2634, opened:1205, status:'sent' },
  { id:'NTF006', title:'Summer Monsoon Offer Coming!', body:'Get ready for exclusive monsoon deals starting June 1st!',            target:'all_users',    sentAt:'2026-06-01T09:00:00', delivered:0,    opened:0,    status:'scheduled' },
  { id:'NTF007', title:'App Update Available',         body:'Update Beyomo to get new features and improved performance.',         target:'all',          sentAt:'2026-05-15T11:00:00', delivered:2820, opened:1456, status:'sent' },
];

export const REVENUE_DATA = [
  { month: 'Jun', revenue: 285000, commission: 57000, payout: 228000 },
  { month: 'Jul', revenue: 312000, commission: 62400, payout: 249600 },
  { month: 'Aug', revenue: 298000, commission: 59600, payout: 238400 },
  { month: 'Sep', revenue: 356000, commission: 71200, payout: 284800 },
  { month: 'Oct', revenue: 389000, commission: 77800, payout: 311200 },
  { month: 'Nov', revenue: 412000, commission: 82400, payout: 329600 },
  { month: 'Dec', revenue: 468000, commission: 93600, payout: 374400 },
  { month: 'Jan', revenue: 395000, commission: 79000, payout: 316000 },
  { month: 'Feb', revenue: 378000, commission: 75600, payout: 302400 },
  { month: 'Mar', revenue: 425000, commission: 85000, payout: 340000 },
  { month: 'Apr', revenue: 456000, commission: 91200, payout: 364800 },
  { month: 'May', revenue: 428500, commission: 85700, payout: 342800 },
];

export const BOOKING_STATUS_DATA = [
  { name: 'Completed',    value: 3234, color: '#22C55E' },
  { name: 'Cancelled',   value: 368,  color: '#EF4444' },
  { name: 'In Progress', value: 84,   color: '#3B82F6' },
  { name: 'Pending',     value: 156,  color: '#F59E0B' },
];

export const USER_GROWTH_DATA = [
  { week: 'W1 Apr', users: 2580, partners: 168 },
  { week: 'W2 Apr', users: 2612, partners: 171 },
  { week: 'W3 Apr', users: 2645, partners: 174 },
  { week: 'W4 Apr', users: 2690, partners: 178 },
  { week: 'W1 May', users: 2720, partners: 180 },
  { week: 'W2 May', users: 2758, partners: 183 },
  { week: 'W3 May', users: 2800, partners: 185 },
  { week: 'W4 May', users: 2847, partners: 186 },
];

export const DASHBOARD_STATS = {
  totalUsers:      { value: 2847,  change: 12,   changeType: 'up',   label: 'vs last month',   extra: '145 new this month' },
  totalPartners:   { value: 186,   change: 5,    changeType: 'up',   label: 'new this week',   extra: '34 online now' },
  todayBookings:   { value: 84,    change: 8,    changeType: 'up',   label: 'vs yesterday',    extra: '12 in progress' },
  monthlyRevenue:  { value: 428500,change: 18,   changeType: 'up',   label: 'vs last month',   extra: '₹85,700 commission' },
  activeJobs:      { value: 12,    change: 3,    changeType: 'up',   label: 'dispatched today', extra: '5 pending acceptance' },
  pendingReviews:  { value: 23,    change: -5,   changeType: 'down', label: 'vs yesterday',    extra: '2 flagged reviews' },
  activeCoupons:   { value: 7,     change: 2,    changeType: 'up',   label: 'active now',      extra: '456 used this month' },
  avgRating:       { value: 4.4,   change: 0.1,  changeType: 'up',   label: 'platform rating',  extra: 'Based on 2,847 reviews' },
};

export const ALL_MODULES = ['dashboard','users','partners','bookings','services','skills','earnings','settlements','offers','packages','combos','reviews','notifications','reports','settings','permissions','feedback','banners','zones','cities'];

export const APP_FEEDBACK = [
  { id:'FBK001', userId:'USR0005', userName:'Meera Gupta',    type:'service',    rating:5, message:'Absolutely love the app! The booking process is seamless and the service quality is excellent. The beautician arrived on time and did a fantastic job.', submittedAt:'2026-05-23T10:30:00', status:'reviewed',  version:'2.1.0', serviceBooked:'Facial', category:'Service Quality' },
  { id:'FBK002', userId:'USR0003', userName:'Anita Patel',    type:'app',        rating:4, message:'App works great overall. However, the payment confirmation screen sometimes takes too long to load. Would appreciate faster response times.', submittedAt:'2026-05-23T09:15:00', status:'new',       version:'2.1.0', serviceBooked:null, category:'Performance' },
  { id:'FBK003', userId:'USR0009', userName:'Kavitha Nair',   type:'suggestion', rating:null, message:'It would be great to have a loyalty rewards program where frequent users get discounts or free services after a certain number of bookings.', submittedAt:'2026-05-22T16:45:00', status:'new',       version:'2.1.0', serviceBooked:null, category:'Feature Request' },
  { id:'FBK004', userId:'USR0021', userName:'Nandita Roy',    type:'service',    rating:5, message:'Bhavna Nair gave an incredible skin care session. Very professional and the products used were of great quality. Highly recommend!', submittedAt:'2026-05-22T14:00:00', status:'reviewed',  version:'2.0.5', serviceBooked:'Skin Care', category:'Service Quality' },
  { id:'FBK005', userId:'USR0001', userName:'Priya Sharma',   type:'bug',        rating:null, message:'The app crashes when I try to view my booking history on the profile screen. This has happened multiple times on my iPhone 14 Pro. Please fix ASAP.', submittedAt:'2026-05-22T11:20:00', status:'resolved',  version:'2.0.5', serviceBooked:null, category:'Bug Report' },
  { id:'FBK006', userId:'USR0023', userName:'Lakshmi Das',    type:'app',        rating:5, message:'The new update is amazing! The UI looks much cleaner and the search functionality is much better. Love how easy it is to find services now.', submittedAt:'2026-05-21T17:30:00', status:'reviewed',  version:'2.1.0', serviceBooked:null, category:'UI/UX' },
  { id:'FBK007', userId:'USR0007', userName:'Sneha Joshi',    type:'service',    rating:4, message:'Good nail art service but the partner arrived 15 minutes late. The work quality was excellent though. Just need better punctuality.', submittedAt:'2026-05-21T13:10:00', status:'reviewed',  version:'2.0.5', serviceBooked:'Nail Art', category:'Service Quality' },
  { id:'FBK008', userId:'USR0013', userName:'Sunita Iyer',    type:'suggestion', rating:null, message:'Please add a live tracking feature so we can see exactly when our beauty professional will arrive. A real-time map would be very helpful.', submittedAt:'2026-05-21T10:00:00', status:'new',       version:'2.1.0', serviceBooked:null, category:'Feature Request' },
  { id:'FBK009', userId:'USR0019', userName:'Rekha Malhotra', type:'service',    rating:5, message:'Deepa did an outstanding hair spa treatment. My hair feels so much softer and healthier. The entire experience was very relaxing and professional.', submittedAt:'2026-05-20T19:45:00', status:'reviewed',  version:'2.0.5', serviceBooked:'Hair Spa', category:'Service Quality' },
  { id:'FBK010', userId:'USR0022', userName:'Harish Pandey',  type:'bug',        rating:null, message:'OTP is not being received on my registered mobile number during login. Tried multiple times. Using Android 13 on Samsung Galaxy S23.', submittedAt:'2026-05-20T08:30:00', status:'resolved',  version:'2.1.0', serviceBooked:null, category:'Bug Report' },
  { id:'FBK011', userId:'USR0012', userName:'Arjun Reddy',    type:'app',        rating:3, message:'The cancellation policy needs to be clearer. I was charged a fee I was not aware of. Please show the cancellation terms prominently before booking.', submittedAt:'2026-05-19T15:20:00', status:'new',       version:'2.0.5', serviceBooked:null, category:'Policy' },
  { id:'FBK012', userId:'USR0015', userName:'Divya Krishnan', type:'service',    rating:5, message:'Preethi Raj is a gem! The massage session was absolutely therapeutic. She is very skilled and professional. Already booked next month\'s session!', submittedAt:'2026-05-19T12:00:00', status:'reviewed',  version:'2.1.0', serviceBooked:'Massage', category:'Service Quality' },
  { id:'FBK013', userId:'USR0024', userName:'Bharat Jain',    type:'suggestion', rating:null, message:'Can you please add more male grooming services? There are limited options for men right now. Beard grooming and hair styling for men would be great.', submittedAt:'2026-05-18T20:15:00', status:'new',       version:'2.1.0', serviceBooked:null, category:'Feature Request' },
  { id:'FBK014', userId:'USR0002', userName:'Rahul Kumar',    type:'app',        rating:4, message:'Payment using UPI is very smooth. The app is well designed. One small issue — the notification sound is too loud when a booking is confirmed.', submittedAt:'2026-05-18T14:30:00', status:'reviewed',  version:'2.0.5', serviceBooked:null, category:'UI/UX' },
  { id:'FBK015', userId:'USR0011', userName:'Pooja Mehta',    type:'service',    rating:5, message:'Pooja Yadav transformed my bridal look completely! Every single guest at the wedding asked who did my makeup. She is truly an artist. LOVE LOVE LOVE!', submittedAt:'2026-05-17T21:00:00', status:'reviewed',  version:'2.1.0', serviceBooked:'Bridal Makeup', category:'Service Quality' },
  { id:'FBK016', userId:'USR0017', userName:'Asha Pillai',    type:'bug',        rating:null, message:'The address auto-fill is not working correctly. It keeps defaulting to a wrong location even after I update it in settings. Very frustrating.', submittedAt:'2026-05-17T09:45:00', status:'new',       version:'2.1.0', serviceBooked:null, category:'Bug Report' },
  { id:'FBK017', userId:'USR0006', userName:'Amit Verma',     type:'suggestion', rating:null, message:'Please add a group booking feature where multiple people can book services together and get a group discount. This would be great for family sessions.', submittedAt:'2026-05-16T18:00:00', status:'new',       version:'2.0.5', serviceBooked:null, category:'Feature Request' },
  { id:'FBK018', userId:'USR0014', userName:'Kiran Shah',     type:'app',        rating:5, message:'The app is very intuitive and easy to use. Found my first service in under 2 minutes. Booked and confirmed within 5 minutes. Great experience overall!', submittedAt:'2026-05-16T11:30:00', status:'reviewed',  version:'2.1.0', serviceBooked:null, category:'UI/UX' },
];
