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
    // Section 5: Lease Details
    check_in_date: new Date().toISOString().split('T')[0],
    duration_months: 11,
    security_deposit: (Number(flat?.monthly_rent || 0) * 2).toString(),
    monthly_rent: flat?.monthly_rent || '',
    // Section 6: Initial Rent Payment Options
    payment_status: 'Paid', // 'Paid', 'Partial', 'Pending'
    paid_amount: flat?.monthly_rent || '',
    payment_method: 'Cash',
    // Section 7: Documents
    cnic_doc: 'cnic_front_back_scanned.pdf',
    lease_doc: 'standard_rental_agreement.pdf',
    guarantor_doc: 'guarantor_cnic_verified.pdf'
  });

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
      await onCheckInComplete({
        flat_id: flat.id,
        ...formData
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

          {/* SECTION 5: Lease Details */}
          <div className="form-section-header" style={{ marginTop: '18px' }}>
            <span className="form-section-badge">5</span>
            <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Lease & Booking Terms *</h3>
          </div>

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

          {/* SECTION 6: Initial Rent Payment */}
          <div className="form-section-header" style={{ marginTop: '20px' }}>
            <span className="form-section-badge" style={{ background: 'var(--color-blue)' }}>6</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-navy)' }}>Initial Rent Payment Options *</h3>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>Mark rent paid, half/partial, or unpaid pending</span>
            </div>
          </div>

          {/* Payment Status Segmented Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, payment_status: 'Paid', paid_amount: prev.monthly_rent }))}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                border: formData.payment_status === 'Paid' ? '2px solid var(--color-mint)' : '1px solid var(--color-border)',
                background: formData.payment_status === 'Paid' ? 'var(--color-mint-light)' : '#FFFFFF',
                color: formData.payment_status === 'Paid' ? '#0B6947' : 'var(--color-navy)',
                fontWeight: '700',
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
                paid_amount: (Number(prev.monthly_rent || 0) / 2).toString()
              }))}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                border: formData.payment_status === 'Partial' ? '2px solid var(--color-amber)' : '1px solid var(--color-border)',
                background: formData.payment_status === 'Partial' ? 'var(--color-amber-light)' : '#FFFFFF',
                color: formData.payment_status === 'Partial' ? '#B45309' : 'var(--color-navy)',
                fontWeight: '700',
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
                padding: '10px 6px',
                borderRadius: '10px',
                border: formData.payment_status === 'Pending' ? '2px solid var(--color-coral)' : '1px solid var(--color-border)',
                background: formData.payment_status === 'Pending' ? 'var(--color-coral-light)' : '#FFFFFF',
                color: formData.payment_status === 'Pending' ? '#B91C1C' : 'var(--color-navy)',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              ⏳ Not Paid (Due)
            </button>
          </div>

          {/* Conditional Payment Detail Box */}
          {formData.payment_status === 'Paid' && (
            <div style={{
              background: 'var(--color-mint-light)',
              border: '1px solid var(--color-mint-border)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', color: '#065F46', fontWeight: '600' }}>Amount Collecting:</span>
                <strong style={{ fontSize: '15px', color: '#065F46', fontFamily: 'var(--font-heading)' }}>
                  PKR {Number(formData.monthly_rent || 0).toLocaleString()}
                </strong>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#065F46', fontSize: '11px' }}>Payment Method</label>
                <select
                  className="form-input"
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  style={{ background: '#FFFFFF', borderColor: 'var(--color-mint-border)' }}
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
              background: 'var(--color-amber-light)',
              border: '1px solid var(--color-amber-border)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#92400E', fontWeight: '600' }}>Custom Amount Paid Now:</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, paid_amount: (Number(prev.monthly_rent || 0) / 2).toString() }))}
                  style={{
                    background: '#92400E',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Reset to 50% Half
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#92400E', fontSize: '11px' }}>Amount Paid (PKR)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                    style={{ background: '#FFFFFF', borderColor: 'var(--color-amber-border)' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#92400E', fontSize: '11px' }}>Method</label>
                  <select
                    className="form-input"
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    style={{ background: '#FFFFFF', borderColor: 'var(--color-amber-border)' }}
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
                <strong>PKR {Math.max(0, Number(formData.monthly_rent || 0) - Number(formData.paid_amount || 0)).toLocaleString()}</strong>
              </div>
            </div>
          )}

          {formData.payment_status === 'Pending' && (
            <div style={{
              background: 'var(--color-ice-subtle)',
              border: '1px dashed var(--color-border)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#64748B'
            }}>
              Full rent of <strong>PKR {Number(formData.monthly_rent || 0).toLocaleString()}</strong> will be saved as <strong>Pending (Rent Due)</strong>. You can update and collect it anytime from the customer profile or payments tab.
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
