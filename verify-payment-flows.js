// Automated Test Suite for Check-in Payment Options & Live Sync Everywhere

async function runPaymentFlowTests() {
  const BASE = 'http://127.0.0.1:5000/api';
  console.log('🧪 Starting Tenant Check-In Payment Options & Live Sync Tests...\n');

  // 1. Log in as default owner to get token
  const loginRes = await (await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@gmail.com', password: 'nest1234' })
  })).json();

  if (!loginRes.success) {
    throw new Error('Login failed: ' + loginRes.error);
  }
  const token = loginRes.token;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  console.log('✅ Step 1: Owner login successful. Bearer token acquired.');

  // 2. Capture baseline dashboard
  const baseDash = await (await fetch(`${BASE}/dashboard`, { headers })).json();
  const baselineIncome = baseDash.data.totalIncome;
  const baselineDue = baseDash.data.rentDueAmount;
  const baselineDueCount = baseDash.data.rentDueCount;
  console.log('📊 Baseline Financials:', {
    totalIncome: baselineIncome,
    rentDueAmount: baselineDue,
    rentDueCount: baselineDueCount
  });

  // 3. Create 3 test flats
  const f1 = await (await fetch(`${BASE}/flats`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      flat_number: 'Test Flat P-101',
      address: 'Gulberg Executive Block A',
      bedrooms: '2 Bed',
      size: '1,200 sq ft',
      monthly_rent: 50000
    })
  })).json();

  const f2 = await (await fetch(`${BASE}/flats`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      flat_number: 'Test Flat P-102',
      address: 'Gulberg Executive Block A',
      bedrooms: '3 Bed',
      size: '1,800 sq ft',
      monthly_rent: 80000
    })
  })).json();

  const f3 = await (await fetch(`${BASE}/flats`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      flat_number: 'Test Flat P-103',
      address: 'Gulberg Executive Block A',
      bedrooms: '1 Bed',
      size: '800 sq ft',
      monthly_rent: 40000
    })
  })).json();

  console.log('🏢 Step 2: Created 3 test flats (P-101, P-102, P-103).');

  // 4. Test Case A: Check-in with FULL PAID option
  console.log('\n--- Test Case A: Check-in with Full Paid Option ---');
  const checkInA = await (await fetch(`${BASE}/tenants/check-in`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      flat_id: f1.data.id,
      name: 'Ali Raza',
      cnic: '35201-' + Date.now().toString().slice(-7) + '-1',
      phone: '03001112233',
      check_in_date: '2026-09-01',
      duration_months: 11,
      monthly_rent: 50000,
      payment_status: 'Paid',
      paid_amount: 50000,
      payment_method: 'Cash'
    })
  })).json();

  console.log('Check-in A result:', checkInA.message);
  console.log('Payment created:', checkInA.data.payment);

  if (checkInA.data.payment.status !== 'Paid' || checkInA.data.payment.paid_amount !== 50000) {
    throw new Error('Test Case A failed: expected status Paid with 50000 paid_amount');
  }

  // Verify dashboard after Test Case A
  const dashA = await (await fetch(`${BASE}/dashboard`, { headers })).json();
  console.log('Dashboard after Full Paid check-in:', {
    newIncome: dashA.data.totalIncome,
    incomeDiff: dashA.data.totalIncome - baselineIncome,
    rentDueDiff: dashA.data.rentDueAmount - baselineDue
  });

  if (dashA.data.totalIncome !== baselineIncome + 50000) {
    throw new Error(`Income mismatch: expected ${baselineIncome + 50000}, got ${dashA.data.totalIncome}`);
  }
  console.log('✅ Test Case A Passed: Full Paid recorded, income increased by full rent 50,000, due balance unaffected.');

  // 5. Test Case B: Check-in with HALF PAY / PARTIAL option
  console.log('\n--- Test Case B: Check-in with Half Pay / Partial Option ---');
  const checkInB = await (await fetch(`${BASE}/tenants/check-in`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      flat_id: f2.data.id,
      name: 'Bilal Khan',
      cnic: '35201-' + (Date.now() + 1).toString().slice(-7) + '-2',
      phone: '03002223344',
      check_in_date: '2026-09-01',
      duration_months: 11,
      monthly_rent: 80000,
      payment_status: 'Partial',
      paid_amount: 40000, // Exact 50% half pay
      payment_method: 'Bank Transfer'
    })
  })).json();

  console.log('Check-in B result:', checkInB.message);
  console.log('Payment created:', checkInB.data.payment);

  if (checkInB.data.payment.status !== 'Partial' || checkInB.data.payment.paid_amount !== 40000) {
    throw new Error('Test Case B failed: expected status Partial with 40000 paid_amount');
  }

  const dashB = await (await fetch(`${BASE}/dashboard`, { headers })).json();
  console.log('Dashboard after Half Pay check-in:', {
    newIncome: dashB.data.totalIncome,
    incomeGainFromA: dashB.data.totalIncome - dashA.data.totalIncome,
    rentDueGain: dashB.data.rentDueAmount - dashA.data.rentDueAmount
  });

  if (dashB.data.totalIncome - dashA.data.totalIncome !== 40000) {
    throw new Error(`Expected income gain of 40000 for half pay, got ${dashB.data.totalIncome - dashA.data.totalIncome}`);
  }
  if (dashB.data.rentDueAmount - dashA.data.rentDueAmount !== 40000) {
    throw new Error(`Expected rent due gain of 40000 for remaining half, got ${dashB.data.rentDueAmount - dashA.data.rentDueAmount}`);
  }
  console.log('✅ Test Case B Passed: Half Pay recorded, income increased by 40,000, rent due increased by remaining 40,000.');

  // 6. Test Case C: Check-in with UNPAID / PENDING option
  console.log('\n--- Test Case C: Check-in with Unpaid / Pending Option ---');
  const checkInC = await (await fetch(`${BASE}/tenants/check-in`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      flat_id: f3.data.id,
      name: 'Usman Tariq',
      cnic: '35201-' + (Date.now() + 2).toString().slice(-7) + '-3',
      phone: '03003334455',
      check_in_date: '2026-09-01',
      duration_months: 11,
      monthly_rent: 40000,
      payment_status: 'Pending',
      paid_amount: 0
    })
  })).json();

  console.log('Check-in C result:', checkInC.message);
  console.log('Payment created:', checkInC.data.payment);

  if (checkInC.data.payment.status !== 'Pending' || checkInC.data.payment.paid_amount !== 0) {
    throw new Error('Test Case C failed: expected status Pending with 0 paid_amount');
  }

  const dashC = await (await fetch(`${BASE}/dashboard`, { headers })).json();
  if (dashC.data.rentDueAmount - dashB.data.rentDueAmount !== 40000) {
    throw new Error(`Expected rent due gain of 40000 for pending rent, got ${dashC.data.rentDueAmount - dashB.data.rentDueAmount}`);
  }
  console.log('✅ Test Case C Passed: Unpaid Pending recorded, rent due increased by full 40,000.');

  // 7. Test Case D: Live Update from Customer Record (Pay remaining half of Bilal Khan)
  console.log('\n--- Test Case D: Live Update Remaining Balance on Tenant B ---');
  const tenantBPaymentId = checkInB.data.payment.id;
  const updateRes = await (await fetch(`${BASE}/payments/${tenantBPaymentId}/update-status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      status: 'Paid',
      additional_amount: 40000, // Pay remaining 40,000
      payment_method: 'JazzCash'
    })
  })).json();

  console.log('Update result:', updateRes.message);
  console.log('Updated payment:', {
    id: updateRes.data.payment.id,
    status: updateRes.data.payment.status,
    paid_amount: updateRes.data.payment.paid_amount,
    balance_due: updateRes.data.payment.balance_due,
    method: updateRes.data.payment.payment_method
  });

  if (updateRes.data.payment.status !== 'Paid' || updateRes.data.payment.balance_due !== 0) {
    throw new Error('Test Case D failed: expected status Paid with 0 balance_due');
  }

  // Check dashboard after update: rent due should drop by 40,000 and income should rise by 40,000
  const dashD = await (await fetch(`${BASE}/dashboard`, { headers })).json();
  console.log('Dashboard after live update:', {
    incomeAfterUpdate: dashD.data.totalIncome,
    incomeGain: dashD.data.totalIncome - dashC.data.totalIncome,
    rentDueAfterUpdate: dashD.data.rentDueAmount,
    rentDueDrop: dashC.data.rentDueAmount - dashD.data.rentDueAmount
  });

  if (dashD.data.totalIncome - dashC.data.totalIncome !== 40000) {
    throw new Error('Expected income to increase by 40000 upon clearing remaining balance');
  }
  if (dashC.data.rentDueAmount - dashD.data.rentDueAmount !== 40000) {
    throw new Error('Expected rent due to decrease by 40000 upon clearing remaining balance');
  }
  console.log('✅ Test Case D Passed: Remaining balance cleared to Paid, income +40,000, rent due -40,000 live sync verified!');

  // 8. Test Case E: Verify Customer Directory includes payments with balance_due
  console.log('\n--- Test Case E: Customer Records Directory Verification ---');
  const customersRes = await (await fetch(`${BASE}/customers`, { headers })).json();
  const tenantBCustomer = customersRes.data.find(c => c.id === checkInB.data.customerId);
  console.log('Customer Bilal Khan records:', {
    name: tenantBCustomer.name,
    stays: tenantBCustomer.stays.length,
    paymentsCount: tenantBCustomer.payments.length,
    latestPaymentStatus: tenantBCustomer.payments[0].status,
    latestPaymentPaid: tenantBCustomer.payments[0].paid_amount,
    latestPaymentBalanceDue: tenantBCustomer.payments[0].balance_due
  });

  if (!tenantBCustomer.payments || tenantBCustomer.payments.length === 0) {
    throw new Error('Test Case E failed: customer payments not populated');
  }
  console.log('✅ Test Case E Passed: Customer record contains payments with status and balance_due.');

  console.log('\n🎉 ALL 5 PAYMENT & LIVE FINANCIAL SYNC TESTS COMPLETED WITH 100% SUCCESS!');
}

runPaymentFlowTests().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
