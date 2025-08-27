import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Chip, 
  Divider, 
  Alert,
  IconButton,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import MedicationIcon from '@mui/icons-material/Medication';

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

const PrescriptionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/prescriptions/${id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPrescription(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch prescription');
      }
    } catch (err) {
      console.error('Error fetching prescription:', err);
      setError('Failed to fetch prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`/api/prescriptions/${id}/pdf`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription-${prescription.prescriptionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download PDF');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'var(--mk-page-bg, #f8fafc)'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'var(--mk-page-bg, #f8fafc)',
        py: 4
      }}>
        <Box sx={{ maxWidth: 800, mx: 'auto', px: 2 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  if (!prescription) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'var(--mk-page-bg, #f8fafc)',
        py: 4
      }}>
        <Box sx={{ maxWidth: 800, mx: 'auto', px: 2 }}>
          <Alert severity="warning">
            Prescription not found
          </Alert>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'var(--mk-page-bg, #f8fafc)',
      py: 4
    }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton 
              onClick={() => navigate('/dashboard')}
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
              Prescription Details
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => window.open(`/api/prescriptions/${id}/pdf`, '_blank')}
              sx={{
                borderColor: 'var(--mk-primary, #3b82f6)',
                color: 'var(--mk-primary, #3b82f6)'
              }}
            >
              View PDF
            </Button>
            <Button
              variant="contained"
              startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleDownloadPDF}
              disabled={downloading}
              sx={{
                backgroundColor: 'var(--mk-primary, #3b82f6)',
                '&:hover': {
                  backgroundColor: 'var(--mk-primary-dark, #2563eb)'
                }
              }}
            >
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          </Box>
        </Box>

        <StyledPaper>
          {/* Prescription Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'var(--mk-primary, #3b82f6)',
                fontWeight: 600,
                mb: 1
              }}
            >
              Medical Prescription
            </Typography>
            <Chip 
              label={prescription.prescriptionId}
              variant="outlined"
              sx={{ 
                borderColor: 'var(--mk-primary, #3b82f6)',
                color: 'var(--mk-primary, #3b82f6)'
              }}
            />
          </Box>

          {/* Patient & Doctor Info */}
          <StyledSection>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'var(--mk-primary, #2563eb)',
                fontWeight: 600,
                mb: 2,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <PersonIcon sx={{ mr: 1 }} />
              Patient Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Patient Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {prescription.patientName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {prescription.patientId.email}
                </Typography>
              </Grid>
            </Grid>
          </StyledSection>

          <StyledSection>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'var(--mk-primary, #2563eb)',
                fontWeight: 600,
                mb: 2,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LocalHospitalIcon sx={{ mr: 1 }} />
              Doctor Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Doctor Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {prescription.doctorName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Specialization
                </Typography>
                <Typography variant="body1">
                  {prescription.doctorId.specialization}
                </Typography>
              </Grid>
            </Grid>
          </StyledSection>

          <StyledSection>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'var(--mk-primary, #2563eb)',
                fontWeight: 600,
                mb: 2,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <EventIcon sx={{ mr: 1 }} />
              Appointment Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Prescription Date
                </Typography>
                <Typography variant="body1">
                  {new Date(prescription.date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Appointment Date
                </Typography>
                <Typography variant="body1">
                  {new Date(prescription.appointmentId.appointmentDate).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </StyledSection>

          {/* Symptoms */}
          {prescription.symptoms && (
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
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {prescription.symptoms}
              </Typography>
            </StyledSection>
          )}

          {/* Medications */}
          {prescription.medications && prescription.medications.length > 0 && (
            <StyledSection>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'var(--mk-primary, #2563eb)',
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <MedicationIcon sx={{ mr: 1 }} />
                Medications
              </Typography>
              {prescription.medications.map((med, index) => (
                <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'var(--mk-med-bg, #f8fafc)', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {index + 1}. {med.name}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Dosage
                      </Typography>
                      <Typography variant="body1">
                        {med.dosage}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Frequency
                      </Typography>
                      <Typography variant="body1">
                        {med.frequency}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body1">
                        {med.duration}
                      </Typography>
                    </Grid>
                    {med.comments && (
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          Comments
                        </Typography>
                        <Typography variant="body1">
                          {med.comments}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ))}
            </StyledSection>
          )}

          {/* Recommended Tests */}
          {prescription.recommendedTests && (
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
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {prescription.recommendedTests}
              </Typography>
            </StyledSection>
          )}

          {/* Next Appointment */}
          {prescription.nextAppointment && (
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
              <Typography variant="body1">
                {new Date(prescription.nextAppointment).toLocaleDateString()}
              </Typography>
            </StyledSection>
          )}

          {/* Extra Instructions */}
          {prescription.extraInstructions && (
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
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                {prescription.extraInstructions}
              </Typography>
            </StyledSection>
          )}

          {/* Footer */}
          <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid var(--mk-border, #e5e7eb)' }}>
            <Typography variant="body2" color="text.secondary">
              This prescription is valid for the specified duration only.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please consult your doctor before making any changes to the medication.
            </Typography>
          </Box>
        </StyledPaper>
      </Box>
    </Box>
  );
};

export default PrescriptionView;
