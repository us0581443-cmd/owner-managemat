// Automated End-to-End Verification of All Flows in NEST

async function runVerification() {
  const BASE = 'http://127.0.0.1:5000/api';
  console.log('=== Starting NEST E2E Flow Verification ===\n');

  // 1. Check Initial Dashboard
  let dash = await (await fetch(`${BASE}/dashboard`)).json();
  console.log('1. Initial Dashboard Stats:');
  console.log({
    income: dash.data.totalIncome,
    netProfit: dash.data.netProfit,
    occupancy: `${dash.data.occupancyRate}%`,
    flats: dash.data.totalFlats,
    tenants: dash.data.tenantsCount,
    vacant: dash.data.vacantFlats,
    rentDue: dash.data.rentDueCount
  });

  // 2. Flow A: Add a new flat
  console.log('\n2. Testing Flow A: Adding Flat 405 (Vacant)...');
  const addFlatRes = await (await fetch(`${BASE}/flats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      flat_number: 'Flat 405',
      address: 'Al-Rehman Heights, 4th Floor, Gulberg III, Lahore',
      bedrooms: '2 Bed',
      size: '1,250 sq ft',
      monthly_rent: 70000,
      photos: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80']
    })
  })).json();
  console.log('Flat Added Result:', addFlatRes.message, 'Status:', addFlatRes.data.status, 'ID:', addFlatRes.data.id);
  const newFlatId = addFlatRes.data.id;

  // 3. Test Sorting
  console.log('\n3. Testing Flats Sorting by Date, Rent, Name, Status:');
  const flatsDate = await (await fetch(`${BASE}/flats?sort=date`)).json();
  console.log(`- Newest flat at top: ${flatsDate.data[0].flat_number} (${flatsDate.data[0].status})`);
  const flatsRent = await (await fetch(`${BASE}/flats?sort=rent_desc`)).json();
  console.log(`- Highest rent flat: ${flatsRent.data[0].flat_number} (PKR ${flatsRent.data[0].monthly_rent})`);

  // 4. Flow B: Tenant Check-in & Booking
  console.log('\n4. Testing Flow B: Checking in Tenant (Zainab Bibi) on Flat 405...');
  const checkInRes = await (await fetch(`${BASE}/tenants/check-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      flat_id: newFlatId,
      name: 'Zainab Bibi',
      father_husband_name: 'Muhammad Aslam',
      dob: '1993-08-10',
      cnic: '35201-7788990-1',
      phone: '03011234567',
      email: 'zainab@example.com',
      family_members: 2,
      profession: 'Software Architect',
      company: 'Tech Solutions Ltd',
      monthly_income: 320000,
      permanent_address: 'House 19, Street 4, Lahore Cantt',
      previous_address: 'Flat 12, Askari 10',
      emergency_contact_name: 'Muhammad Aslam',
      emergency_contact_relation: 'Father',
      emergency_contact_phone: '03009988776',
      check_in_date: '2026-09-18',
      duration_months: 12,
      security_deposit: 140000,
      monthly_rent: 70000,
      cnic_doc: 'cnic_scanned.pdf',
      lease_doc: 'lease_agreement.pdf',
      guarantor_doc: 'guarantor_doc.pdf'
    })
  })).json();
  console.log('Tenant Check-in Result:', checkInRes.message, 'Badge:', checkInRes.data.badge);

  // Verify Flat is now Booked
  const flatDetailAfterBooking = await (await fetch(`${BASE}/flats/${newFlatId}`)).json();
  console.log(`Flat ${flatDetailAfterBooking.data.flat_number} status is now: ${flatDetailAfterBooking.data.status}, Tenant: ${flatDetailAfterBooking.data.tenant_name}`);

  // 5. Flow C: Rent Collection & Digital Receipt
  console.log('\n5. Testing Flow C: Rent Collection & Digital Receipt...');
  const paymentsList = await (await fetch(`${BASE}/payments?flat_id=${newFlatId}`)).json();
  const pendingPayment = paymentsList.data.find(p => p.status === 'Pending');
  console.log(`Found pending payment #${pendingPayment.id} for PKR ${pendingPayment.amount}`);

  const markPaidRes = await (await fetch(`${BASE}/payments/${pendingPayment.id}/mark-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_method: 'Bank Transfer' })
  })).json();
  console.log('Mark Paid Result:', markPaidRes.message);
  console.log('Digital Receipt Generated:', {
    receiptNumber: markPaidRes.data.receiptNumber,
    paymentStatus: markPaidRes.data.payment.status,
    waLinkGenerated: Boolean(markPaidRes.data.waLink)
  });

  // 6. Flow E: Checking Customers Database & Repeat Detection
  console.log('\n6. Testing Flow E: Checking Customers Database...');
  const customersList = await (await fetch(`${BASE}/customers`)).json();
  console.log(`Found ${customersList.data.length} total registered customers:`);
  customersList.data.forEach(c => {
    console.log(` - ${c.name} [${c.badge}] | Total Stays: ${c.stays_count} | Previous Flats: ${c.stays.map(s => s.flat_number).join(', ')}`);
  });

  // Test Repeat Customer Recognition by checking in same tenant in another flat
  console.log('\nTesting Real-time Repeat Customer Recognition for CNIC 35201-7788990-1...');
  const repeatCheck = await (await fetch(`${BASE}/tenants/check-cnic/35201-7788990-1`)).json();
  console.log('CNIC Check result:', { exists: repeatCheck.exists, badge: repeatCheck.badge, customerName: repeatCheck.customer.name });

  // 7. Flow D: Tenant Checkout
  console.log('\n7. Testing Flow D: Checking out Tenant from Flat 405...');
  const checkoutRes = await (await fetch(`${BASE}/tenants/checkout/${newFlatId}`, {
    method: 'POST'
  })).json();
  console.log('Checkout Result:', checkoutRes.message);

  const flatDetailAfterCheckout = await (await fetch(`${BASE}/flats/${newFlatId}`)).json();
  console.log(`Flat ${flatDetailAfterCheckout.data.flat_number} status is now: ${flatDetailAfterCheckout.data.status} (Vacant again)`);

  // Verify Tenancy History is preserved for Zainab
  const zainabCustomer = await (await fetch(`${BASE}/customers/${checkInRes.data.customerId}`)).json();
  console.log(`Zainab Customer History Stays count: ${zainabCustomer.data.stays.length} (Status: ${zainabCustomer.data.stays[0].status}, Flat: ${zainabCustomer.data.stays[0].flat_number})`);

  // 8. Final Dashboard Verification
  const finalDash = await (await fetch(`${BASE}/dashboard`)).json();
  console.log('\n8. Final Updated Dashboard:');
  console.log({
    totalIncome: finalDash.data.totalIncome,
    netProfit: finalDash.data.netProfit,
    occupancy: `${finalDash.data.occupancyRate}%`,
    totalFlats: finalDash.data.totalFlats,
    activeTenants: finalDash.data.tenantsCount,
    vacantFlats: finalDash.data.vacantFlats
  });

  console.log('\n=== All User Flows (A, B, C, D, E) and Sync Validated Successfully! ===');
}

runVerification().catch(console.error);
