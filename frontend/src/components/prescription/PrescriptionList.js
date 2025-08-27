import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Chip, 
  Card, 
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
  Pagination
} from '@mui/material';
import { styled } from '@mui/material/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import MedicationIcon from '@mui/icons-material/Medication';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'var(--mk-surface, #ffffff)',
  color: 'var(--mk-text, #333)',
  border: '1px solid var(--mk-border, #e5e7eb)',
  borderRadius: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
  },
}));

const PrescriptionList = ({ userRole = 'patient' }) => {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    fetchPrescriptions();
  }, [page, userRole]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const endpoint = userRole === 'doctor' ? '/prescriptions/doctor' : '/prescriptions/patient';
      const response = await fetch(`${baseURL}${endpoint}?page=${page}&limit=10`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.data.prescriptions);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch prescriptions');
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Failed to fetch prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (prescriptionId, prescription) => {
    try {
      setDownloading(prev => ({ ...prev, [prescriptionId]: true }));
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${baseURL}/prescriptions/${prescriptionId}/pdf`, {
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
      setDownloading(prev => ({ ...prev, [prescriptionId]: false }));
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <LocalHospitalIcon sx={{ mr: 2, color: 'var(--mk-primary, #3b82f6)' }} />
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'var(--mk-text, #333)',
            fontWeight: 600 
          }}
        >
          {userRole === 'doctor' ? 'My Prescriptions' : 'My Prescriptions'}
        </Typography>
      </Box>

      {prescriptions.length === 0 ? (
        <StyledCard>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <LocalHospitalIcon sx={{ fontSize: 64, color: 'var(--mk-text-secondary, #6b7280)', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Prescriptions Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userRole === 'doctor' 
                ? 'You haven\'t created any prescriptions yet.' 
                : 'You don\'t have any prescriptions yet.'
              }
            </Typography>
          </CardContent>
        </StyledCard>
      ) : (
        <>
          {/* Prescriptions Grid */}
          <Grid container spacing={3}>
            {prescriptions.map((prescription) => (
              <Grid item xs={12} md={6} lg={4} key={prescription._id}>
                <StyledCard>
                  <CardContent>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip 
                        label={prescription.prescriptionId}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: 'var(--mk-primary, #3b82f6)',
                          color: 'var(--mk-primary, #3b82f6)'
                        }}
                      />
                      <Chip 
                        label={prescription.status}
                        size="small"
                        color={prescription.status === 'active' ? 'success' : 'default'}
                      />
                    </Box>

                    {/* Patient/Doctor Info */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        {userRole === 'doctor' ? 'Patient' : 'Doctor'}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {userRole === 'doctor' 
                          ? prescription.patientName 
                          : prescription.doctorName
                        }
                      </Typography>
                    </Box>

                    {/* Date */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <EventIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        Prescription Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(prescription.date).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {/* Medications Count */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <MedicationIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        Medications
                      </Typography>
                      <Typography variant="body1">
                        {prescription.medications?.length || 0} medication(s)
                      </Typography>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/prescription/${prescription._id}`)}
                        sx={{
                          borderColor: 'var(--mk-primary, #3b82f6)',
                          color: 'var(--mk-primary, #3b82f6)',
                          flex: 1
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={downloading[prescription._id] ? <CircularProgress size={16} /> : <DownloadIcon />}
                        onClick={() => handleDownloadPDF(prescription._id, prescription)}
                        disabled={downloading[prescription._id]}
                        sx={{
                          backgroundColor: 'var(--mk-primary, #3b82f6)',
                          '&:hover': {
                            backgroundColor: 'var(--mk-primary-dark, #2563eb)'
                          },
                          flex: 1
                        }}
                      >
                        {downloading[prescription._id] ? 'Downloading...' : 'Download'}
                      </Button>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: 'var(--mk-text, #333)',
                  },
                  '& .Mui-selected': {
                    backgroundColor: 'var(--mk-primary, #3b82f6)',
                    color: 'white',
                  },
                }}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default PrescriptionList;
