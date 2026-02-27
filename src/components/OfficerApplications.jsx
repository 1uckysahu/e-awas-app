import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Button,
  Avatar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import PdfViewerDialog from './PdfViewerDialog';

const ApplicationPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 4px 12px 0 rgba(0,0,0,0.05)',
  borderRadius: theme.shape.borderRadius * 1.5,
}));

const OfficerApplications = ({ officerType }) => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error(t('officer_not_logged_in'));

      const managedItemsQuery = query(
        collection(db, officerType === 'quarter' ? 'quarters' : 'guestHouses'),
        where('officerId', '==', user.uid)
      );
      const managedItemsSnapshot = await getDocs(managedItemsQuery);
      const managedItemIds = managedItemsSnapshot.docs.map((doc) => doc.id);

      if (managedItemIds.length === 0) {
        setApplications([]);
        return;
      }

      const applicationsQuery = query(
        collection(db, 'applications'),
        where(officerType === 'quarter' ? 'quarterId' : 'guestHouseId', 'in', managedItemIds),
        where('status', '==', 'pending')
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);

      const applicationsData = await Promise.all(
        applicationsSnapshot.docs.map(async (appDoc) => {
          const application = { id: appDoc.id, ...appDoc.data() };
          const userDocRef = doc(db, 'users', application.userId);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.exists() ? userDoc.data() : {};
          return { ...application, user: userData };
        })
      );

      setApplications(applicationsData);
    } catch (err) {
      setError(err.message);
      console.error(`Error fetching ${officerType} applications:`, err);
    } finally {
      setLoading(false);
    }
  },[officerType, t]);

  useEffect(() => {
    fetchApplications();
  }, [officerType, fetchApplications]);

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const appDocRef = doc(db, 'applications', appId);
      await updateDoc(appDocRef, { status: newStatus });
      fetchApplications();
    } catch (error) {
      console.error('Error updating application status:', error);
      setError(t('error_updating_status'));
    }
  };
  
    const handleOpenPdf = (pdfUrl) => {
    setSelectedPdf(pdfUrl);
  };

  const handleClosePdf = () => {
    setSelectedPdf(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center">
        {t('error_fetching_applications')}: {error}
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom component="h2">
        {t('pending_applications')}
      </Typography>
      {applications.length === 0 ? (
        <Typography>{t('no_pending_applications')}</Typography>
      ) : (
        applications.map((app) => (
          <ApplicationPaper key={app.id}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid xs={12} md={8}>
                <Box display="flex" alignItems="center">
                    <Avatar src={app.user.photoURL} sx={{ width: 56, height: 56, mr: 2 }} />
                    <Box>
                        <Typography variant="h6">{app.user.fullName}</Typography>
                        <Typography variant="body2" color="text.secondary">{app.user.email}</Typography>
                         <Typography variant="body2" color="text.secondary">{app.user.phone}</Typography>
                    </Box>
                </Box>
                {app.applicationType === 'quarterAllotment' && (
                  <Box mt={2}>
                    <Button variant="outlined" onClick={() => handleOpenPdf(app.joiningLetterUrl)}>
                      {t('view_joining_letter')}
                    </Button>
                  </Box>
                )}
              </Grid>
              <Grid xs={12} md={4} sx={{ textAlign: { md: 'right' }, mt: { xs: 2, md: 0 } }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleUpdateStatus(app.id, 'approved')}
                  sx={{ mr: 1 }}
                >
                  {t('approve')}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleUpdateStatus(app.id, 'rejected')}
                >
                  {t('reject')}
                </Button>
              </Grid>
            </Grid>
          </ApplicationPaper>
        ))
      )}
        {selectedPdf && (
        <PdfViewerDialog
          open={Boolean(selectedPdf)}
          handleClose={handleClosePdf}
          pdfUrl={selectedPdf}
        />
      )}
    </Box>
  );
};

OfficerApplications.propTypes = {
  officerType: PropTypes.oneOf(['quarter', 'guestHouse']).isRequired,
};

export default OfficerApplications;