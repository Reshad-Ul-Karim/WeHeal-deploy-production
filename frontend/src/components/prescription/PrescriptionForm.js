import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Typography, TextField, Button, Grid, IconButton, Alert, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 18,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  background: 'var(--mk-surface, #ffffff)',
  color: 'var(--mk-text, #333)',
  border: '1px solid var(--mk-border, #e5e7eb)',
}));

const StyledSection = styled(Box)(({ theme }) => ({
  background: 'var(--mk-section-bg, #f9fafb)',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(59,130,246,0.06)',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  border: '1px solid var(--mk-border, #e5e7eb)',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'var(--mk-input-bg, #f3f6fb)',
    '& fieldset': {
      borderColor: 'var(--mk-border, #e5e7eb)',
    },
    '&:hover fieldset': {
      borderColor: 'var(--mk-border-hover, #d1d5db)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--mk-primary, #3b82f6)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'var(--mk-text-secondary, #6b7280)',
  },
  '& .MuiInputBase-input': {
    color: 'var(--mk-text, #333)',
  },
}));

const initialMedicine = { 
  name: '', 
  dosage: '', 
  frequency: '', 
  duration: '', 
  comments: '' 
};

const PrescriptionForm = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appointment, setAppointment] = useState(null);

  const [form, setForm] = useState({
    patientId: '',
    appointmentId: appointmentId || '',
    patientName: '',
    symptoms: '',
    medications: [initialMedicine],
    recommendedTests: '',
    nextAppointment: '',
    extraInstructions: ''
  });

  useEffect(() => {
    console.log('useEffect triggered with appointmentId:', appointmentId);
    console.log('Initial form state:', form);
    
    if (appointmentId) {
      console.log('Appointment ID found, fetching appointment details...');
      fetchAppointmentDetails();
    } else {
      console.log('No appointment ID provided');
    }
  }, [appointmentId]);

  const fetchAppointmentDetails = async () => {
    try {
      console.log('Fetching appointment details for ID:', appointmentId);
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${baseURL}/appointments/${appointmentId}`, {
        credentials: 'include'
      });
      
      console.log('Appointment response status:', response.status);
      console.log('Appointment response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Appointment data received:', data);
        console.log('Appointment data structure:', data.data);
        
        setAppointment(data.data);
        setForm(prev => ({
          ...prev,
          patientId: data.data.patientId._id,
          patientName: data.data.patientId.name,
          appointmentId: appointmentId
        }));
        
        console.log('Form updated with appointment data:', {
          patientId: data.data.patientId._id,
          patientName: data.data.patientId.name,
          appointmentId: appointmentId
        });
      } else {
        console.error('Failed to fetch appointment, status:', response.status);
        const errorData = await response.json();
        console.error('Error data:', errorData);
        setError('Failed to fetch appointment details: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching appointment:', err);
      setError('Failed to fetch appointment details: ' + err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMedicineChange = (idx, field, value) => {
    const newMeds = form.medications.map((med, i) =>
      i === idx ? { ...med, [field]: value } : med
    );
    setForm(prev => ({ ...prev, medications: newMeds }));
  };

  const addMedicine = () => {
    setForm(prev => ({
      ...prev,
      medications: [...prev.medications, initialMedicine]
    }));
  };

  const removeMedicine = (idx) => {
    setForm(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== idx)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (!form.patientId || !form.appointmentId) {
      setError('Missing required patient or appointment information');
      setLoading(false);
      return;
    }

    if (!form.medications || form.medications.length === 0) {
      setError('At least one medication is required');
      setLoading(false);
      return;
    }

    // Validate each medication
    for (let i = 0; i < form.medications.length; i++) {
      const med = form.medications[i];
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        setError(`Medication ${i + 1} is missing required fields (name, dosage, frequency, duration)`);
        setLoading(false);
        return;
      }
    }

    // Log form data for debugging
    console.log('=== FORM VALIDATION PASSED ===');
    console.log('Form data structure:', form);
    console.log('Patient ID:', form.patientId);
    console.log('Appointment ID:', form.appointmentId);
    console.log('Patient Name:', form.patientName);
    console.log('Medications count:', form.medications.length);
    console.log('Medications details:', form.medications);
    console.log('=== END FORM DATA ===');

    try {
      console.log('Submitting prescription form with data:', form);
      
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${baseURL}/prescriptions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        alert('Prescription created successfully!');
        navigate('/dashboard/doctor');
      } else {
        setError(data.message || 'Failed to create prescription');
        if (data.error) {
          console.error('Validation errors:', data.error);
        }
      }
    } catch (err) {
      console.error('Error creating prescription:', err);
      setError('Failed to create prescription: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'var(--mk-page-bg, #f8fafc)',
      py: 4
    }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={() => navigate('/dashboard/doctor')}
            sx={{ mr: 2, color: 'var(--mk-text, #333)' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            sx={{ 
              color: 'var(--mk-primary, #3b82f6)',
              fontWeight: 600 
            }}
          >
            Create Prescription
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Validation Status Display */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Form Validation Status:</strong><br />
            Patient ID: {form.patientId ? '✅' : '❌'} {form.patientId || 'Missing'}<br />
            Appointment ID: {form.appointmentId ? '✅' : '❌'} {form.appointmentId || 'Missing'}<br />
            Patient Name: {form.patientName ? '✅' : '❌'} {form.patientName || 'Missing'}<br />
            Medications: {form.medications && form.medications.length > 0 ? '✅' : '❌'} {form.medications?.length || 0} medication(s)<br />
            {form.medications && form.medications.map((med, idx) => (
              <span key={idx}>
                &nbsp;&nbsp;Med {idx + 1}: {med.name && med.dosage && med.frequency && med.duration ? '✅' : '❌'}<br />
              </span>
            ))}
          </Typography>
        </Alert>

        <StyledPaper>
          <form onSubmit={handleSubmit}>
            {/* Patient & Doctor Info */}
            <StyledSection>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'var(--mk-primary, #2563eb)',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Patient & Doctor Info
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Patient Name *"
                    name="patientName"
                    value={form.patientName}
                    onChange={handleChange}
                    required
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Appointment ID"
                    name="appointmentId"
                    value={form.appointmentId}
                    disabled
                  />
                </Grid>
              </Grid>
            </StyledSection>

            {/* Symptoms */}
            <StyledSection>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'var(--mk-primary, #2563eb)',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Symptoms
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'var(--mk-text-secondary, #6b7280)',
                  mb: 2
                }}
              >
                Enter each symptom on a new line
              </Typography>
              <StyledTextField
                fullWidth
                multiline
                rows={3}
                label="Symptoms"
                name="symptoms"
                value={form.symptoms}
                onChange={handleChange}
                placeholder="e.g. Fever&#10;Dry cough"
              />
            </StyledSection>

            {/* Medicines */}
            <StyledSection>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'var(--mk-primary, #2563eb)',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Medicines
              </Typography>
              
              {form.medications.map((med, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid item xs={12} sm={2}>
                      <StyledTextField
                        fullWidth
                        label="Medicine Name"
                        placeholder="e.g. Paracetamol"
                        value={med.name}
                        onChange={e => handleMedicineChange(idx, 'name', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <StyledTextField
                        fullWidth
                        label="Dosage"
                        placeholder="e.g. 500mg"
                        value={med.dosage}
                        onChange={e => handleMedicineChange(idx, 'dosage', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <StyledTextField
                        fullWidth
                        label="Frequency"
                        placeholder="e.g. 1+0+1"
                        value={med.frequency}
                        onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <StyledTextField
                        fullWidth
                        label="Duration"
                        placeholder="e.g. 5 days"
                        value={med.duration}
                        onChange={e => handleMedicineChange(idx, 'duration', e.target.value)}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <StyledTextField
                        fullWidth
                        label="Comments"
                        placeholder="e.g. After meals"
                        value={med.comments}
                        onChange={e => handleMedicineChange(idx, 'comments', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      {form.medications.length > 1 && (
                        <IconButton
                          onClick={() => removeMedicine(idx)}
                          sx={{ 
                            color: '#ef4444',
                            mt: 1
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              ))}
              
              <Button
                startIcon={<AddIcon />}
                onClick={addMedicine}
                variant="outlined"
                sx={{ 
                  color: '#22c55e',
                  borderColor: '#22c55e',
                  '&:hover': {
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(34, 197, 94, 0.04)'
                  }
                }}
              >
                Add Another Medicine
              </Button>
            </StyledSection>

            {/* Recommended Tests */}
            <StyledSection>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'var(--mk-primary, #2563eb)',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Recommended Tests
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'var(--mk-text-secondary, #6b7280)',
                  mb: 2
                }}
              >
                Enter each test on a new line
              </Typography>
              <StyledTextField
                fullWidth
                multiline
                rows={3}
                label="Recommended Tests"
                name="recommendedTests"
                value={form.recommendedTests}
                onChange={handleChange}
                placeholder="e.g. Chest X-Ray&#10;Blood Test"
              />
            </StyledSection>

            {/* Next Appointment */}
            <StyledSection>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'var(--mk-primary, #2563eb)',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Next Appointment
              </Typography>
              <StyledTextField
                fullWidth
                type="date"
                label="Next Visit Date"
                name="nextAppointment"
                value={form.nextAppointment}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </StyledSection>

            {/* Extra Instructions */}
            <StyledSection>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'var(--mk-primary, #2563eb)',
                  fontWeight: 600,
                  mb: 2
                }}
              >
                Extra Instructions
              </Typography>
              <StyledTextField
                fullWidth
                multiline
                rows={2}
                label="Extra Instructions"
                name="extraInstructions"
                value={form.extraInstructions}
                onChange={handleChange}
                placeholder="e.g. Drink plenty of water, rest, etc."
              />
            </StyledSection>

            {/* Submit Button */}
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  backgroundColor: 'var(--mk-primary, #3b82f6)',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  '&:hover': {
                    backgroundColor: 'var(--mk-primary-dark, #2563eb)'
                  },
                  '&:disabled': {
                    backgroundColor: 'var(--mk-disabled, #9ca3af)'
                  }
                }}
              >
                {loading ? 'Creating...' : 'Create Prescription'}
              </Button>
              
              {/* Test Button for Debugging */}
              <Button
                type="button"
                variant="outlined"
                size="large"
                onClick={() => {
                  console.log('=== TEST BUTTON CLICKED ===');
                  console.log('Current form state:', form);
                  console.log('Current appointment:', appointment);
                  console.log('Appointment ID from params:', appointmentId);
                  
                  // Test with hardcoded data
                  const testData = {
                    patientId: form.patientId || 'test-patient-id',
                    appointmentId: form.appointmentId || 'test-appointment-id',
                    patientName: form.patientName || 'Test Patient',
                    symptoms: 'Test symptoms',
                    medications: [{
                      name: 'Test Medicine',
                      dosage: '500mg',
                      frequency: '1+0+1',
                      duration: '5 days',
                      comments: 'Test comment'
                    }],
                    recommendedTests: 'Test test',
                    nextAppointment: '2024-12-31',
                    extraInstructions: 'Test instructions'
                  };
                  
                  console.log('Test data to send:', testData);
                  
                  // Test the API endpoint
                  fetch('http://localhost:5001/api/prescriptions/test', {
                    credentials: 'include'
                  })
                  .then(response => response.json())
                  .then(data => {
                    console.log('Test endpoint response:', data);
                  })
                  .catch(err => {
                    console.error('Test endpoint error:', err);
                  });
                }}
                sx={{
                  ml: 2,
                  borderColor: '#22c55e',
                  color: '#22c55e',
                  '&:hover': {
                    borderColor: '#16a34a',
                    backgroundColor: 'rgba(34, 197, 94, 0.04)'
                  }
                }}
              >
                Test API
              </Button>
            </Box>
          </form>
        </StyledPaper>
      </Box>
    </Box>
  );
};

export default PrescriptionForm;
