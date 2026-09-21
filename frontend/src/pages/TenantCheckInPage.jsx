import React, { useState } from 'react';
import { ArrowLeft, UserPlus, CheckCircle2, AlertTriangle, ShieldCheck, FileCheck, Info } from 'lucide-react';
import { api } from '../services/api';

export default function TenantCheckInPage({ flat, onBack, onCheckInComplete, showToast }) {
  const [formData, setFormData] = useState({
    // Section 1: Personal Details
    name: '',
    father_husband_name: '',
    dob: '1992-05-15',
    cnic: '',
    phone: '',
    email: '',
    // Section 2: Family & Occupation
    family_members: 2,
    profession: '',
    company: '',
    monthly_income: '',
    // Section 3: Address
    permanent_address: '',
    previous_address: '',
    // Section 4: Emergency Contact
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_phone: '',
    // Section 5: Stay & Booking Details
    booking_type: 'daily', // 'daily' or 'monthly'
    check_in_date: new Date().toISOString().split('T')[0],
    check_out_date: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d.toISOString().split('T')[0];
    })(),
    total_days: 3,
    daily_rate: flat?.daily_rate || (flat?.monthly_rent ? Math.round(Number(flat.monthly_rent) / 30) : 3000),
    duration_months: 1,
    security_deposit: '0',
    monthly_rent: flat?.monthly_rent || '',
    // Section 6: Initial Rent Payment Options
    payment_status: 'Paid', // 'Paid', 'Partial', 'Pending'
    paid_amount: '',
    payment_method: 'Cash',
    // Section 7: Documents
    cnic_doc: 'cnic_front_back_scanned.pdf',
    lease_doc: 'standard_rental_agreement.pdf',
    guarantor_doc: 'guarantor_cnic_verified.pdf'
  });

  // Calculate live days count and total stay charge
  const calculateDays = (start, end) => {
    if (!start || !end) return 1;
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const currentDays = formData.booking_type === 'daily'
    ? calculateDays(formData.check_in_date, formData.check_out_date)
    : (Number(formData.duration_months) || 1) * 30;

  const currentDailyRate = Number(formData.daily_rate) || 0;
  const totalStayRent = formData.booking_type === 'daily'
    ? currentDays * currentDailyRate
    : (Number(formData.monthly_rent) || 0);

  const [cnicStatus, setCnicStatus] = useState(null); // { exists: bool, badge: string, customer: obj }
  const [isCheckingCnic, setIsCheckingCnic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check CNIC in real time on blur or change
  const handleCnicBlur = async () => {
    if (!formData.cnic || formData.cnic.length < 5) return;
    setIsCheckingCnic(true);
    try {
      const res = await api.checkCnic(formData.cnic);
      if (res.exists) {
        setCnicStatus(res);
        // Pre-fill some fields from previous record if owner wants
        setFormData(prev => ({
          ...prev,
          name: prev.name || res.customer.name,
          phone: prev.phone || res.customer.phone,
          email: prev.email || res.customer.email,
          father_husband_name: prev.father_husband_name || res.customer.father_husband_name,
          profession: prev.profession || res.customer.profession,
          company: prev.company || res.customer.company,
          monthly_income: prev.monthly_income || res.customer.monthly_income,
          permanent_address: prev.permanent_address || res.customer.permanent_address
        }));
        showToast(`Repeat customer recognized: ${res.customer.name} (${res.badge})!`, 'success');
      } else {
        setCnicStatus({ exists: false, badge: 'New Customer' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingCnic(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.cnic || !formData.phone || !formData.check_in_date) {
      showToast('Please fill all mandatory tenant details.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPaid = formData.payment_status === 'Paid'
        ? totalStayRent
        : (formData.payment_status === 'Pending' ? 0 : (Number(formData.paid_amount) || 0));

      await onCheckInComplete({
        flat_id: flat.id,
        ...formData,
        total_days: currentDays,
        daily_rate: currentDailyRate,
        monthly_rent: formData.monthly_rent || flat?.monthly_rent,
        total_rent: totalStayRent,
        paid_amount: finalPaid
      });
    } catch (err) {
      showToast(err.message || 'Tenant check-in failed', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-navy)', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--color-navy)' }}>
            Tenant Registration & Check-in
          </h2>
          <div style={{ fontSize: '12px', color: '#64748B' }}>
            Registering for: <strong style={{ color: 'var(--color-navy)' }}>{flat?.flat_number}</strong>
          </div>
        </div>
      </div>

      {/* Real-time Customer Recognition Alert (Section 2.5) */}
      {cnicStatus && (
        <div style={{
          background: cnicStatus.exists ? 'var(--color-amber-light)' : 'var(--color-blue-light)',
          border: `0.5px solid ${cnicStatus.exists ? 'var(--color-amber-border)' : 'rgba(62, 123, 250, 0.25)'}`,
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {cnicStatus.exists ? <ShieldCheck size={20} color="var(--color-amber)" /> : <Info size={20} color="var(--color-blue)" />}
          <div style={{ fontSize: '12.5px' }}>
            {cnicStatus.exists ? (
              <>
                <strong style={{ color: '#9e6409' }}>Repeat Customer Recognized ({cnicStatus.badge})</strong>
                <div style={{ color: '#784606' }}>
                  This person previously stayed in {cnicStatus.pastStays?.length || 1} of your properties. Existing record auto-linked!
                </div>
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--color-blue)' }}>New Customer Verified</strong>
                <div style={{ color: '#334155' }}>First time staying with you. A permanent bio-data record will be established.</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bio-Data Form (6 Sections) */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: '#ffffff', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '18px', marginBottom: '16px' }}>
          
          {/* SECTION 1: Personal Details */}
          <div className="form-section-header">
            <span className="form-section-badge">1</span>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Personal Details (Identity)</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Muhammad Farhan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">CNIC / ID Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="35202-XXXXXXX-X"
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                onBlur={handleCnicBlur}
                required
              />
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>Used to detect Repeat vs New</span>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-input"
                placeholder="0300-1234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Father's / Husband's Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Full Name"
                value={formData.father_husband_name}
                onChange={(e) => setFormData({ ...formData, father_husband_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="tenant@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* SECTION 2: Family & Occupation */}
          <div className="form-section-header" style={{ marginTop: '18px' }}>
            <span className="form-section-badge">2</span>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Family & Occupation (Affordability)</h3>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Family Members Count</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.family_members}
                onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Profession / Role</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Finance Manager"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Company / Employer</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Bank Alfalah"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Monthly Income (PKR)</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 250000"
                value={formData.monthly_income}
                onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
              />
            </div>
          </div>

          {/* SECTION 3: Address */}
          <div className="form-section-header" style={{ marginTop: '18px' }}>
            <span className="form-section-badge">3</span>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Address Details (Tracing)</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Permanent Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. House 54, Street 9, Rawalpindi"
              value={formData.permanent_address}
              onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Previous Address</label>
            <input
              type="text"
              className="form-input"
              placeholder="Where did they stay before?"
              value={formData.previous_address}
              onChange={(e) => setFormData({ ...formData, previous_address: e.target.value })}
            />
          </div>

          {/* SECTION 4: Emergency Contact */}
          <div className="form-section-header" style={{ marginTop: '18px' }}>
            <span className="form-section-badge">4</span>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Emergency Contact</h3>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Contact Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Relationship</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brother, Father, Friend"
                value={formData.emergency_contact_relation}
                onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Emergency Phone</label>
            <input
              type="tel"
              className="form-input"
              placeholder="0300-XXXXXXX"
              value={formData.emergency_contact_phone}
              onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
            />
          </div>

          {/* SECTION 5: Booking Type & Stay Terms */}
          <div className="form-section-header" style={{ marginTop: '18px' }}>
            <span className="form-section-badge">5</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Stay & Booking Terms *</h3>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>Charge by per-day stay or standard monthly lease</span>
            </div>
          </div>

          {/* Booking Type Toggle */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'var(--color-ice-subtle)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            marginBottom: '16px'
          }}>
            <button
              type="button"
              onClick={() => {
                const days = calculateDays(formData.check_in_date, formData.check_out_date);
                const rate = Number(formData.daily_rate) || 3000;
                const total = days * rate;
                setFormData(prev => ({
                  ...prev,
                  booking_type: 'daily',
                  paid_amount: prev.payment_status === 'Paid' ? total.toString() : (prev.payment_status === 'Partial' ? (total / 2).toString() : '0')
                }));
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: formData.booking_type === 'daily' ? '1px solid var(--color-blue)' : 'none',
                background: formData.booking_type === 'daily' ? 'var(--color-navy)' : 'transparent',
                color: formData.booking_type === 'daily' ? '#FFFFFF' : 'var(--color-navy)',
                fontWeight: '600',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📅 Per-Day Booking (Short Stay)
            </button>
            <button
              type="button"
              onClick={() => {
                const rent = Number(formData.monthly_rent) || Number(flat?.monthly_rent) || 0;
                setFormData(prev => ({
                  ...prev,
                  booking_type: 'monthly',
                  monthly_rent: rent.toString(),
                  paid_amount: prev.payment_status === 'Paid' ? rent.toString() : (prev.payment_status === 'Partial' ? (rent / 2).toString() : '0')
                }));
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: formData.booking_type === 'monthly' ? '1px solid var(--color-blue)' : 'none',
                background: formData.booking_type === 'monthly' ? 'var(--color-navy)' : 'transparent',
                color: formData.booking_type === 'monthly' ? '#FFFFFF' : 'var(--color-navy)',
                fontWeight: '600',
                fontSize: '12.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🏢 Monthly Lease (Long Stay)
            </button>
          </div>

          {/* If Per-Day Booking */}
          {formData.booking_type === 'daily' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Check-in Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.check_in_date}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const days = calculateDays(newStart, formData.check_out_date);
                      setFormData(prev => ({
                        ...prev,
                        check_in_date: newStart,
                        total_days: days
                      }));
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Check-out Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.check_out_date}
                    min={formData.check_in_date}
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const days = calculateDays(formData.check_in_date, newEnd);
                      setFormData(prev => ({
                        ...prev,
                        check_out_date: newEnd,
                        total_days: days
                      }));
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Stay Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={currentDays}
                    onChange={(e) => {
                      const dCount = Math.max(1, parseInt(e.target.value) || 1);
                      const d = new Date(formData.check_in_date || new Date());
                      d.setDate(d.getDate() + dCount);
                      setFormData(prev => ({
                        ...prev,
                        total_days: dCount,
                        check_out_date: d.toISOString().split('T')[0]
                      }));
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rate Per Day (PKR) *</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    className="form-input"
                    value={formData.daily_rate}
                    onChange={(e) => setFormData({ ...formData, daily_rate: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Real-time Per-Day Breakdown Box */}
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>Stay Duration:</span>
                  <span style={{
                    fontSize: '11.5px',
                    fontWeight: '700',
                    color: '#0369A1',
                    background: '#E0F2FE',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)'
                  }}>
                    {currentDays} {currentDays === 1 ? 'Night / Day' : 'Nights / Days'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Calculation:</span>
                  <span style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                    {currentDays} days × PKR {currentDailyRate.toLocaleString()}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '8px',
                  borderTop: '1px solid #E2E8F0'
                }}>
                  <strong style={{ fontSize: '13px', color: 'var(--color-navy)' }}>Total Booking Rent:</strong>
                  <strong style={{ fontSize: '16px', color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
                    PKR {totalStayRent.toLocaleString()}
                  </strong>
                </div>
              </div>
            </div>
          ) : (
            /* Monthly Lease Options */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Check-in Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.check_in_date}
                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Months) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.duration_months}
                    onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Monthly Rent (PKR) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.monthly_rent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        monthly_rent: val,
                        paid_amount: prev.payment_status === 'Paid' ? val : (prev.payment_status === 'Partial' ? (Number(val) / 2).toString() : prev.paid_amount)
                      }));
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Security Deposit (PKR)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.security_deposit}
                    onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: Rent Payment Settlement */}
          <div className="form-section-header" style={{ marginTop: '16px' }}>
            <span className="form-section-badge" style={{ background: 'var(--color-navy)' }}>6</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-navy)' }}>Initial Rent Payment *</h3>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>Mark rent settled immediately or due upon arrival</span>
            </div>
          </div>

          {/* Payment Status Segmented Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, payment_status: 'Paid', paid_amount: totalStayRent.toString() }))}
              style={{
                padding: '9px 6px',
                borderRadius: 'var(--radius-sm)',
                border: formData.payment_status === 'Paid' ? '1.5px solid #16A34A' : '1px solid var(--color-border)',
                background: formData.payment_status === 'Paid' ? '#F0FDF4' : '#FFFFFF',
                color: formData.payment_status === 'Paid' ? '#166534' : 'var(--color-navy)',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              ✓ Full Paid
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({
                ...prev,
                payment_status: 'Partial',
                paid_amount: (totalStayRent / 2).toString()
              }))}
              style={{
                padding: '9px 6px',
                borderRadius: 'var(--radius-sm)',
                border: formData.payment_status === 'Partial' ? '1.5px solid #D97706' : '1px solid var(--color-border)',
                background: formData.payment_status === 'Partial' ? '#FFFBEB' : '#FFFFFF',
                color: formData.payment_status === 'Partial' ? '#92400E' : 'var(--color-navy)',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              ½ Half Pay
            </button>

            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, payment_status: 'Pending', paid_amount: '0' }))}
              style={{
                padding: '9px 6px',
                borderRadius: 'var(--radius-sm)',
                border: formData.payment_status === 'Pending' ? '1.5px solid #DC2626' : '1px solid var(--color-border)',
                background: formData.payment_status === 'Pending' ? '#FEF2F2' : '#FFFFFF',
                color: formData.payment_status === 'Pending' ? '#991B1B' : 'var(--color-navy)',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              ⏳ Pending Due
            </button>
          </div>

          {/* Conditional Payment Detail Box */}
          {formData.payment_status === 'Paid' && (
            <div style={{
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#166534', fontWeight: '500' }}>Amount Collecting:</span>
                <strong style={{ fontSize: '15px', color: '#166534', fontFamily: 'var(--font-heading)' }}>
                  PKR {totalStayRent.toLocaleString()}
                </strong>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#166534', fontSize: '11px' }}>Payment Method</label>
                <select
                  className="form-input"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  style={{ background: '#FFFFFF', borderColor: '#BBF7D0' }}
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                </select>
              </div>
            </div>
          )}

          {formData.payment_status === 'Partial' && (
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#92400E', fontWeight: '500' }}>Amount Paid Now:</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paid_amount: (totalStayRent / 2).toString() }))}
                  style={{
                    background: '#92400E',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-xs)',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Reset 50%
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#92400E', fontSize: '11px' }}>Paid (PKR)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                    style={{ background: '#FFFFFF', borderColor: '#FDE68A' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#92400E', fontSize: '11px' }}>Method</label>
                  <select
                    className="form-input"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    style={{ background: '#FFFFFF', borderColor: '#FDE68A' }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="EasyPaisa">EasyPaisa</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '0.5px dashed rgba(146, 64, 14, 0.3)',
                fontSize: '11.5px',
                color: '#92400E'
              }}>
                <span>Remaining Pending Balance:</span>
                <strong>PKR {Math.max(0, totalStayRent - Number(formData.paid_amount || 0)).toLocaleString()}</strong>
              </div>
            </div>
          )}

          {formData.payment_status === 'Pending' && (
            <div style={{
              background: '#F8FAFC',
              border: '1px dashed #CBD5E1',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#64748B'
            }}>
              Full rent of <strong>PKR {totalStayRent.toLocaleString()}</strong> will be recorded as <strong>Pending (Due)</strong>. You can mark it collected anytime.
            </div>
          )}

          {/* SECTION 7: Documents */}
          <div className="form-section-header" style={{ marginTop: '18px' }}>
            <span className="form-section-badge">7</span>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Documents Attached (Legal Proof)</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--color-ice-subtle)', borderRadius: '8px', border: '0.5px solid rgba(14, 27, 60, 0.08)' }}>
              <FileCheck size={16} color="var(--color-blue)" />
              <span>CNIC Copy: <strong>{formData.cnic_doc}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--color-ice-subtle)', borderRadius: '8px', border: '0.5px solid rgba(14, 27, 60, 0.08)' }}>
              <FileCheck size={16} color="var(--color-blue)" />
              <span>Lease Agreement: <strong>{formData.lease_doc}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--color-ice-subtle)', borderRadius: '8px', border: '0.5px solid rgba(14, 27, 60, 0.08)' }}>
              <FileCheck size={16} color="var(--color-blue)" />
              <span>Guarantor CNIC: <strong>{formData.guarantor_doc}</strong></span>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
            style={{ padding: '14px', marginTop: '24px', fontSize: '15px' }}
          >
            <CheckCircle2 size={18} />
            <span>{isSubmitting ? 'Registering & Booking Flat...' : 'Save & Check-in (Mark as Booked)'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
