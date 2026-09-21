'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import Toast from '@/components/Toast';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  Info,
  Building2,
  Users,
  UserPlus,
  Phone,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  FileText
} from 'lucide-react';

function CheckInFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedFlatId = searchParams.get('flat_id');
  const queryBookingType = searchParams.get('booking_type');
  const queryDays = searchParams.get('days');
  const queryDailyRate = searchParams.get('daily_rate');
  const queryCheckIn = searchParams.get('check_in');
  const queryCheckOut = searchParams.get('check_out');

  const [flats, setFlats] = useState([]);
  const [selectedFlat, setSelectedFlat] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const [formData, setFormData] = useState({
    name: '',
    father_husband_name: '',
    dob: '1992-05-15',
    cnic: '',
    phone: '',
    email: '',
    family_members: 2,
    profession: '',
    company: '',
    monthly_income: '',
    permanent_address: '',
    previous_address: '',
    emergency_contact_name: '',
    emergency_contact_relation: '',
    emergency_contact_phone: '',
    booking_type: queryBookingType === 'monthly' ? 'monthly' : 'daily', // 'daily' or 'monthly'
    check_in_date: queryCheckIn || new Date().toISOString().split('T')[0],
    check_out_date: queryCheckOut || (() => {
      const d = new Date(queryCheckIn || new Date());
      const count = queryDays ? Math.max(1, parseInt(queryDays)) : 3;
      d.setDate(d.getDate() + count);
      return d.toISOString().split('T')[0];
    })(),
    total_days: queryDays ? Math.max(1, parseInt(queryDays)) : 3,
    daily_rate: queryDailyRate ? Number(queryDailyRate) : 3000,
    duration_months: 11,
    security_deposit: '0',
    monthly_rent: '',
    payment_status: 'Paid', // 'Paid', 'Partial', 'Pending'
    paid_amount: '',
    payment_method: 'Cash',
    cnic_doc: 'cnic_front_back_scanned.pdf',
    lease_doc: 'standard_rental_agreement.pdf',
    guarantor_doc: 'guarantor_cnic_verified.pdf'
  });

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

  const currentDailyRate = Number(formData.daily_rate) || (selectedFlat?.daily_rate || (selectedFlat?.monthly_rent ? Math.round(Number(selectedFlat.monthly_rent) / 30) : 3000));

  const totalStayRent = formData.booking_type === 'daily'
    ? currentDays * currentDailyRate
    : (Number(formData.monthly_rent) || Number(selectedFlat?.monthly_rent) || 0);

  const depositVal = Number(formData.security_deposit || 0);
  const totalMoveIn = totalStayRent + depositVal;

  const [cnicStatus, setCnicStatus] = useState(null);
  const [isCheckingCnic, setIsCheckingCnic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadFlats = async () => {
      try {
        const res = await api.getFlats('status', '');
        const list = res.data || [];
        setFlats(list);

        if (preselectedFlatId) {
          const match = list.find(f => String(f.id) === String(preselectedFlatId));
          if (match) {
            setSelectedFlat(match);
            const dRate = queryDailyRate ? Number(queryDailyRate) : (match.daily_rate || (match.monthly_rent ? Math.round(Number(match.monthly_rent) / 30) : 3000));
            const daysCount = queryDays ? Math.max(1, parseInt(queryDays)) : 3;
            const bType = queryBookingType === 'monthly' ? 'monthly' : 'daily';
            const cIn = queryCheckIn || new Date().toISOString().split('T')[0];
            const cOut = queryCheckOut || (() => {
              const d = new Date(cIn);
              d.setDate(d.getDate() + daysCount);
              return d.toISOString().split('T')[0];
            })();
            const totalRent = bType === 'daily' ? daysCount * dRate : (Number(match.monthly_rent) || 0);

            setFormData(prev => ({
              ...prev,
              booking_type: bType,
              check_in_date: cIn,
              check_out_date: cOut,
              total_days: daysCount,
              daily_rate: dRate,
              monthly_rent: match.monthly_rent,
              paid_amount: totalRent.toString()
            }));
          }
        } else if (list.length > 0) {
          const firstVacant = list.find(f => f.status === 'Vacant') || list[0];
          setSelectedFlat(firstVacant);
          const dRate = firstVacant.daily_rate || (firstVacant.monthly_rent ? Math.round(Number(firstVacant.monthly_rent) / 30) : 3000);
          setFormData(prev => ({
            ...prev,
            monthly_rent: firstVacant.monthly_rent,
            daily_rate: dRate,
            paid_amount: prev.booking_type === 'daily' ? (currentDays * dRate).toString() : firstVacant.monthly_rent
          }));
        }
      } catch (err) {
        console.error('Failed to load flats:', err);
      }
    };
    loadFlats();
  }, [preselectedFlatId, queryDays, queryDailyRate, queryCheckIn, queryCheckOut, queryBookingType]);

  const handleFlatChange = (flatId) => {
    const match = flats.find(f => String(f.id) === String(flatId));
    if (match) {
      setSelectedFlat(match);
      const dRate = match.daily_rate || (match.monthly_rent ? Math.round(Number(match.monthly_rent) / 30) : 3000);
      setFormData(prev => ({
        ...prev,
        monthly_rent: match.monthly_rent,
        daily_rate: dRate,
        paid_amount: prev.booking_type === 'daily' ? (currentDays * dRate).toString() : match.monthly_rent
      }));
    }
  };

  const handleCnicBlur = async () => {
    if (!formData.cnic || formData.cnic.length < 5) return;
    setIsCheckingCnic(true);
    try {
      const res = await api.checkCnic(formData.cnic);
      if (res.exists) {
        setCnicStatus(res);
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
        setToastType('success');
        setToastMessage(`Repeat customer recognized: ${res.customer.name} (${res.badge})! Auto-filled details.`);
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
    if (!selectedFlat) {
      setToastType('error');
      setToastMessage('Please select a flat to check in.');
      return;
    }
    if (!formData.name || !formData.cnic || !formData.phone || !formData.check_in_date) {
      setToastType('error');
      setToastMessage('Please fill all mandatory tenant details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalPaid = formData.payment_status === 'Paid'
        ? totalStayRent
        : (formData.payment_status === 'Pending' ? 0 : (Number(formData.paid_amount) || 0));

      await api.checkInTenant({
        flat_id: selectedFlat.id,
        ...formData,
        total_days: currentDays,
        daily_rate: currentDailyRate,
        monthly_rent: formData.monthly_rent || selectedFlat.monthly_rent,
        total_rent: totalStayRent,
        paid_amount: finalPaid
      });
      router.push(`/flats/${selectedFlat.id}`);
    } catch (err) {
      setToastType('error');
      setToastMessage(err.message || 'Tenant check-in failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage('')} />

      {/* ====================================================================
          1. HEADER & BREADCRUMBS
          ==================================================================== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '22px'
      }}>
        <Link
          href={selectedFlat ? `/flats/${selectedFlat.id}` : '/flats'}
          className="btn btn-secondary btn-sm"
          style={{ padding: '6px 12px' }}
        >
          <ArrowLeft size={15} />
          <span>Back</span>
        </Link>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-navy)', letterSpacing: '-0.5px' }}>
            Tenant Registration & Check-in (Flow B)
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B' }}>
            Comprehensive 6-section bio-data registration with instant CNIC recognition & 2-way database synchronization
          </p>
        </div>
      </div>

      {/* ====================================================================
          2. TWO-COLUMN DESKTOP REGISTRATION LAYOUT (65% / 35%)
          ==================================================================== */}
      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(360px, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* ================================================================
              LEFT COLUMN: 6-SECTION COMPREHENSIVE FORM CARDS
              ================================================================ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Section 1: Property Assignment */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              border: '0.5px solid var(--color-border)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={17} color="var(--color-blue)" />
                <span>1. Property Assignment & Flat Selection</span>
              </h3>

              <div>
                <label className="form-label">Assign Flat / Unit *</label>
                <select
                  className="form-select"
                  value={selectedFlat?.id || ''}
                  onChange={(e) => handleFlatChange(e.target.value)}
                  required
                >
                  <option value="">Select a flat...</option>
                  {flats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.flat_number} — {f.building_name || 'Gulberg Heights'} ({f.status}) — PKR {Number(f.monthly_rent).toLocaleString()} /mo
                    </option>
                  ))}
                </select>
                {selectedFlat && selectedFlat.status !== 'Vacant' && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--color-amber-light)', borderRadius: '6px', fontSize: '12px', color: 'var(--color-amber)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} />
                    <span>Notice: This flat is currently occupied by <strong>{selectedFlat.tenant_name}</strong>. Checking in a new tenant will replace the active tenancy.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Personal Details & CNIC */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              border: '0.5px solid var(--color-border)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={17} color="var(--color-blue)" />
                <span>2. Personal Details & CNIC Verification</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">CNIC Number (Auto-Recognition) *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 35201-1234567-1"
                      value={formData.cnic}
                      onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                      onBlur={handleCnicBlur}
                      required
                    />
                    {isCheckingCnic && (
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--color-blue)' }}>
                        Checking...
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', display: 'block' }}>
                    Enter CNIC and tab out to check repeat customer recognition
                  </span>
                </div>

                <div>
                  <label className="form-label">Full Name of Tenant *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Muhammad Hamza"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Father / Husband Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Father's or Husband's name"
                    value={formData.father_husband_name}
                    onChange={(e) => setFormData({ ...formData, father_husband_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Mobile Phone Number *</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="0300-1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="tenant@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Family & Occupation */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              border: '0.5px solid var(--color-border)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={17} color="var(--color-blue)" />
                <span>3. Family & Occupation</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Total Family Members Living</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={formData.family_members}
                    onChange={(e) => setFormData({ ...formData, family_members: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Profession / Job Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Software Engineer, Doctor, Business"
                    value={formData.profession}
                    onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Company / Employer</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Systems Limited, Self"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Monthly Income (PKR)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="150000"
                    value={formData.monthly_income}
                    onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Address Information */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              border: '0.5px solid var(--color-border)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={17} color="var(--color-blue)" />
                <span>4. Permanent & Previous Address</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">Permanent Home Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Permanent address as listed on CNIC"
                    value={formData.permanent_address}
                    onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Previous Rental Residence</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Previous apartment address or city"
                    value={formData.previous_address}
                    onChange={(e) => setFormData({ ...formData, previous_address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Emergency Contact */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              border: '0.5px solid var(--color-border)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={17} color="var(--color-blue)" />
                <span>5. Emergency Contact Person</span>
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <label className="form-label">Contact Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Tariq Mehmood"
                    value={formData.emergency_contact_name}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Relationship</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Brother, Father"
                    value={formData.emergency_contact_relation}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Emergency Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="0321-7654321"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Booking Mode & Stay Terms */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '22px',
              border: '0.5px solid var(--color-border)',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={17} color="var(--color-blue)" />
                  <span>6. Booking Mode & Stay Terms *</span>
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Choose per-day charge or monthly rental
                </span>
              </div>

              {/* Mode Toggle */}
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
                    const rate = currentDailyRate;
                    const total = days * rate;
                    setFormData(prev => ({
                      ...prev,
                      booking_type: 'daily',
                      paid_amount: prev.payment_status === 'Paid' ? total.toString() : (prev.payment_status === 'Partial' ? (total / 2).toString() : '0')
                    }));
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: formData.booking_type === 'daily' ? '1px solid var(--color-blue)' : 'none',
                    background: formData.booking_type === 'daily' ? 'var(--color-navy)' : 'transparent',
                    color: formData.booking_type === 'daily' ? '#FFFFFF' : 'var(--color-navy)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  📅 Per-Day Booking (Short Stay)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rent = Number(formData.monthly_rent) || Number(selectedFlat?.monthly_rent) || 0;
                    setFormData(prev => ({
                      ...prev,
                      booking_type: 'monthly',
                      monthly_rent: rent.toString(),
                      paid_amount: prev.payment_status === 'Paid' ? rent.toString() : (prev.payment_status === 'Partial' ? (rent / 2).toString() : '0')
                    }));
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: formData.booking_type === 'monthly' ? '1px solid var(--color-blue)' : 'none',
                    background: formData.booking_type === 'monthly' ? 'var(--color-navy)' : 'transparent',
                    color: formData.booking_type === 'monthly' ? '#FFFFFF' : 'var(--color-navy)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  🏢 Monthly Lease (Long Stay)
                </button>
              </div>

              {formData.booking_type === 'daily' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
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

                    <div>
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label className="form-label">Stay Duration (Total Days)</label>
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

                    <div>
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

                  {/* Real-time Calculation Summary Box */}
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: '500' }}>Stay Duration:</span>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#0369A1',
                        background: '#E0F2FE',
                        padding: '2px 10px',
                        borderRadius: 'var(--radius-xs)'
                      }}>
                        {currentDays} {currentDays === 1 ? 'Day / Night' : 'Days / Nights'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12.5px', color: '#64748B' }}>Calculation:</span>
                      <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: '600' }}>
                        {currentDays} days × PKR {currentDailyRate.toLocaleString()} / day
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '10px',
                      borderTop: '1px solid #E2E8F0'
                    }}>
                      <strong style={{ fontSize: '14px', color: 'var(--color-navy)' }}>Total Booking Rent:</strong>
                      <strong style={{ fontSize: '18px', color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
                        PKR {totalStayRent.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label className="form-label">Check-in Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={formData.check_in_date}
                      onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Lease Duration (Months)</label>
                    <select
                      className="form-select"
                      value={formData.duration_months}
                      onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                    >
                      <option value="6">6 Months</option>
                      <option value="11">11 Months (Standard)</option>
                      <option value="12">12 Months (1 Year)</option>
                      <option value="24">24 Months (2 Years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Agreed Monthly Rent (PKR) *</label>
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

                  <div>
                    <label className="form-label">Security Deposit (PKR)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.security_deposit}
                      onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ================================================================
                SECTION 7: INITIAL RENT PAYMENT OPTIONS
                ================================================================ */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '0.5px solid var(--color-border)',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DollarSign size={17} color="var(--color-blue)" />
                  <span>7. Initial Rent Payment Status *</span>
                </h3>
                <span style={{ fontSize: '12px', color: '#64748B' }}>
                  Choose whether stay rent is settled now or pending
                </span>
              </div>

              {/* Status Segmented Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_status: 'Paid', paid_amount: totalStayRent.toString() }))}
                  style={{
                    padding: '11px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: formData.payment_status === 'Paid' ? '1.5px solid #16A34A' : '1px solid var(--color-border)',
                    background: formData.payment_status === 'Paid' ? '#F0FDF4' : '#FFFFFF',
                    color: formData.payment_status === 'Paid' ? '#166534' : 'var(--color-navy)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ✓ Full Rent Paid (100%)
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    payment_status: 'Partial',
                    paid_amount: (totalStayRent / 2).toString()
                  }))}
                  style={{
                    padding: '11px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: formData.payment_status === 'Partial' ? '1.5px solid #D97706' : '1px solid var(--color-border)',
                    background: formData.payment_status === 'Partial' ? '#FFFBEB' : '#FFFFFF',
                    color: formData.payment_status === 'Partial' ? '#92400E' : 'var(--color-navy)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ½ Half Pay / Partial
                </button>

                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, payment_status: 'Pending', paid_amount: '0' }))}
                  style={{
                    padding: '11px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: formData.payment_status === 'Pending' ? '1.5px solid #DC2626' : '1px solid var(--color-border)',
                    background: formData.payment_status === 'Pending' ? '#FEF2F2' : '#FFFFFF',
                    color: formData.payment_status === 'Pending' ? '#991B1B' : 'var(--color-navy)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  ⏳ Unpaid / Pending (Rent Due)
                </button>
              </div>

              {/* Conditional Options */}
              {formData.payment_status === 'Paid' && (
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '14px',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#166534', display: 'block', fontWeight: '500' }}>Collecting in Full:</span>
                    <strong style={{ fontSize: '18px', color: '#166534', fontFamily: 'var(--font-heading)' }}>
                      PKR {totalStayRent.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <label className="form-label" style={{ color: '#166534', fontSize: '11.5px' }}>Payment Method</label>
                    <select
                      className="form-select"
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
                  padding: '14px 16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#92400E', fontWeight: '600' }}>
                      Partial Payment Received Now:
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paid_amount: (totalStayRent / 2).toString() }))}
                      style={{
                        background: '#92400E',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-xs)',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Set Exact 50% Half
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label className="form-label" style={{ color: '#92400E', fontSize: '11.5px' }}>Amount Paid (PKR)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.paid_amount}
                        onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                        style={{ background: '#FFFFFF', borderColor: '#FDE68A' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ color: '#92400E', fontSize: '11.5px' }}>Payment Method</label>
                      <select
                        className="form-select"
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
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '0.5px dashed rgba(146, 64, 14, 0.3)',
                    fontSize: '12.5px',
                    color: '#92400E'
                  }}>
                    <span>Remaining Balance Due (will be tracked as Pending):</span>
                    <strong>PKR {Math.max(0, totalStayRent - Number(formData.paid_amount || 0)).toLocaleString()}</strong>
                  </div>
                </div>
              )}

              {formData.payment_status === 'Pending' && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  fontSize: '12.5px',
                  color: '#64748B'
                }}>
                  No payment collected today. Full rent of <strong>PKR {totalStayRent.toLocaleString()}</strong> will be recorded as <strong>Pending Due</strong> and will appear in Rent Due financials until marked paid in the Customer record.
                </div>
              )}
            </div>
          </div>

          {/* ================================================================
              RIGHT COLUMN: STICKY FLAT SUMMARY, CNIC RECOGNITION & CTA
              ================================================================ */}
          <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Real-time CNIC Recognition Card */}
            {cnicStatus && (
              <div style={{
                background: cnicStatus.exists ? 'var(--color-amber-light)' : 'var(--color-mint-light)',
                border: `0.5px solid ${cnicStatus.exists ? 'var(--color-amber-border)' : 'var(--color-mint-border)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: 'var(--shadow-xs)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {cnicStatus.exists ? (
                    <ShieldCheck size={18} color="var(--color-amber)" />
                  ) : (
                    <CheckCircle2 size={18} color="var(--color-mint)" />
                  )}
                  <strong style={{ fontSize: '13.5px', color: 'var(--color-navy)' }}>
                    {cnicStatus.exists ? 'Repeat Guest Recognized!' : 'New Tenant Verified'}
                  </strong>
                </div>

                <div style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
                  {cnicStatus.exists ? (
                    <>
                      <strong>{cnicStatus.customer.name}</strong> has previously stayed in your portfolio ({cnicStatus.badge}). Past data auto-populated.
                    </>
                  ) : (
                    <>
                      First-time tenant. A new permanent CRM profile will be created upon check-in.
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Selected Flat Card Preview */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '0.5px solid var(--color-border)',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)'
            }}>
              <h4 style={{ fontSize: '12.5px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Assigned Unit Overview
              </h4>

              {selectedFlat ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '18px', color: 'var(--color-navy)', display: 'block' }}>
                        {selectedFlat.flat_number}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        {selectedFlat.building_name || 'Gulberg Heights'} • Floor {selectedFlat.floor || 1}
                      </span>
                    </div>

                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: selectedFlat.status === 'Vacant' ? 'var(--color-mint-light)' : 'var(--color-coral-light)',
                      color: selectedFlat.status === 'Vacant' ? 'var(--color-mint)' : 'var(--color-coral)'
                    }}>
                      {selectedFlat.status}
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#64748B',
                    padding: '8px 0',
                    borderTop: '0.5px solid rgba(14, 27, 60, 0.08)',
                    borderBottom: '0.5px solid rgba(14, 27, 60, 0.08)',
                    margin: '10px 0'
                  }}>
                    <span>{selectedFlat.bedrooms} BHK</span>
                    <span>•</span>
                    <span>{selectedFlat.size || '1,200 sqft'}</span>
                    <span>•</span>
                    <span>{selectedFlat.furnishing_status || 'Semi-Furnished'}</span>
                  </div>

                  {/* Financial Move-In Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                      <span>{formData.booking_type === 'daily' ? `Stay Rent (${currentDays} Days):` : 'First Month Rent:'}</span>
                      <strong style={{ color: 'var(--color-navy)' }}>PKR {totalStayRent.toLocaleString()}</strong>
                    </div>

                    {formData.booking_type === 'monthly' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                        <span>Security Deposit (Refundable):</span>
                        <strong style={{ color: 'var(--color-navy)' }}>PKR {depositVal.toLocaleString()}</strong>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      borderTop: '0.5px dashed rgba(14, 27, 60, 0.15)',
                      paddingTop: '8px',
                      marginTop: '4px',
                      fontSize: '13.5px'
                    }}>
                      <strong style={{ color: 'var(--color-navy)' }}>Total Due on Move-in:</strong>
                      <strong style={{ color: 'var(--color-navy)', fontFamily: 'var(--font-heading)' }}>
                        PKR {totalMoveIn.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#94A3B8', fontSize: '13px' }}>
                  Please select a flat to see the lease summary.
                </div>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-mint"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '700',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <UserPlus size={16} />
              <span>{isSubmitting ? 'Registering Tenant...' : 'Complete Check-in & Mark Booked'}</span>
            </button>

            <div style={{ fontSize: '11.5px', color: '#94A3B8', textAlign: 'center', lineHeight: '1.4' }}>
              ✓ Automatically creates first rent invoice in database<br />
              ✓ Immediately synchronizes across mobile app & web
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>Loading check-in portal...</div>}>
      <CheckInFormContent />
    </Suspense>
  );
}
