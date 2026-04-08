import React, { useState, useEffect } from 'react';
import './CafeRegistrationForm.css';

const CafeRegistrationForm = ({ onSuccess, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState({
    documents: {},
    images: {}
  });
  const [formData, setFormData] = useState({
    // Basic Information
    cafeName: '',
    description: '',
    email: '',
    phone: '',
    establishedYear: '',
    gstNumber: '',
    fssaiLicense: '',
    website: '',

    // Capacity - These will be auto-calculated
    totalTables: 0,
    seatingCapacity: 0,
    hasParking: false,
    hasWifi: false,
    hasAC: false,

    // Table Types - with price per hour only (no minimum order)
    tableTypes: [
      { 
        typeName: 'Regular', 
        description: 'Standard dining tables', 
        tableCount: 5, 
        seatingCapacityPerTable: 4, 
        pricePerHour: 500,
        isActive: true 
      },
      { 
        typeName: 'Birthday', 
        description: 'Special birthday celebration tables', 
        tableCount: 2, 
        seatingCapacityPerTable: 6, 
        pricePerHour: 800,
        isActive: true 
      },
      { 
        typeName: 'Anniversary', 
        description: 'Romantic anniversary setup', 
        tableCount: 2, 
        seatingCapacityPerTable: 4, 
        pricePerHour: 1000,
        isActive: true 
      },
      { 
        typeName: 'Family', 
        description: 'Large family tables', 
        tableCount: 3, 
        seatingCapacityPerTable: 8, 
        pricePerHour: 1200,
        isActive: true 
      },
      { 
        typeName: 'Date Night', 
        description: 'Cozy tables for couples', 
        tableCount: 4, 
        seatingCapacityPerTable: 2, 
        pricePerHour: 600,
        isActive: true 
      }
    ],

    // Address
    street: '',
    plotNo: '',
    city: '',
    pincode: '',
    country: 'India',

    // Documents
    documents: [],

    // Images
    images: [],

    // Operating Hours
    operatingHours: [
      { dayOfWeek: 0, dayName: 'Monday', isClosed: false, openTime: '09:00', closeTime: '22:00', breakStart: '', breakEnd: '' },
      { dayOfWeek: 1, dayName: 'Tuesday', isClosed: false, openTime: '09:00', closeTime: '22:00', breakStart: '', breakEnd: '' },
      { dayOfWeek: 2, dayName: 'Wednesday', isClosed: false, openTime: '09:00', closeTime: '22:00', breakStart: '', breakEnd: '' },
      { dayOfWeek: 3, dayName: 'Thursday', isClosed: false, openTime: '09:00', closeTime: '22:00', breakStart: '', breakEnd: '' },
      { dayOfWeek: 4, dayName: 'Friday', isClosed: false, openTime: '09:00', closeTime: '22:00', breakStart: '', breakEnd: '' },
      { dayOfWeek: 5, dayName: 'Saturday', isClosed: false, openTime: '10:00', closeTime: '23:00', breakStart: '', breakEnd: '' },
      { dayOfWeek: 6, dayName: 'Sunday', isClosed: true, openTime: '', closeTime: '', breakStart: '', breakEnd: '' }
    ],

    // Terms
    confirmDetails: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-calculate totalTables and seatingCapacity whenever tableTypes change
  useEffect(() => {
    const totalTables = formData.tableTypes.reduce((sum, type) => sum + (parseInt(type.tableCount) || 0), 0);
    const seatingCapacity = formData.tableTypes.reduce((sum, type) => {
      return sum + ((parseInt(type.tableCount) || 0) * (parseInt(type.seatingCapacityPerTable) || 0));
    }, 0);

    setFormData(prev => ({
      ...prev,
      totalTables,
      seatingCapacity
    }));
  }, [formData.tableTypes]);

  const documentTypes = [
    { value: 'gst_certificate', label: 'GST Certificate', icon: 'fa-file-invoice' },
    { value: 'fssai_license', label: 'FSSAI License', icon: 'fa-file-certificate' },
    { value: 'trade_license', label: 'Trade License', icon: 'fa-file-contract' },
    { value: 'ownership_proof', label: 'Ownership Proof', icon: 'fa-file-signature' },
    { value: 'rental_agreement', label: 'Rental Agreement', icon: 'fa-file-alt' }
  ];

  const imageTypes = [
    { value: 'logo', label: 'Cafe Logo', icon: 'fa-image' },
    { value: 'exterior', label: 'Exterior Photo', icon: 'fa-building' },
    { value: 'interior', label: 'Interior Photo', icon: 'fa-couch' },
    { value: 'menu', label: 'Menu', icon: 'fa-utensils' },
    { value: 'food', label: 'Food Photos', icon: 'fa-hamburger' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTableTypeChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.tableTypes];
      
      if (field === 'tableCount' || field === 'seatingCapacityPerTable' || field === 'pricePerHour') {
        const numValue = parseFloat(value) || 0;
        updated[index] = { ...updated[index], [field]: numValue };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      
      return { ...prev, tableTypes: updated };
    });
  };

  const addTableType = () => {
    setFormData(prev => ({
      ...prev,
      tableTypes: [
        ...prev.tableTypes,
        { 
          typeName: '', 
          description: '', 
          tableCount: 1, 
          seatingCapacityPerTable: 4, 
          pricePerHour: 500,
          isActive: true 
        }
      ]
    }));
  };

  const removeTableType = (index) => {
    setFormData(prev => ({
      ...prev,
      tableTypes: prev.tableTypes.filter((_, i) => i !== index)
    }));
  };

  const handleOperatingHourChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.operatingHours];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, operatingHours: updated };
    });
  };

  const handleDocumentUpload = async (file, docType) => {
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(prev => ({
      ...prev,
      documents: { ...prev.documents, [docType]: true }
    }));

    setTimeout(() => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newDoc = {
          documentType: docType,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileData: reader.result.split(',')[1],
          documentNumber: '',
          issueDate: '',
          expiryDate: ''
        };

        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, newDoc]
        }));

        setUploading(prev => ({
          ...prev,
          documents: { ...prev.documents, [docType]: false }
        }));
      };
      reader.readAsDataURL(file);
    }, 1500);
  };

  const handleImageUpload = async (file, imageType) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploading(prev => ({
      ...prev,
      images: { ...prev.images, [imageType]: true }
    }));

    setTimeout(() => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newImage = {
          imageType: imageType,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileData: reader.result.split(',')[1],
          isPrimary: formData.images.length === 0,
          caption: '',
          displayOrder: formData.images.length
        };

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));

        setUploading(prev => ({
          ...prev,
          images: { ...prev.images, [imageType]: false }
        }));
      };
      reader.readAsDataURL(file);
    }, 1500);
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validateStep = () => {
    const newErrors = {};

    switch (currentStep) {
      case 1:
        if (!formData.cafeName.trim()) newErrors.cafeName = 'Cafe name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.street.trim()) newErrors.street = 'Street address is required';
        if (!formData.plotNo.trim()) newErrors.plotNo = 'Plot number is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
        break;

      case 2:
        if (formData.tableTypes.length === 0) {
          newErrors.tableTypes = 'At least one table type is required';
        } else {
          formData.tableTypes.forEach((type, index) => {
            if (!type.typeName.trim()) newErrors[`tableTypeName_${index}`] = 'Table type name is required';
            if (!type.tableCount || type.tableCount < 1) newErrors[`tableCount_${index}`] = 'Table count must be at least 1';
            if (!type.pricePerHour || type.pricePerHour < 0) newErrors[`pricePerHour_${index}`] = 'Valid price is required';
          });
        }
        break;

      case 3:
        formData.operatingHours.forEach((hour, index) => {
          if (!hour.isClosed) {
            if (!hour.openTime) newErrors[`open_${index}`] = 'Open time required';
            if (!hour.closeTime) newErrors[`close_${index}`] = 'Close time required';
          }
        });
        break;

      case 4:
        if (formData.documents.length === 0) {
          newErrors.documents = 'At least one document is required';
        }
        break;

      case 5:
        if (formData.images.length === 0) {
          newErrors.images = 'At least one image is required';
        }
        break;

      case 6:
        if (!formData.confirmDetails) {
          newErrors.confirmDetails = 'Please confirm the details are correct';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const ownerId = user?.id;

      const payload = {
        cafeName: formData.cafeName,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : null,
        gstNumber: formData.gstNumber,
        fssaiLicense: formData.fssaiLicense,
        website: formData.website,
        totalTables: formData.totalTables,
        seatingCapacity: formData.seatingCapacity,
        hasParking: formData.hasParking,
        hasWifi: formData.hasWifi,
        hasAC: formData.hasAC,
        tableTypes: formData.tableTypes.map(type => ({
          typeName: type.typeName,
          description: type.description,
          tableCount: parseInt(type.tableCount) || 0,
          seatingCapacityPerTable: parseInt(type.seatingCapacityPerTable) || 4,
          pricePerHour: parseFloat(type.pricePerHour) || 500,
          isActive: true
        })),
        address: {
          street: formData.street,
          plotNo: formData.plotNo,
          city: formData.city,
          pincode: formData.pincode,
          country: formData.country
        },
        documents: formData.documents,
        images: formData.images,
        operatingHours: formData.operatingHours.map(hour => ({
          ...hour,
          openTime: hour.isClosed ? null : hour.openTime,
          closeTime: hour.isClosed ? null : hour.closeTime
        }))
      };

      const url = ownerId
        ? `http://localhost:8080/api/cafe/register?ownerId=${ownerId}`
        : 'http://localhost:8080/api/cafe/register';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        alert('Cafe registered successfully!');
        onSuccess();
      } else {
        alert(data.message || 'Failed to register cafe');
      }
    } catch (error) {
      console.error('Error registering cafe:', error);
      alert('Unable to connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / 6) * 100;

  return (
    <div className="crf-container">
      <div className="crf-header">
        <h2><i className="fas fa-store"></i> Register Your Cafe</h2>
        <button className="crf-close-btn" onClick={onCancel}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="crf-progress">
        <div className="crf-progress-bar">
          <div className="crf-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        <div className="crf-steps">
          {['Basic', 'Tables & Facilities', 'Hours', 'Documents', 'Photos', 'Review'].map((step, index) => (
            <div key={index} className={`crf-step ${currentStep === index + 1 ? 'crf-active' : ''} ${currentStep > index + 1 ? 'crf-completed' : ''}`}>
              <div className="crf-step-circle">
                {currentStep > index + 1 ? <i className="fas fa-check"></i> : index + 1}
              </div>
              <span className="crf-step-label">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="crf-form-container">
        {currentStep === 1 && (
          <div className="crf-step-content">
            <h3>Basic Information</h3>
            
            <div className="crf-form-group">
              <label className="crf-required">Cafe Name</label>
              <input
                type="text"
                name="cafeName"
                value={formData.cafeName}
                onChange={handleInputChange}
                placeholder="Enter your cafe name"
                className={errors.cafeName ? 'crf-error' : ''}
              />
              {errors.cafeName && <span className="crf-error-message">{errors.cafeName}</span>}
            </div>

            <div className="crf-form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell us about your cafe"
                rows="3"
              />
            </div>

            <div className="crf-form-row">
              <div className="crf-form-group">
                <label className="crf-required">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="cafe@example.com"
                  className={errors.email ? 'crf-error' : ''}
                />
                {errors.email && <span className="crf-error-message">{errors.email}</span>}
              </div>

              <div className="crf-form-group">
                <label className="crf-required">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  className={errors.phone ? 'crf-error' : ''}
                />
                {errors.phone && <span className="crf-error-message">{errors.phone}</span>}
              </div>
            </div>

            <div className="crf-form-row">
              <div className="crf-form-group">
                <label>Established Year</label>
                <input
                  type="number"
                  name="establishedYear"
                  value={formData.establishedYear}
                  onChange={handleInputChange}
                  placeholder="2020"
                  min="1900"
                  max="2024"
                />
              </div>

              <div className="crf-form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourcafe.com"
                />
              </div>
            </div>

            <h3 style={{ marginTop: '20px' }}>Address</h3>

            <div className="crf-form-group">
              <label className="crf-required">Street Address</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Street name"
                className={errors.street ? 'crf-error' : ''}
              />
              {errors.street && <span className="crf-error-message">{errors.street}</span>}
            </div>

            <div className="crf-form-row">
              <div className="crf-form-group">
                <label className="crf-required">Plot/Apartment</label>
                <input
                  type="text"
                  name="plotNo"
                  value={formData.plotNo}
                  onChange={handleInputChange}
                  placeholder="Plot/Apt number"
                  className={errors.plotNo ? 'crf-error' : ''}
                />
                {errors.plotNo && <span className="crf-error-message">{errors.plotNo}</span>}
              </div>

              <div className="crf-form-group">
                <label className="crf-required">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="City"
                  className={errors.city ? 'crf-error' : ''}
                />
                {errors.city && <span className="crf-error-message">{errors.city}</span>}
              </div>
            </div>

            <div className="crf-form-row">
              <div className="crf-form-group">
                <label className="crf-required">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  placeholder="Pincode"
                  className={errors.pincode ? 'crf-error' : ''}
                />
                {errors.pincode && <span className="crf-error-message">{errors.pincode}</span>}
              </div>

              <div className="crf-form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="India"
                  disabled
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="crf-step-content">
            <h3>Table Types & Facilities</h3>

            <div className="crf-summary-cards" style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1, background: '#f0e9e0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <i className="fas fa-chair" style={{ fontSize: '24px', color: '#8b4513' }}></i>
                <h4 style={{ margin: '10px 0 5px' }}>Total Tables</h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b4513' }}>{formData.totalTables}</p>
              </div>
              <div style={{ flex: 1, background: '#f0e9e0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <i className="fas fa-users" style={{ fontSize: '24px', color: '#8b4513' }}></i>
                <h4 style={{ margin: '10px 0 5px' }}>Seating Capacity</h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b4513' }}>{formData.seatingCapacity}</p>
              </div>
            </div>

            <div className="crf-facilities">
              <h4>Facilities</h4>
              <div className="crf-checkbox-group">
                <label className="crf-checkbox">
                  <input
                    type="checkbox"
                    name="hasParking"
                    checked={formData.hasParking}
                    onChange={handleInputChange}
                  />
                  <span>Parking Available</span>
                </label>

                <label className="crf-checkbox">
                  <input
                    type="checkbox"
                    name="hasWifi"
                    checked={formData.hasWifi}
                    onChange={handleInputChange}
                  />
                  <span>Free WiFi</span>
                </label>

                <label className="crf-checkbox">
                  <input
                    type="checkbox"
                    name="hasAC"
                    checked={formData.hasAC}
                    onChange={handleInputChange}
                  />
                  <span>Air Conditioned</span>
                </label>
              </div>
            </div>

            <div className="crf-table-types">
              <h4>Table Types <small>(Set your table categories and pricing)</small></h4>
              
              {formData.tableTypes.map((type, index) => (
                <div key={index} className="crf-table-type-card" style={{ 
                  background: '#f9f9f9', 
                  padding: '15px', 
                  marginBottom: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #e8dfca',
                  position: 'relative'
                }}>
                  {index >= 5 && (
                    <button 
                      onClick={() => removeTableType(index)}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        color: '#e74c3c',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                  
                  <div className="crf-form-row">
                    <div className="crf-form-group">
                      <label className="crf-required">Type Name</label>
                      <input
                        type="text"
                        value={type.typeName}
                        onChange={(e) => handleTableTypeChange(index, 'typeName', e.target.value)}
                        placeholder="e.g., Birthday Table"
                        className={errors[`tableTypeName_${index}`] ? 'crf-error' : ''}
                      />
                      {errors[`tableTypeName_${index}`] && <span className="crf-error-message">{errors[`tableTypeName_${index}`]}</span>}
                    </div>
                    
                    <div className="crf-form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        value={type.description || ''}
                        onChange={(e) => handleTableTypeChange(index, 'description', e.target.value)}
                        placeholder="Brief description"
                      />
                    </div>
                  </div>

                  <div className="crf-form-row">
                    <div className="crf-form-group">
                      <label className="crf-required">Table Count</label>
                      <input
                        type="number"
                        value={type.tableCount}
                        onChange={(e) => handleTableTypeChange(index, 'tableCount', e.target.value)}
                        placeholder="Number of tables"
                        min="1"
                        className={errors[`tableCount_${index}`] ? 'crf-error' : ''}
                      />
                      {errors[`tableCount_${index}`] && <span className="crf-error-message">{errors[`tableCount_${index}`]}</span>}
                    </div>
                    
                    <div className="crf-form-group">
                      <label className="crf-required">Seats per Table</label>
                      <input
                        type="number"
                        value={type.seatingCapacityPerTable}
                        onChange={(e) => handleTableTypeChange(index, 'seatingCapacityPerTable', e.target.value)}
                        placeholder="Seats per table"
                        min="1"
                      />
                    </div>

                    <div className="crf-form-group">
                      <label className="crf-required">Price per Hour (₹)</label>
                      <input
                        type="number"
                        value={type.pricePerHour || ''}
                        onChange={(e) => handleTableTypeChange(index, 'pricePerHour', e.target.value)}
                        placeholder="e.g., 500"
                        min="0"
                        step="50"
                        className={errors[`pricePerHour_${index}`] ? 'crf-error' : ''}
                      />
                      {errors[`pricePerHour_${index}`] && <span className="crf-error-message">{errors[`pricePerHour_${index}`]}</span>}
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="button"
                onClick={addTableType}
                style={{
                  background: 'none',
                  border: '2px dashed #8b4513',
                  padding: '10px',
                  width: '100%',
                  borderRadius: '8px',
                  color: '#8b4513',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                <i className="fas fa-plus"></i> Add More Table Type
              </button>
            </div>

            <div className="crf-business-details" style={{ marginTop: '20px' }}>
              <h4>Business Details (Optional)</h4>
              <p className="crf-hint">These details help with verification</p>
              
              <div className="crf-form-group">
                <label>GST Number</label>
                <input
                  type="text"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleInputChange}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>

              <div className="crf-form-group">
                <label>FSSAI License</label>
                <input
                  type="text"
                  name="fssaiLicense"
                  value={formData.fssaiLicense}
                  onChange={handleInputChange}
                  placeholder="12345678901234"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="crf-step-content">
            <h3>Operating Hours</h3>
            <p className="crf-hint">Set your cafe's operating hours for each day</p>

            <div className="crf-hours-table">
              {formData.operatingHours.map((hour, index) => (
                <div key={index} className="crf-hour-row">
                  <div className="crf-day-name">{hour.dayName}</div>
                  
                  <label className="crf-checkbox">
                    <input
                      type="checkbox"
                      checked={hour.isClosed}
                      onChange={(e) => handleOperatingHourChange(index, 'isClosed', e.target.checked)}
                    />
                    <span>Closed</span>
                  </label>

                  {!hour.isClosed && (
                    <>
                      <div className="crf-time-input">
                        <label>Open</label>
                        <input
                          type="time"
                          value={hour.openTime}
                          onChange={(e) => handleOperatingHourChange(index, 'openTime', e.target.value)}
                          className={errors[`open_${index}`] ? 'crf-error' : ''}
                        />
                      </div>

                      <div className="crf-time-input">
                        <label>Close</label>
                        <input
                          type="time"
                          value={hour.closeTime}
                          onChange={(e) => handleOperatingHourChange(index, 'closeTime', e.target.value)}
                          className={errors[`close_${index}`] ? 'crf-error' : ''}
                        />
                      </div>

                      <div className="crf-time-input">
                        <label>Break Start</label>
                        <input
                          type="time"
                          value={hour.breakStart}
                          onChange={(e) => handleOperatingHourChange(index, 'breakStart', e.target.value)}
                        />
                      </div>

                      <div className="crf-time-input">
                        <label>Break End</label>
                        <input
                          type="time"
                          value={hour.breakEnd}
                          onChange={(e) => handleOperatingHourChange(index, 'breakEnd', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {errors.hours && <span className="crf-error-message">{errors.hours}</span>}
          </div>
        )}

        {currentStep === 4 && (
          <div className="crf-step-content">
            <h3>Upload Documents</h3>
            <p className="crf-hint">Upload required documents for verification (PDF, JPG, PNG - Max 10MB)</p>

            <div className="crf-documents-grid">
              {documentTypes.map((doc) => (
                <div key={doc.value} className="crf-document-card">
                  <div className="crf-doc-icon">
                    <i className={`fas ${doc.icon}`}></i>
                  </div>
                  <div className="crf-doc-info">
                    <strong>{doc.label}</strong>
                    <small>Upload your {doc.label}</small>
                  </div>
                  <div className="crf-doc-upload">
                    <input
                      type="file"
                      id={`doc-${doc.value}`}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload(e.target.files[0], doc.value)}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor={`doc-${doc.value}`} className="crf-upload-btn">
                      {uploading.documents[doc.value] ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <>
                          <i className="fas fa-upload"></i> Upload
                        </>
                      )}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {formData.documents.length > 0 && (
              <div className="crf-uploaded-list">
                <h4>Uploaded Documents</h4>
                {formData.documents.map((doc, index) => (
                  <div key={index} className="crf-uploaded-item">
                    <i className={`fas ${documentTypes.find(d => d.value === doc.documentType)?.icon || 'fa-file'}`}></i>
                    <div className="crf-item-info">
                      <strong>{documentTypes.find(d => d.value === doc.documentType)?.label}</strong>
                      <small>{doc.fileName} ({(doc.fileSize / 1024).toFixed(2)} KB)</small>
                    </div>
                    <button className="crf-remove-btn" onClick={() => removeDocument(index)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.documents && <span className="crf-error-message">{errors.documents}</span>}
          </div>
        )}

        {currentStep === 5 && (
          <div className="crf-step-content">
            <h3>Cafe Photos</h3>
            <p className="crf-hint">Upload photos of your cafe (JPG, PNG - Max 5MB each)</p>

            <div className="crf-images-grid">
              {imageTypes.map((img) => (
                <div key={img.value} className="crf-image-card">
                  <div className="crf-img-icon">
                    <i className={`fas ${img.icon}`}></i>
                  </div>
                  <div className="crf-img-info">
                    <strong>{img.label}</strong>
                    <small>Upload {img.label}</small>
                  </div>
                  <div className="crf-img-upload">
                    <input
                      type="file"
                      id={`img-${img.value}`}
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], img.value)}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor={`img-${img.value}`} className="crf-upload-btn">
                      {uploading.images[img.value] ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <>
                          <i className="fas fa-upload"></i> Upload
                        </>
                      )}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {formData.images.length > 0 && (
              <div className="crf-images-preview">
                <h4>Uploaded Photos</h4>
                <div className="crf-preview-grid">
                  {formData.images.map((img, index) => (
                    <div key={index} className="crf-preview-item">
                      <img src={`data:${img.fileType};base64,${img.fileData}`} alt={img.imageType} />
                      {img.isPrimary && <span className="crf-primary-badge">Primary</span>}
                      <button className="crf-remove-img" onClick={() => removeImage(index)}>
                        <i className="fas fa-times"></i>
                      </button>
                      <div className="crf-img-label">
                        {imageTypes.find(i => i.value === img.imageType)?.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.images && <span className="crf-error-message">{errors.images}</span>}
          </div>
        )}

        {currentStep === 6 && (
          <div className="crf-step-content">
            <h3>Review Your Information</h3>

            <div className="crf-review-section">
              <h4><i className="fas fa-store"></i> Basic Information</h4>
              <div className="crf-review-grid">
                <div><strong>Cafe Name:</strong> {formData.cafeName}</div>
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Phone:</strong> {formData.phone}</div>
                {formData.establishedYear && <div><strong>Established:</strong> {formData.establishedYear}</div>}
                {formData.website && <div><strong>Website:</strong> {formData.website}</div>}
                {formData.gstNumber && <div><strong>GST:</strong> {formData.gstNumber}</div>}
                {formData.fssaiLicense && <div><strong>FSSAI:</strong> {formData.fssaiLicense}</div>}
              </div>
            </div>

            <div className="crf-review-section">
              <h4><i className="fas fa-map-marker-alt"></i> Address</h4>
              <div className="crf-review-grid">
                <div><strong>Street:</strong> {formData.street}</div>
                <div><strong>Plot/Apt:</strong> {formData.plotNo}</div>
                <div><strong>City:</strong> {formData.city}</div>
                <div><strong>Pincode:</strong> {formData.pincode}</div>
                <div><strong>Country:</strong> {formData.country}</div>
              </div>
            </div>

            <div className="crf-review-section">
              <h4><i className="fas fa-cog"></i> Facilities</h4>
              <div className="crf-review-grid">
                <div><strong>Parking:</strong> {formData.hasParking ? 'Yes' : 'No'}</div>
                <div><strong>WiFi:</strong> {formData.hasWifi ? 'Yes' : 'No'}</div>
                <div><strong>AC:</strong> {formData.hasAC ? 'Yes' : 'No'}</div>
              </div>
            </div>

            <div className="crf-review-section">
              <h4><i className="fas fa-chair"></i> Table Types</h4>
              <div className="crf-review-list">
                {formData.tableTypes.map((type, index) => (
                  <div key={index}>
                    <i className="fas fa-check-circle" style={{ color: '#27ae60' }}></i>
                    <strong>{type.typeName}:</strong> {type.tableCount} tables, {type.seatingCapacityPerTable} seats/table
                    {type.pricePerHour > 0 && ` (₹${type.pricePerHour}/hour)`}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', padding: '10px', background: '#f0e9e0', borderRadius: '5px' }}>
                <strong>Total Tables:</strong> {formData.totalTables} | <strong>Seating Capacity:</strong> {formData.seatingCapacity}
              </div>
            </div>

            <div className="crf-review-section">
              <h4><i className="fas fa-file-alt"></i> Documents</h4>
              <div className="crf-review-list">
                {formData.documents.map((doc, index) => (
                  <div key={index}>
                    <i className="fas fa-check-circle" style={{ color: '#27ae60' }}></i>
                    {documentTypes.find(d => d.value === doc.documentType)?.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="crf-review-section">
              <h4><i className="fas fa-images"></i> Photos</h4>
              <div className="crf-review-list">
                {formData.images.map((img, index) => (
                  <div key={index}>
                    <i className="fas fa-check-circle" style={{ color: '#27ae60' }}></i>
                    {imageTypes.find(i => i.value === img.imageType)?.label}
                    {img.isPrimary && ' (Primary)'}
                  </div>
                ))}
              </div>
            </div>

            <div className="crf-confirmation">
              <label className="crf-checkbox">
                <input
                  type="checkbox"
                  name="confirmDetails"
                  checked={formData.confirmDetails}
                  onChange={handleInputChange}
                />
                <span>I confirm that all the information provided is accurate and complete</span>
              </label>
              {errors.confirmDetails && <span className="crf-error-message">{errors.confirmDetails}</span>}
            </div>
          </div>
        )}

        <div className="crf-navigation">
          <button
            className="crf-btn crf-btn-prev"
            onClick={handlePrev}
            disabled={currentStep === 1}
            type="button"
          >
            <i className="fas fa-arrow-left"></i> Previous
          </button>

          {currentStep < 6 ? (
            <button
              className="crf-btn crf-btn-next"
              onClick={handleNext}
              type="button"
            >
              Next <i className="fas fa-arrow-right"></i>
            </button>
          ) : (
            <button
              className="crf-btn crf-btn-submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? (
                <><i className="fas fa-spinner fa-spin"></i> Submitting...</>
              ) : (
                <>Submit <i className="fas fa-check"></i></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CafeRegistrationForm;