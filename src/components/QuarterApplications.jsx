import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Button, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { createNotification } from '../notifications';
import { sendEmail } from '../email';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";

const QuarterApplications = ({ refreshKey, officerLocation }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [vacateDialogOpen, setVacateDialogOpen] = useState(false);
  const [leaveDate, setLeaveDate] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);

  const handleViewLetter = (url) => {
    const correctedUrl = url.replace('/raw/upload/', '/image/upload/');
    setSelectedImage(correctedUrl);
    setLightboxOpen(true);
  };

  const generateShortId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user || !officerLocation) {
        setLoading(false);
        return;
      }

      const quartersQuery = query(
        collection(db, 'quarters'), 
        where('location', '==', officerLocation)
      );
      const quartersSnapshot = await getDocs(quartersQuery);
      const quarterIds = quartersSnapshot.docs.map(doc => doc.id);

      if (quarterIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'applications'),
        where('applicationType', '==', 'quarterAllotment'),
        where('quarterId', 'in', quarterIds)
      );
      const querySnapshot = await getDocs(q);
      const applicationsData = await Promise.all(querySnapshot.docs.map(async (appDoc) => {
        const application = { id: appDoc.id, ...appDoc.data() };
        const userDoc = await getDoc(doc(db, 'users', application.userId));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const quarterDocRef = doc(db, 'quarters', application.quarterId);
        const quarterDoc = await getDoc(quarterDocRef);
        const quarterData = quarterDoc.exists() ? quarterDoc.data() : {};

        let shortQuarterId = quarterData.shortQuarterId;
        if (!shortQuarterId) {
            shortQuarterId = generateShortId();
            await updateDoc(quarterDocRef, { shortQuarterId });
        }

        return { 
            ...application, 
            userData, 
            quarterName: quarterData.name || t('unknown_quarter'),
            quarterType: quarterData.quarterType || t('n_a'),
            shortQuarterId: shortQuarterId,
            quarterLocation: quarterData.location || t('unknown_location'),
            appliedOn: application.appliedOn.toDate(),
            joiningDate: application.joiningDate?.toDate ? application.joiningDate.toDate() : (application.joiningDate ? new Date(application.joiningDate) : null),
            allotmentDate: application.allotmentDate?.toDate ? application.allotmentDate.toDate() : null,
            leaveDate: application.leaveDate?.toDate ? application.leaveDate.toDate() : null,
            applicationId: appDoc.id,
        };
      }));
      const finalFilteredData = applicationsData.filter(app => app.quarterLocation === officerLocation);
      setApplications(finalFilteredData);
    } catch (err) {
      console.error(err);
      setError(t('error_fetching_applications'));
    } finally {
      setLoading(false);
    }
  }, [t, officerLocation]);

  useEffect(() => {
      if(officerLocation){
        fetchApplications();
      }
  }, [fetchApplications, refreshKey, officerLocation]);

  const handleStatusChange = async (app, newStatus) => {
    try {
      const appRef = doc(db, 'applications', app.id);
      await updateDoc(appRef, { status: newStatus, allotmentDate: new Date() });
      
      if(newStatus === 'approved'){
        const quarterRef = doc(db, 'quarters', app.quarterId);
        await updateDoc(quarterRef, { 
          available: false,
          occupantId: app.userId,
          occupantName: app.userData.fullName,
          allotmentDate: new Date(),
         });
      }

      const subject = t('application_status_update_subject', { quarterName: app.quarterName, status: newStatus });
      const body = t('application_status_update_body', { 
        fullName: app.userData.fullName, 
        quarterName: app.quarterName, 
        status: newStatus 
      });

      await sendEmail(app.userData.email, subject, body);

      const message = t('application_status_update_notification', { quarterName: app.quarterName, status: newStatus });
      await createNotification(app.userId, message);
      fetchApplications();
      handleCloseDetails();
    } catch (error) {
      console.error('Error updating application status:', error);
      setError(t('error_updating_status'));
    }
  };

  const handleMarkAsVacated = async () => {
    if(!selectedApp || !leaveDate) return;
    try {
      const appRef = doc(db, 'applications', selectedApp.id);
      await updateDoc(appRef, { status: t('vacated'), leaveDate: leaveDate });

      const quarterRef = doc(db, 'quarters', selectedApp.quarterId);
      await updateDoc(quarterRef, {
        available: true,
        occupantId: null,
        occupantName: null,
        allotmentDate: null,
      });

      const message = t('quarter_vacated_notification', { quarterName: selectedApp.quarterName });
      await createNotification(selectedApp.userId, message);
      fetchApplications();
      handleCloseVacateDialog();
    } catch (error) {
      console.error('Error vacating quarter:', error);
      setError(t('error_vacating_quarter'));
    }
  }

  const handleDeleteClick = (app) => {
    setAppToDelete(app);
    setDeleteConfirmOpen(true);
  };

  const handleCloseDeleteConfirm = () => {
    setAppToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!appToDelete) return;
    try {
      await deleteDoc(doc(db, 'applications', appToDelete.id));
      fetchApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      setError(t('error_deleting_application'));
    } finally {
      handleCloseDeleteConfirm();
    }
  };


  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedApp(null);
  };

  const handleOpenVacateDialog = (app) => {
    setSelectedApp(app);
    setVacateDialogOpen(true);
  };

  const handleCloseVacateDialog = () => {
    setVacateDialogOpen(false);
    setSelectedApp(null);
    setLeaveDate(null);
  };

  const renderTable = (apps, type) => (
    <TableContainer>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>{t('application_number')}</TableCell>
            <TableCell>{t('applicant_name')}</TableCell>
            <TableCell>{t('quarter_name')}</TableCell>
            <TableCell>{t('quarter_type')}</TableCell>
            <TableCell>{t('quarter_id')}</TableCell>
            {type === 'pending' && <TableCell>{t('joining_date')}</TableCell>}
            {type === 'approved' && <TableCell>{t('allotment_date')}</TableCell>}
            {type === 'history' && <TableCell>{t('date')}</TableCell>}
            <TableCell>{t('applied_on')}</TableCell>
            <TableCell>{t('status')}</TableCell>
            <TableCell>{t('actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {apps.map((app) => (
            <TableRow key={app.id}>
              <TableCell>{app.applicationId}</TableCell>
              <TableCell>{app.userData.fullName}</TableCell>
              <TableCell>{app.quarterName}</TableCell>
              <TableCell>{app.quarterType}</TableCell>
              <TableCell>{app.shortQuarterId}</TableCell>
              {type === 'pending' && <TableCell>{app.joiningDate ? app.joiningDate.toLocaleDateString() : t('n_a')}</TableCell>}
              {type === 'approved' && <TableCell>{app.allotmentDate ? app.allotmentDate.toLocaleDateString() : t('n_a')}</TableCell>}
              {type === 'history' && <TableCell>{app.leaveDate ? app.leaveDate.toLocaleDateString() : t('n_a')}</TableCell>}
              <TableCell>{app.appliedOn.toLocaleDateString()}</TableCell>
              <TableCell>{t(app.status)}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {type === 'pending' && 
                    <>
                      <Button variant="outlined" onClick={() => handleViewDetails(app)}>{t('view_details')}</Button>
                      <Button variant="outlined" color="error" onClick={() => handleDeleteClick(app)}>{t('delete')}</Button>
                    </>
                  }
                  {type === 'approved' &&
                    <>
                        <Button variant="outlined" onClick={() => handleOpenVacateDialog(app)}>{t('mark_as_vacated')}</Button>
                        <Button variant="outlined" color="error" onClick={() => handleDeleteClick(app)}>{t('delete')}</Button>
                    </>
                  }
                  {type === 'history' &&
                    <Button variant="outlined" color="error" onClick={() => handleDeleteClick(app)}>{t('delete')}</Button>
                  }
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const pendingApps = applications.filter(app => app.status === 'pending').sort((a,b) => a.joiningDate - b.joiningDate);
  const approvedApps = applications.filter(app => app.status === 'approved');
  const historyApps = applications.filter(app => app.status === 'rejected' || app.status === 'vacated');

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 2, margin: 'auto', marginTop: 4 }}>
        <Typography variant="h5" gutterBottom>{t('pending_applications_for_location', {location: officerLocation})}</Typography>
        <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
          <Tab label={t('pending')} />
          <Tab label={t('approved_allotted')} />
          <Tab label={t('history')} />
        </Tabs>
        {tabValue === 0 && (pendingApps.length > 0 ? renderTable(pendingApps, 'pending') : <Typography sx={{p: 2}}>{t('no_pending_applications_found')}</Typography>)}        
        {tabValue === 1 && (approvedApps.length > 0 ? renderTable(approvedApps, 'approved') : <Typography sx={{p: 2}}>{t('no_approved_applications_found')}</Typography>)}
        {tabValue === 2 && (historyApps.length > 0 ? renderTable(historyApps, 'history') : <Typography sx={{p: 2}}>{t('no_application_history_found')}</Typography>)}

        {selectedApp && (
            <Dialog open={detailsOpen} onClose={handleCloseDetails} maxWidth="md">
                <DialogTitle>{t('application_details')}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: '0 !important' }}>
                            <Box
                                component="img"
                                sx={{
                                    height: 200,
                                    width: 160,
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                    border: '2px solid #fff',
                                    mb: 2
                                }}
                                alt={t('applicant_photo')}
                                src={selectedApp.userData.photoUrl}
                            />
                            <Typography variant="h6" align="center">{selectedApp.userData.fullName}</Typography>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <TableContainer component={Paper} elevation={0} variant="outlined">
                                <Table size="small">
                                    <TableBody>
                                        <TableRow><TableCell sx={{ fontWeight: 'bold' }}>{t('email')}</TableCell><TableCell>{selectedApp.userData.email || t('n_a')}</TableCell></TableRow>
                                        <TableRow><TableCell sx={{ fontWeight: 'bold' }}>{t('phone')}</TableCell><TableCell>{selectedApp.userData.mobile || t('n_a')}</TableCell></TableRow>
                                        <TableRow><TableCell sx={{ fontWeight: 'bold' }}>{t('designation')}</TableCell><TableCell>{selectedApp.userData.designation || t('n_a')}</TableCell></TableRow>
                                        <TableRow><TableCell sx={{ fontWeight: 'bold' }}>{t('department')}</TableCell><TableCell>{selectedApp.userData.department || t('n_a')}</TableCell></TableRow>
                                        <TableRow><TableCell sx={{ fontWeight: 'bold' }}>{t('location')}</TableCell><TableCell>{selectedApp.userData.location || t('n_a')}</TableCell></TableRow>
                                        <TableRow><TableCell sx={{ fontWeight: 'bold' }}>{t('joining_date')}</TableCell><TableCell>{selectedApp.joiningDate ? selectedApp.joiningDate.toLocaleDateString() : t('n_a')}</TableCell></TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Button variant="outlined" onClick={() => handleViewLetter(selectedApp.joiningLetterUrl)}>{t('view_joining_letter')}</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                    <Button onClick={handleCloseDetails}>{t('close')}</Button>
                    {selectedApp.status === 'pending' &&
                        <Box>
                            <Button variant="contained" color="success" onClick={() => handleStatusChange(selectedApp, 'approved')} sx={{ mr: 1 }}>{t('approve')}</Button>
                            <Button variant="contained" color="error" onClick={() => handleStatusChange(selectedApp, 'rejected')}>{t('reject')}</Button>
                        </Box>
                    }
                </DialogActions>
            </Dialog>
        )}

        {selectedApp && (
            <Dialog open={vacateDialogOpen} onClose={handleCloseVacateDialog}>
                <DialogTitle>{t('mark_as_vacated')}</DialogTitle>
                <DialogContent>
                    <Typography>
                        {t('confirm_vacate_message', { quarterName: selectedApp?.quarterName, occupantName: selectedApp?.userData.fullName })}
                    </Typography>
                    <DatePicker
                        label={t('leave_release_date')}
                        value={leaveDate}
                        onChange={(newValue) => setLeaveDate(newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth sx={{mt: 2}} />}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseVacateDialog}>{t('cancel')}</Button>
                    <Button onClick={handleMarkAsVacated} color="primary" variant="contained">{t('confirm')}</Button>
                </DialogActions>
            </Dialog>
        )}

        <Dialog open={deleteConfirmOpen} onClose={handleCloseDeleteConfirm}>
            <DialogTitle>{t('delete_application')}</DialogTitle>
            <DialogContent>
                <Typography>
                    {t('delete_application_confirm', { appName: appToDelete?.userData.fullName, quarterName: appToDelete?.quarterName })}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDeleteConfirm}>{t('cancel')}</Button>
                <Button onClick={handleConfirmDelete} color="error" variant="contained">{t('delete')}</Button>
            </DialogActions>
        </Dialog>

        <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={selectedImage ? [{ src: selectedImage }] : []}
            plugins={[Zoom]}
        />
      </Paper>
    </LocalizationProvider>
  );
};

QuarterApplications.propTypes = {
  refreshKey: PropTypes.number.isRequired,
  officerLocation: PropTypes.string.isRequired,
};

export default QuarterApplications;