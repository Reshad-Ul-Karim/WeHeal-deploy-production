import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
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
  CircularProgress,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import MedicationIcon from '@mui/icons-material/Medication';

// Template styles
const TemplateWrapper = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: 850,
  margin: '0 auto',
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  border: '1px solid #e5e7eb',
  position: 'relative',
  overflow: 'hidden'
}));

const TemplateHeader = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 80px 1fr',
  alignItems: 'center',
  gap: 16,
  padding: '20px 24px',
  borderBottom: '1px solid #e5e7eb',
  background: 'linear-gradient(135deg, #0ea5b0 0%, #155e75 100%)',
  color: 'white'
}));

const HeaderBlock = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 4
}));

const TemplateTopMeta = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr 2fr',
  gap: 8,
  padding: '10px 16px',
  borderBottom: '1px solid #e5e7eb',
  background: '#f8fafc',
  color: '#0f172a',
  fontWeight: 600
}));

const TemplateBody = styled('div')(({ theme }) => ({
  display: 'flex',
  minHeight: 700,
}));

const RxSidebar = styled('div')(({ theme }) => ({
  width: 60,
  padding: '24px 16px',
  color: '#0ea5b0',
  fontWeight: 800,
  letterSpacing: '0.15em'
}));

const BodyContent = styled('div')(({ theme }) => ({
  flex: 1,
  padding: '24px',
  position: 'relative'
}));

const Watermark = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: '40%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 320,
  height: 320,
  borderRadius: '50%',
  border: '6px solid rgba(14,165,176,0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none'
}));

const WatermarkPlus = styled('div')(({ theme }) => ({
  width: 140,
  height: 140,
  borderRadius: 16,
  border: '24px solid rgba(14,165,176,0.07)'
}));

const TemplateFooter = styled('div')(({ theme }) => ({
  borderTop: '1px solid #e5e7eb',
  padding: '10px 16px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  background: '#f8fafc',
  color: '#475569',
  fontSize: 12
}));

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
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/prescriptions/${id}`);

      if (response.data.success) {
        setPrescription(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch prescription');
      }
    } catch (err) {
      console.error('Error fetching prescription:', err);
      setError('Failed to fetch prescription');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPDF = async () => {
    try {
      const response = await api.get(`/prescriptions/${id}/pdf`, {
        responseType: 'blob'
      });

      if (response.data) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
        setPdfViewerOpen(true);
      } else {
        setError('Failed to load PDF');
      }
    } catch (err) {
      console.error('Error loading PDF:', err);
      setError('Failed to load PDF');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const response = await api.get(`/prescriptions/${id}/pdf`, {
        responseType: 'blob'
      });

      if (response.data) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
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

  const handleClosePdfViewer = () => {
    setPdfViewerOpen(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl('');
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
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <button
              onClick={handleViewPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: '2px solid #0ea5b0',
                borderRadius: '8px',
                color: '#0ea5b0',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0ea5b0';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#0ea5b0';
              }}
            >
              <VisibilityIcon style={{ fontSize: '18px' }} />
              View PDF
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                backgroundColor: '#0ea5b0',
                border: '2px solid #0ea5b0',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: downloading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                opacity: downloading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!downloading) {
                  e.target.style.backgroundColor = '#155e75';
                  e.target.style.borderColor = '#155e75';
                }
              }}
              onMouseLeave={(e) => {
                if (!downloading) {
                  e.target.style.backgroundColor = '#0ea5b0';
                  e.target.style.borderColor = '#0ea5b0';
                }
              }}
            >
              {downloading ? (
                <CircularProgress size={16} style={{ color: 'white' }} />
              ) : (
                <DownloadIcon style={{ fontSize: '18px' }} />
              )}
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </Box>
        </Box>

        <TemplateWrapper>
          <TemplateHeader>
            <HeaderBlock>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                Dr. {prescription.doctorName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {prescription.doctorId?.specialization || 'General Physician'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                This is a computer generated prescription
              </Typography>
            </HeaderBlock>
            <Box sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 24
            }}>+</Box>
            <HeaderBlock sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1 }}>
                HOSPITAL
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>WeHeal</Typography>
            </HeaderBlock>
          </TemplateHeader>

          <TemplateTopMeta>
            <div>Date: {new Date(prescription.date).toLocaleDateString()}</div>
            <div>Patient Name: {prescription.patientName}</div>
            <div>Age: {prescription.patientId?.age || '-'}</div>
            <div>Address: {prescription.patientId?.address || '-'}</div>
          </TemplateTopMeta>

          <TemplateBody>
            <RxSidebar>R X</RxSidebar>
            <BodyContent>
              <Watermark>
                <WatermarkPlus />
              </Watermark>

              {/* Medications list */}
              {prescription.medications?.map((med, idx) => (
                <Box key={idx} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {idx + 1}. {med.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dosage: {med.dosage || '-'} — Frequency: {med.frequency || '-'} — Duration: {med.duration || '-'}
                  </Typography>
                  {med.comments && (
                    <Typography variant="body2" color="text.secondary">Notes: {med.comments}</Typography>
                  )}
                </Box>
              ))}

              {/* Optional sections */}
              {prescription.recommendedTests && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Recommended Tests</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: '#0f172a' }}>{prescription.recommendedTests}</Typography>
                </Box>
              )}

              {prescription.nextAppointment && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Next Appointment</Typography>
                  <Typography variant="body1" sx={{ color: '#0f172a' }}>{new Date(prescription.nextAppointment).toLocaleDateString()}</Typography>
                </Box>
              )}

              {prescription.extraInstructions && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Instructions</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{prescription.extraInstructions}</Typography>
                </Box>
              )}
            </BodyContent>
          </TemplateBody>

          <TemplateFooter>
            <div>
              Phone: {prescription.doctorId?.phone || 'N/A'}
            </div>
            <div style={{ textAlign: 'center' }}>
              www.weheal.com
            </div>
            <div style={{ textAlign: 'right' }}>
              {prescription.patientId?.address || 'Address'}
            </div>
          </TemplateFooter>
        </TemplateWrapper>
      </Box>

      {/* PDF Viewer Modal */}
      <Dialog
        open={pdfViewerOpen}
        onClose={handleClosePdfViewer}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Prescription PDF - {prescription?.prescriptionId}
          </Typography>
          <IconButton onClick={handleClosePdfViewer} size="small">
            <ArrowBackIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              width="100%"
              height="100%"
              style={{
                border: 'none',
                minHeight: '70vh'
              }}
              title="Prescription PDF"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ 
          borderTop: '1px solid #e5e7eb',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          gap: 2
        }}>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: 'transparent',
              border: '2px solid #0ea5b0',
              borderRadius: '8px',
              color: '#0ea5b0',
              fontSize: '14px',
              fontWeight: '600',
              cursor: downloading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              opacity: downloading ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!downloading) {
                e.target.style.backgroundColor = '#0ea5b0';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!downloading) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#0ea5b0';
              }
            }}
          >
            {downloading ? (
              <CircularProgress size={16} style={{ color: '#0ea5b0' }} />
            ) : (
              <DownloadIcon style={{ fontSize: '18px' }} />
            )}
            {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            onClick={handleClosePdfViewer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: '#0ea5b0',
              border: '2px solid #0ea5b0',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#155e75';
              e.target.style.borderColor = '#155e75';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#0ea5b0';
              e.target.style.borderColor = '#0ea5b0';
            }}
          >
            Close
          </button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrescriptionView;
