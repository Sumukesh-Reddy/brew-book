import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignupPage.css';

const SignupPage = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    userRole: 'customer',
    firstName: '',
    lastName: '',
    email: '',
    dob: '',
    gender: '',
    street: '',
    plotNo: '',
    city: '',
    pincode: '',
    academicRecords: [],
    hasWorkExperience: false,
    workExperiences: [],
    govtVerification: {
      selectedDocType: 'aadharCard',
      uploadedDocs: {}
    },
    confirmDetails: false
  });

  const [errors, setErrors]     = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [uploading, setUploading] = useState({
    aadharCard: false,
    panCard: false,
    drivingLicense: false,
    passport: false,
    voterId: false
  });

  const userRoles = [
    {
      value: 'customer',
      label: 'Customer',
      icon: 'fas fa-user',
      color: '#3498db',
      description: 'Book tables, order food, and enjoy seamless cafe experience'
    },
    {
      value: 'cafeOwner',
      label: 'Cafe Owner',
      icon: 'fas fa-store',
      color: '#8b4513',
      description: 'Manage your cafe, menu, tables, and staff efficiently'
    }
  ];

  const documentTypes = [
    { value: 'aadharCard',     label: 'Aadhar Card',      icon: 'fa-id-card'  },
    { value: 'panCard',        label: 'PAN Card',          icon: 'fa-credit-card' },
    { value: 'drivingLicense', label: 'Driving License',   icon: 'fa-car'      },
    { value: 'passport',       label: 'Passport',          icon: 'fa-passport' },
    { value: 'voterId',        label: 'Voter ID',          icon: 'fa-id-badge' }
  ];

  useEffect(() => {
    if (formData.academicRecords.length === 0) {
      handleAddAcademicRecord();
    }
  }, []);

  // ── Input handlers ─────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      
      if (name === 'hasWorkExperience') {
        setFormData(prev => ({
          ...prev,
          hasWorkExperience: checked,
          workExperiences: checked ? prev.workExperiences : []
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAcademicChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.academicRecords];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, academicRecords: updated };
    });
  };

  const handleWorkExperienceChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.workExperiences];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, workExperiences: updated };
    });
  };

  const handleDocTypeChange = (e) => {
    setFormData(prev => ({
      ...prev,
      govtVerification: { ...prev.govtVerification, selectedDocType: e.target.value }
    }));
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const docType = formData.govtVerification.selectedDocType;
    if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }

    setUploading(prev => ({ ...prev, [docType]: true }));
    setTimeout(() => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          govtVerification: {
            ...prev.govtVerification,
            uploadedDocs: {
              ...prev.govtVerification.uploadedDocs,
              [docType]: { file, preview: reader.result, name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString() }
            }
          }
        }));
        setUploading(prev => ({ ...prev, [docType]: false }));
      };
      reader.readAsDataURL(file);
    }, 1500);
  };

  const handleRemoveDocument = (documentType) => {
    setFormData(prev => {
      const updatedDocs = { ...prev.govtVerification.uploadedDocs };
      delete updatedDocs[documentType];
      return { ...prev, govtVerification: { ...prev.govtVerification, uploadedDocs: updatedDocs } };
    });
  };

  const handleAddAcademicRecord = () => {
    setFormData(prev => ({
      ...prev,
      academicRecords: [...prev.academicRecords, { degree: '', institution: '', yearOfPassing: '', isCollapsed: false }]
    }));
  };

  const handleRemoveAcademicRecord = (index) => {
    setFormData(prev => {
      const updated = [...prev.academicRecords];
      updated.splice(index, 1);
      return { ...prev, academicRecords: updated };
    });
  };

  const handleAddWorkExperience = () => {
    if (!formData.hasWorkExperience) return;
    setFormData(prev => ({
      ...prev,
      workExperiences: [...prev.workExperiences, { companyName: '', role: '', yearsExperience: '', description: '', isCollapsed: false }]
    }));
  };

  const handleRemoveWorkExperience = (index) => {
    setFormData(prev => {
      const updated = [...prev.workExperiences];
      updated.splice(index, 1);
      return { ...prev, workExperiences: updated };
    });
  };

  const toggleAcademicRecord = (index) => {
    setFormData(prev => {
      const updated = [...prev.academicRecords];
      updated[index] = { ...updated[index], isCollapsed: !updated[index].isCollapsed };
      return { ...prev, academicRecords: updated };
    });
  };

  const toggleWorkExperience = (index) => {
    setFormData(prev => {
      const updated = [...prev.workExperiences];
      updated[index] = { ...updated[index], isCollapsed: !updated[index].isCollapsed };
      return { ...prev, workExperiences: updated };
    });
  };

  const getDocumentIcon  = (docType) => documentTypes.find(d => d.value === docType)?.icon  ?? 'fa-file';
  const getDocumentLabel = (docType) => documentTypes.find(d => d.value === docType)?.label ?? 'Document';

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateStep = () => {
    const newErrors = {};
    switch (currentStep) {
      case 1:
        if (!formData.userRole)               newErrors.userRole   = 'Please select a user role';
        if (!formData.firstName.trim())        newErrors.firstName  = 'First name is required';
        if (!formData.lastName.trim())         newErrors.lastName   = 'Last name is required';
        if (!formData.email.trim())            newErrors.email      = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.dob)                     newErrors.dob        = 'Date of birth is required';
        if (!formData.gender)                  newErrors.gender     = 'Please select your gender';
        if (!formData.street.trim())           newErrors.street     = 'Street address is required';
        if (!formData.plotNo.trim())           newErrors.plotNo     = 'Plot number is required';
        if (!formData.city.trim())             newErrors.city       = 'City is required';
        if (!formData.pincode.trim())          newErrors.pincode    = 'Pincode is required';
        break;
      case 2:
        formData.academicRecords.forEach((rec, i) => {
          if (!rec.degree.trim())      newErrors[`academic_${i}_degree`]      = 'Degree is required';
          if (!rec.institution.trim()) newErrors[`academic_${i}_institution`] = 'Institution is required';
          if (!rec.yearOfPassing)      newErrors[`academic_${i}_year`]        = 'Year of passing is required';
        });
        break;
      case 4:
        if (formData.userRole === 'cafeOwner') {
          if (!Object.keys(formData.govtVerification.uploadedDocs).length)
            newErrors.govtVerification = 'At least one government document is required for cafe owners';
        }
        break;
      case 5:
        if (!formData.confirmDetails)
          newErrors.confirmDetails = 'Please confirm your details are correct';
        break;
      default: break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleNextStep = () => {
    if (validateStep()) {
      if (currentStep < 5) {
        setCurrentStep(s => s + 1);
        document.querySelector('.sp-form-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
      document.querySelector('.sp-form-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ── Submit — FIX: real API call, correct payload shape ────────────────────

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      /**
       * FIX: Build the payload to match SignUpRequest exactly.
       * - `name`  = "firstName lastName" (used by User entity)
       * - All profile fields sent in the same request so the backend can
       *   save everything in one go without a separate /profile/complete call.
       */
      const payload = {
        // Auth fields
        name:     `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email:    formData.email.trim(),
        role:     formData.userRole,

        // Personal info
        firstName:   formData.firstName.trim(),
        lastName:    formData.lastName.trim(),
        dateOfBirth: formData.dob,
        gender:      formData.gender,

        // Address
        address: {
          street:  formData.street.trim(),
          plotNo:  formData.plotNo.trim(),
          city:    formData.city.trim(),
          pincode: formData.pincode.trim(),
          country: 'India'
        },

        // Academic records — strip UI-only fields
        academicRecords: formData.academicRecords
          .filter(r => r.degree && r.degree.trim() && r.institution && r.institution.trim())
          .map(r => ({
            degree:        r.degree.trim(),
            institution:   r.institution.trim(),
            yearOfPassing: r.yearOfPassing ? parseInt(r.yearOfPassing, 10) : null,
            gradeOrPercentage: r.gradeOrPercentage ? r.gradeOrPercentage.trim() : null,
            additionalNotes: r.additionalNotes ? r.additionalNotes.trim() : null
          })),

        // Work experiences — only if toggle is on; strip UI-only fields
        workExperiences: formData.hasWorkExperience
          ? formData.workExperiences
              .filter(w => w.companyName && w.companyName.trim() && w.role && w.role.trim())
              .map(w => ({
                companyName:  w.companyName.trim(),
                role:         w.role.trim(),          // backend DTO now accepts "role"
                jobTitle:     w.role.trim(),          // also set jobTitle for safety
                description:  w.description ? w.description.trim() : null,
                jobDescription: w.description ? w.description.trim() : null,
                startDate: w.startDate || null,
                endDate: w.endDate || null,
                currentlyWorkingHere: w.currentlyWorkingHere || false,
                skillsGained: w.skillsGained ? w.skillsGained.trim() : null,
                achievements: w.achievements ? w.achievements.trim() : null
              }))
          : [],

        // Government documents — convert file objects to base64 strings
        governmentDocuments: Object.keys(formData.govtVerification.uploadedDocs || {}).map(docType => {
          const doc = formData.govtVerification.uploadedDocs[docType];
          // Extract base64 data (remove data URL prefix if present)
          let fileData = doc.preview || '';
          if (fileData.includes(',')) {
            fileData = fileData.split(',')[1]; // Remove "data:image/png;base64," prefix
          }
          return {
            documentType: docType,
            fileName: doc.name || '',
            fileSize: doc.size || 0,
            fileType: doc.type || '',
            fileData: fileData // base64 encoded data without prefix
          };
        })
      };

      // Debug: Log payload to verify data
      console.log('Signup Payload:', {
        academicRecords: payload.academicRecords,
        workExperiences: payload.workExperiences,
        governmentDocuments: payload.governmentDocuments
      });

      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend returned 4xx / 5xx
        setErrors({ submit: data.message || 'Registration failed. Please try again.' });
        setIsSubmitting(false);
        return;
      }

      if (data.success) {
        // Redirect to sign-in and show temporary password (no admin approval / no email auth)
        const tempPassword = data?.data?.temporaryPassword;
        const message = tempPassword
          ? `Account created successfully. Your temporary password is: ${tempPassword} (please change it after login).`
          : 'Account created successfully. Please login.';

        navigate('/signin', { state: { message } });
      } else {
        setErrors({ submit: data.message || 'Registration failed. Please try again.' });
        setIsSubmitting(false);
      }

    } catch (err) {
      console.error('Signup error:', err);
      setErrors({ submit: 'Unable to connect to server. Please try again.' });
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / 5) * 100;
  const handleBackToHome   = () => navigate('/');
  const getCurrentRoleDetails = () => userRoles.find(r => r.value === formData.userRole) || userRoles[0];

  // ── Step renderers ─────────────────────────────────────────────────────────

  const renderStep1 = () => {
    const currentRole = getCurrentRoleDetails();
    return (
      <div className="sp-form-step sp-active">
        <div className="sp-form-title">
          <span>Basic Information & Address</span>
          <span className="sp-step-counter">Step 1 of 5</span>
        </div>

        <div className={`sp-form-group ${errors.userRole ? 'sp-has-error' : ''}`}>
          <label className="sp-required">Select Your Role</label>
          <div className="sp-role-cards-container">
            {userRoles.map(role => (
              <div
                key={role.value}
                className={`sp-role-card ${formData.userRole === role.value ? 'sp-active' : ''}`}
                onClick={() => {
                  setFormData(prev => ({ ...prev, userRole: role.value }));
                  if (errors.userRole) setErrors(prev => ({ ...prev, userRole: '' }));
                }}
                style={{ borderColor: formData.userRole === role.value ? role.color : '#e0e0e0' }}
              >
                <div className="sp-role-icon-wrapper" style={{ background: role.color }}>
                  <i className={role.icon}></i>
                </div>
                <div className="sp-role-details">
                  <h4 className="sp-role-title">{role.label}</h4>
                  <p className="sp-role-short-desc">{role.description}</p>
                </div>
                {formData.userRole === role.value && (
                  <div className="sp-role-selected-indicator"><i className="fas fa-check-circle"></i></div>
                )}
              </div>
            ))}
          </div>
          {errors.userRole && <div className="sp-error-message">{errors.userRole}</div>}
          <div className="sp-role-description-enhanced" style={{ borderLeftColor: currentRole.color }}>
            <i className={currentRole.icon} style={{ color: currentRole.color }}></i>
            <div><strong>{currentRole.label}:</strong> {currentRole.description}</div>
          </div>
        </div>

        <div className="sp-form-row">
          <div className={`sp-form-group sp-form-group-half ${errors.firstName ? 'sp-has-error' : ''}`}>
            <label htmlFor="firstName" className="sp-required">First Name</label>
            <input type="text" id="firstName" name="firstName" value={formData.firstName}
              onChange={handleInputChange} placeholder="First name" />
            {errors.firstName && <div className="sp-error-message">{errors.firstName}</div>}
          </div>
          <div className={`sp-form-group sp-form-group-half ${errors.lastName ? 'sp-has-error' : ''}`}>
            <label htmlFor="lastName" className="sp-required">Last Name</label>
            <input type="text" id="lastName" name="lastName" value={formData.lastName}
              onChange={handleInputChange} placeholder="Last name" />
            {errors.lastName && <div className="sp-error-message">{errors.lastName}</div>}
          </div>
        </div>

        <div className="sp-form-row">
          <div className={`sp-form-group sp-form-group-half ${errors.email ? 'sp-has-error' : ''}`}>
            <label htmlFor="email" className="sp-required">Email Address</label>
            <input type="email" id="email" name="email" value={formData.email}
              onChange={handleInputChange} placeholder="you@example.com" />
            {errors.email && <div className="sp-error-message">{errors.email}</div>}
            <small className="sp-field-hint"><i className="fas fa-envelope"></i> Verification email will be sent</small>
          </div>
          <div className="sp-form-group sp-form-group-half"></div>
        </div>

        <div className="sp-form-row">
          <div className={`sp-form-group sp-form-group-half ${errors.dob ? 'sp-has-error' : ''}`}>
            <label htmlFor="dob" className="sp-required">Date of Birth</label>
            <input type="date" id="dob" name="dob" value={formData.dob} onChange={handleInputChange} />
            {errors.dob && <div className="sp-error-message">{errors.dob}</div>}
          </div>
          <div className={`sp-form-group sp-form-group-half ${errors.gender ? 'sp-has-error' : ''}`}>
            <label className="sp-required">Gender</label>
            <div className="sp-radio-group">
              {['male', 'female', 'other'].map(g => (
                <div key={g} className="sp-radio-option">
                  <input type="radio" id={g} name="gender" value={g}
                    checked={formData.gender === g} onChange={handleInputChange} />
                  <label htmlFor={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</label>
                </div>
              ))}
            </div>
            {errors.gender && <div className="sp-error-message">{errors.gender}</div>}
          </div>
        </div>

        <div className="sp-form-row">
          <div className={`sp-form-group sp-form-group-full ${errors.street ? 'sp-has-error' : ''}`}>
            <label htmlFor="street" className="sp-required">Street Address</label>
            <input type="text" id="street" name="street" value={formData.street}
              onChange={handleInputChange} placeholder="Street address" />
            {errors.street && <div className="sp-error-message">{errors.street}</div>}
          </div>
        </div>

        <div className="sp-form-row">
          <div className={`sp-form-group sp-form-group-half ${errors.plotNo ? 'sp-has-error' : ''}`}>
            <label htmlFor="plotNo" className="sp-required">Plot/Apartment</label>
            <input type="text" id="plotNo" name="plotNo" value={formData.plotNo}
              onChange={handleInputChange} placeholder="Plot/Apt number" />
            {errors.plotNo && <div className="sp-error-message">{errors.plotNo}</div>}
          </div>
          <div className={`sp-form-group sp-form-group-half ${errors.city ? 'sp-has-error' : ''}`}>
            <label htmlFor="city" className="sp-required">City</label>
            <input type="text" id="city" name="city" value={formData.city}
              onChange={handleInputChange} placeholder="City" />
            {errors.city && <div className="sp-error-message">{errors.city}</div>}
          </div>
        </div>

        <div className="sp-form-row">
          <div className={`sp-form-group sp-form-group-half ${errors.pincode ? 'sp-has-error' : ''}`}>
            <label htmlFor="pincode" className="sp-required">Pincode</label>
            <input type="text" id="pincode" name="pincode" value={formData.pincode}
              onChange={handleInputChange} placeholder="Pincode" />
            {errors.pincode && <div className="sp-error-message">{errors.pincode}</div>}
          </div>
          <div className="sp-form-group sp-form-group-half"></div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="sp-form-step">
      <div className="sp-form-title">
        <span>Academic Information</span>
        <span className="sp-step-counter">Step 2 of 5</span>
      </div>
      <p style={{ color: '#666', marginBottom: '16px', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fas fa-graduation-cap" style={{ color: '#8b4513' }}></i>
        Add your academic records. You can add multiple entries.
      </p>
      <div id="academicRecords">
        {formData.academicRecords.map((record, index) => (
          <div key={index} className={`sp-academic-card ${record.isCollapsed ? 'sp-collapsed' : ''}`}>
            <div className="sp-academic-header" onClick={() => toggleAcademicRecord(index)}>
              <h4>
                <i className="fas fa-university" style={{ marginRight: '8px', color: '#8b4513' }}></i>
                {record.degree || `Academic Record ${index + 1}`}
                {record.institution && ` — ${record.institution}`}
              </h4>
              <i className={`fas fa-chevron-${record.isCollapsed ? 'down' : 'up'}`}></i>
            </div>
            <div className="sp-academic-content">
              <div className="sp-form-row">
                <div className={`sp-form-group ${errors[`academic_${index}_degree`] ? 'sp-has-error' : ''}`}>
                  <label className="sp-required">Degree</label>
                  <input type="text" value={record.degree}
                    onChange={e => handleAcademicChange(index, 'degree', e.target.value)}
                    placeholder="e.g., Bachelor of Science" />
                  {errors[`academic_${index}_degree`] && <div className="sp-error-message">{errors[`academic_${index}_degree`]}</div>}
                </div>
                <div className={`sp-form-group ${errors[`academic_${index}_institution`] ? 'sp-has-error' : ''}`}>
                  <label className="sp-required">Institution</label>
                  <input type="text" value={record.institution}
                    onChange={e => handleAcademicChange(index, 'institution', e.target.value)}
                    placeholder="e.g., University Name" />
                  {errors[`academic_${index}_institution`] && <div className="sp-error-message">{errors[`academic_${index}_institution`]}</div>}
                </div>
              </div>
              <div className={`sp-form-group ${errors[`academic_${index}_year`] ? 'sp-has-error' : ''}`}>
                <label className="sp-required">Year of Passing</label>
                <input type="number" min="1950" max="2030" value={record.yearOfPassing}
                  onChange={e => handleAcademicChange(index, 'yearOfPassing', e.target.value)}
                  placeholder="e.g., 2023" />
                {errors[`academic_${index}_year`] && <div className="sp-error-message">{errors[`academic_${index}_year`]}</div>}
              </div>
              {formData.academicRecords.length > 1 && (
                <button type="button" className="sp-btn sp-btn-outline"
                  onClick={() => handleRemoveAcademicRecord(index)}>
                  <i className="fas fa-trash"></i> Remove Record
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="sp-add-btn" onClick={handleAddAcademicRecord}>
        <i className="fas fa-plus"></i> Add Academic Record
      </button>
    </div>
  );

  const renderStep3 = () => (
    <div className="sp-form-step">
      <div className="sp-form-title">
        <span>Work Experience</span>
        <span className="sp-step-counter">Step 3 of 5</span>
      </div>

      <div className="sp-toggle-container">
        <div className="sp-toggle-label">
          <i className="fas fa-briefcase"></i>
          <strong>I have work experience</strong>
          <small>You can add multiple work experiences if needed</small>
        </div>
        <label className="sp-toggle-switch">
          <input type="checkbox" id="hasWorkExperience" name="hasWorkExperience"
            checked={formData.hasWorkExperience} onChange={handleInputChange} />
          <span className="sp-slider"></span>
        </label>
      </div>

      {formData.hasWorkExperience && (
        <div id="workExperienceFields">
          <p style={{ color: '#666', margin: '16px 0', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-briefcase" style={{ color: '#8b4513' }}></i>
            Add your work experience details. You can add multiple entries.
          </p>
          {formData.workExperiences.map((experience, index) => (
            <div key={index} className={`sp-academic-card ${experience.isCollapsed ? 'sp-collapsed' : ''}`}>
              <div className="sp-academic-header" onClick={() => toggleWorkExperience(index)}>
                <h4>
                  <i className="fas fa-building" style={{ marginRight: '8px', color: '#8b4513' }}></i>
                  {experience.role || `Work Experience ${index + 1}`}
                  {experience.companyName && ` at ${experience.companyName}`}
                </h4>
                <i className={`fas fa-chevron-${experience.isCollapsed ? 'down' : 'up'}`}></i>
              </div>
              <div className="sp-academic-content">
                <div className="sp-form-row">
                  <div className="sp-form-group">
                    <label className="sp-required">Company Name</label>
                    <input type="text" value={experience.companyName}
                      onChange={e => handleWorkExperienceChange(index, 'companyName', e.target.value)}
                      placeholder="Enter company name" />
                  </div>
                  <div className="sp-form-group">
                    <label className="sp-required">Role / Position</label>
                    <input type="text" value={experience.role}
                      onChange={e => handleWorkExperienceChange(index, 'role', e.target.value)}
                      placeholder="Enter your role" />
                  </div>
                </div>
                <div className="sp-form-row">
                  <div className="sp-form-group">
                    <label>Years of Experience</label>
                    <input type="number" value={experience.yearsExperience}
                      onChange={e => handleWorkExperienceChange(index, 'yearsExperience', e.target.value)}
                      placeholder="e.g., 3" min="0" max="50" />
                  </div>
                  <div className="sp-form-group">
                    <label>Description</label>
                    <input type="text" value={experience.description}
                      onChange={e => handleWorkExperienceChange(index, 'description', e.target.value)}
                      placeholder="Brief description of your role" />
                  </div>
                </div>
                {formData.workExperiences.length > 1 && (
                  <button type="button" className="sp-btn sp-btn-outline"
                    onClick={() => handleRemoveWorkExperience(index)}>
                    <i className="fas fa-trash"></i> Remove Experience
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" className="sp-add-btn" onClick={handleAddWorkExperience}>
            <i className="fas fa-plus"></i> Add Work Experience
          </button>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => {
    const selectedDoc  = documentTypes.find(d => d.value === formData.govtVerification.selectedDocType);
    const uploadedDocs = formData.govtVerification.uploadedDocs;
    const hasUploads   = Object.keys(uploadedDocs).length > 0;
    const currentRole  = getCurrentRoleDetails();

    return (
      <div className="sp-form-step">
        <div className="sp-form-title">
          <span>Government Verification</span>
          <span className="sp-step-counter">Step 4 of 5</span>
        </div>

        <div className="sp-role-badge" style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px',
          background: `rgba(${currentRole.value === 'cafeOwner' ? '139,69,19' : '52,152,219'},0.05)`,
          borderRadius: '8px', marginBottom: '18px', borderLeft: `4px solid ${currentRole.color}`
        }}>
          <i className={currentRole.icon} style={{ fontSize: '20px', color: currentRole.color }}></i>
          <div>
            <strong style={{ color: currentRole.color }}>{currentRole.label}:</strong>{' '}
            <span style={{ color: '#666', fontSize: '13px' }}>
              {formData.userRole === 'cafeOwner'
                ? 'Upload at least one government ID for verification'
                : 'Upload government IDs for verification (optional but recommended)'}
            </span>
          </div>
        </div>

        {errors.govtVerification && (
          <div className="sp-error-message" style={{ marginBottom: '16px', padding: '10px', background: '#ffeaea', borderRadius: '6px' }}>
            <i className="fas fa-exclamation-circle"></i> {errors.govtVerification}
          </div>
        )}

        <div className="sp-document-upload-section">
          <div className="sp-document-selector">
            <label htmlFor="documentType" className="sp-required">Select Document Type</label>
            <select id="documentType" value={formData.govtVerification.selectedDocType} onChange={handleDocTypeChange}>
              {documentTypes.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <div className="sp-role-description" style={{ marginTop: '8px' }}>
              <i className={`fas ${selectedDoc?.icon}`} style={{ marginRight: '6px', color: '#8b4513' }}></i>
              <span>{selectedDoc?.label} is selected for upload</span>
            </div>
          </div>

          <div className="sp-upload-area">
            <input type="file" id="documentUpload" accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => handleFileUpload(e.target.files[0])} style={{ display: 'none' }} />
            <label htmlFor="documentUpload" className="sp-upload-label">
              {uploading[formData.govtVerification.selectedDocType] ? (
                <><i className="fas fa-spinner fa-spin"></i> Uploading...</>
              ) : (
                <><i className="fas fa-cloud-upload-alt"></i> Upload {getDocumentLabel(formData.govtVerification.selectedDocType)}</>
              )}
            </label>
            <small style={{ display: 'block', color: '#999', marginTop: '8px' }}>
              <i className="fas fa-info-circle" style={{ marginRight: '5px' }}></i>
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </small>
          </div>
        </div>

        {hasUploads && (
          <div className="sp-uploaded-documents-list">
            <h4><i className="fas fa-check-circle"></i> Uploaded Documents</h4>
            {Object.entries(uploadedDocs).map(([docType, doc]) => (
              <div key={docType} className="sp-uploaded-document">
                <div className="sp-document-preview">
                  <i className={`fas ${getDocumentIcon(docType)}`}></i>
                  <div className="sp-document-info">
                    <strong>{getDocumentLabel(docType)}</strong>
                    <small>{doc.name}</small>
                    <small>{(doc.size / 1024).toFixed(2)} KB • Uploaded</small>
                  </div>
                </div>
                <button type="button" className="sp-btn sp-btn-outline"
                  onClick={() => handleRemoveDocument(docType)}>
                  <i className="fas fa-trash"></i> Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="sp-security-notice">
          <h4><i className="fas fa-shield-alt"></i> Document Requirements</h4>
          <p><i className="fas fa-check-circle"></i> Upload clear, readable images or PDFs</p>
          <p><i className="fas fa-check-circle"></i> Ensure all information is visible and not cropped</p>
          <p><i className="fas fa-check-circle"></i> Documents should be valid and not expired</p>
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    const roleLabel    = userRoles.find(r => r.value === formData.userRole)?.label || formData.userRole;
    const currentRole  = getCurrentRoleDetails();
    const uploadedDocs = formData.govtVerification.uploadedDocs;

    return (
      <div className="sp-form-step">
        <div className="sp-form-title">
          <span>Final Review</span>
          <span className="sp-step-counter">Step 5 of 5</span>
        </div>

        <div className="sp-review-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: currentRole.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>
              <i className={currentRole.icon}></i>
            </div>
            <div>
              <h4 style={{ color: '#4a2c2a', fontSize: '15px', margin: '0 0 3px' }}>Registering as {roleLabel}</h4>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{currentRole.description}</p>
            </div>
          </div>

          {[
            { label: 'Full Name',    icon: 'fa-user',           value: `${formData.firstName} ${formData.lastName}` },
            { label: 'Email',        icon: 'fa-envelope',       value: formData.email },
            { label: 'Date of Birth',icon: 'fa-calendar',       value: formData.dob || 'Not provided' },
            { label: 'Gender',       icon: 'fa-user-circle',    value: formData.gender || 'Not specified' },
            { label: 'Address',      icon: 'fa-map-marker-alt', value: `${formData.street}, ${formData.plotNo}, ${formData.city} — ${formData.pincode}` }
          ].map(row => (
            <div key={row.label} className="sp-review-item">
              <div className="sp-review-label">{row.label}</div>
              <div className="sp-review-value">
                <i className={`fas ${row.icon}`} style={{ marginRight: '8px', color: '#8b4513' }}></i>
                {row.value}
              </div>
            </div>
          ))}

          {formData.academicRecords.length > 0 && (
            <div className="sp-review-item">
              <div className="sp-review-label">Academic Records</div>
              <div className="sp-academic-review">
                {formData.academicRecords.map((r, i) => (
                  <div key={i} style={{ marginBottom: i < formData.academicRecords.length - 1 ? '8px' : 0 }}>
                    <strong>{r.degree || 'Not specified'}</strong>
                    <div style={{ color: '#666' }}>{r.institution} — Year: {r.yearOfPassing || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.hasWorkExperience && formData.workExperiences.length > 0 && (
            <div className="sp-review-item">
              <div className="sp-review-label">Work Experience</div>
              <div className="sp-work-review">
                {formData.workExperiences.map((w, i) => (
                  <div key={i} style={{ marginBottom: i < formData.workExperiences.length - 1 ? '8px' : 0 }}>
                    <strong>{w.role || 'Not specified'}</strong>
                    <div style={{ color: '#666' }}>{w.companyName}</div>
                    {w.description && <div style={{ color: '#888', fontSize: '12px' }}>{w.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="sp-review-item">
            <div className="sp-review-label">Govt. Verification</div>
            <div className="sp-govt-review">
              {!Object.keys(uploadedDocs).length ? (
                <span style={{ color: '#888', fontStyle: 'italic' }}>
                  <i className="fas fa-exclamation-circle" style={{ color: '#f39c12', marginRight: '6px' }}></i>
                  No documents uploaded
                </span>
              ) : Object.entries(uploadedDocs).map(([docType, doc]) => (
                <div key={docType} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0' }}>
                  <i className={`fas ${getDocumentIcon(docType)}`} style={{ color: '#8b4513' }}></i>
                  <span><strong>{getDocumentLabel(docType)}:</strong> {doc.name}</span>
                  <i className="fas fa-check-circle" style={{ color: '#27ae60', marginLeft: 'auto' }}></i>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sp-info-box" style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: '#e8f4f8', 
          borderRadius: '8px',
          borderLeft: '4px solid #3498db'
        }}>
          <i className="fas fa-info-circle" style={{ marginRight: '8px', color: '#3498db' }}></i>
          <strong>Note:</strong> After signup you will get a temporary password on the next screen. Use it to login, then change your password.
        </div>

        <div className={`sp-confirmation-checkbox ${errors.confirmDetails ? 'sp-has-error' : ''}`} style={{ marginTop: '20px' }}>
          <input type="checkbox" id="confirmDetails" name="confirmDetails"
            checked={formData.confirmDetails} onChange={handleInputChange} />
          <label htmlFor="confirmDetails">
            I confirm that all details are accurate. I agree to the{' '}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </label>
          {errors.confirmDetails && <div className="sp-error-message">{errors.confirmDetails}</div>}
        </div>

        {/* FIX: Show server-level error if API call fails */}
        {errors.submit && (
          <div className="sp-error-message" style={{ marginTop: '12px', padding: '10px 14px',
            background: '#ffeaea', borderRadius: '6px', fontSize: '13px' }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '6px' }}></i>
            {errors.submit}
          </div>
        )}
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="sp-signup-page">
      <div className="sp-signup-container">
        <div className="sp-signup-left">
          <div>
            <div className="sp-logo">
              <i className="fas fa-mug-hot"></i>
              <h1>Brew & Book</h1>
            </div>
            <div className="sp-welcome-text">
              <h2>Join Our Coffee Community</h2>
              <p>Create an account to book tables, pre-order your favourite coffee and food, and enjoy a seamless cafe experience.</p>
              <ul className="sp-benefits-list">
                <li><i className="fas fa-check-circle"></i> Skip the wait with table booking</li>
                <li><i className="fas fa-check-circle"></i> Pre-order food &amp; drinks before arriving</li>
                <li><i className="fas fa-check-circle"></i> Secure online payments</li>
                <li><i className="fas fa-check-circle"></i> Real-time order tracking</li>
                <li><i className="fas fa-check-circle"></i> Access to exclusive member offers</li>
              </ul>
            </div>
          </div>
          <div className="sp-signup-footer">
            <button onClick={handleBackToHome} className="sp-back-button">
              <i className="fas fa-arrow-left"></i> Back to Home Page
            </button>
            <div>Already have an account? <a href="#" onClick={() => navigate('/signin')}>Log In</a></div>
          </div>
        </div>

        <div className="sp-signup-right">
          <div className="sp-signup-header">
            <h2>Create Your Account</h2>
            <p>Complete your profile in 5 simple steps</p>
          </div>

          <div className="sp-progress-container">
            <div className="sp-progress-bar">
              <div className="sp-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
            </div>
            <div className="sp-steps-indicator">
              {[1, 2, 3, 4, 5].map(step => (
                <div key={step}
                  className={`sp-step ${currentStep === step ? 'sp-active' : ''} ${currentStep > step ? 'sp-completed' : ''}`}
                  data-step={step}>
                  <div className="sp-step-circle">
                    {currentStep > step ? <i className="fas fa-check"></i> : step}
                  </div>
                  <div className="sp-step-label">
                    {['Basic', 'Academic', 'Work', 'Docs', 'Review'][step - 1]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sp-form-scroll-container">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </div>

          <div className="sp-buttons-container">
            <button type="button" className="sp-btn sp-btn-prev"
              onClick={handlePrevStep} disabled={currentStep === 1 || isSubmitting}>
              <i className="fas fa-arrow-left"></i> Previous
            </button>
            <button type="button" className="sp-btn sp-btn-next"
              onClick={handleNextStep} disabled={isSubmitting}>
              {isSubmitting
                ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
                : currentStep === 5
                  ? 'Submit'
                  : <> Next <i className="fas fa-arrow-right"></i></>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;