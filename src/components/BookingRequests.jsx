
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, CircularProgress, Alert, Tabs, Tab, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { createNotification } from '../notifications';
import BookingDetailsDialog from './BookingDetailsDialog';

const BookingRequests = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ open: false, appId: null });
  const { t, i18n } = useTranslation();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    const currentUser = auth.currentUser;
    if (!currentUser) {
        setLoading(false);
        setError(t('not_logged_in'));
        return;
    }

    const priorityOrder = {
      'Official Duty': 1,
      'Retired': 2,
      'Personal Tour': 3,
    };

    try {
      const guestHousesQuery = query(collection(db, 'guesthouses'), where('officerId', '==', currentUser.uid));
      const guestHousesSnapshot = await getDocs(guestHousesQuery);
      const guestHouseIds = guestHousesSnapshot.docs.map(doc => doc.id);

      if (guestHouseIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'applications'), where('applicationType', '==', 'guestHouseBooking'), where('guestHouseId', 'in', guestHouseIds));
      const querySnapshot = await getDocs(q);
      const applicationsData = await Promise.all(querySnapshot.docs.map(async (appDoc) => {
        const application = { id: appDoc.id, ...appDoc.data() };
        const userDoc = await getDoc(doc(db, 'users', application.userId));
        const user = userDoc.exists() ? userDoc.data() : {};
        const guestHouseDoc = await getDoc(doc(db, 'guesthouses', application.guestHouseId));
        const guestHouseName = guestHouseDoc.exists() ? guestHouseDoc.data().name : t('unknown_guest_house');

        return {
          ...application,
          user,
          guestHouseName,
          startDate: application.startDate.toDate(),
          endDate: application.endDate.toDate(),
          priority: priorityOrder[application.purpose] || 99,
        };
      }));
      setApplications(applicationsData.sort((a, b) => a.priority - b.priority));
    } catch (err) {
      console.error(err);
      setError(t('error_fetching_booking_requests'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleUpdateStatus = async (app, status) => {
    try {
      const appDocRef = doc(db, 'applications', app.id);
      await updateDoc(appDocRef, { status });
      
      const emailParams = {
          guestHouseName: app.guestHouseName,
          startDate: app.startDate.toLocaleDateString(i18n.language),
          endDate: app.endDate.toLocaleDateString(i18n.language),
          status: t(status)
      }

      let message;
      if (status === 'pending_payment') {
        message = t('booking_approved_payment_message', emailParams);
      } else {
        message = t('booking_status_update_message', emailParams);
      }

      await createNotification(app.userId, message);

      fetchApplications();
    } catch (error) {
      console.error(t('error_updating_status'), error);
      setError(t('error_updating_status'));
    }
  };

  const handleDeleteClick = (appId) => {
    setDeleteConfirmation({ open: true, appId });
  };

  const handleDeleteCancel = () => {
      setDeleteConfirmation({ open: false, appId: null });
  };

  const handleDeleteConfirm = async () => {
      if (deleteConfirmation.appId) {
          try {
              await deleteDoc(doc(db, 'applications', deleteConfirmation.appId));
              fetchApplications();
          } catch (error) {
              console.error(t('error_deleting_application'), error);
              setError(t('error_deleting_application'));
          }
          handleDeleteCancel();
      }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBooking(null);
  };

  const filteredApplications = useMemo(() => {
    const now = new Date();
    const confirmedStatuses = ['confirmed', 'approved', 'pending_payment'];
    return {
        pending: applications.filter(app => app.status === 'pending'),
        pending_payment: applications.filter(app => app.status === 'pending_payment'),
        confirmed: applications.filter(app => app.status ==='confirmed' && new Date(app.endDate) >= now),
        rejected: applications.filter(app => app.status === 'rejected'),
        past: applications.filter(app => new Date(app.endDate) < now && confirmedStatuses.includes(app.status)),
    }
}, [applications]);

  const renderTable = (apps, status) => (
    <TableContainer>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>{t('application_id')}</TableCell>
            <TableCell>{t('guest_house_name')}</TableCell>
            <TableCell>{t('applicant_name')}</TableCell>
            <TableCell>{t('purpose_of_visit')}</TableCell>
            <TableCell>{t('check_in_date')}</TableCell>
            <TableCell>{t('check_out_date')}</TableCell>
            <TableCell align="right">{t('actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {apps.map((app) => (
            <TableRow key={app.id}>
              <TableCell>{app.applicationId}</TableCell>
              <TableCell>{app.guestHouseName}</TableCell>
              <TableCell>{app.user.fullName}</TableCell>
              <TableCell>
                <Chip label={t(app.purpose)} size="small" color={app.priority === 1 ? "primary" : app.priority === 2 ? "secondary" : "default"} />
                </TableCell>
              <TableCell>{app.startDate.toLocaleDateString(i18n.language)}</TableCell>
              <TableCell>{app.endDate.toLocaleDateString(i18n.language)}</TableCell>
              <TableCell align="right">
                <Button variant="outlined" onClick={() => handleViewDetails(app)} sx={{ mr: 1 }}>
                  {t('view')}
                </Button>
                {status === 'pending' && (
                  <>
                    <Button variant="contained" color="success" onClick={() => handleUpdateStatus(app, 'pending_payment')} sx={{ mr: 1 }}>
                      {t('approve')}
                    </Button>
                    <Button variant="contained" color="error" onClick={() => handleUpdateStatus(app, 'rejected')}>
                      {t('reject')}
                    </Button>
                  </>
                )}
                <IconButton onClick={() => handleDeleteClick(app.id)} color="error" sx={{ ml: 1}}>
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading && !applications.length) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const tabs = [
    { label: t('pending'), data: filteredApplications.pending, status: 'pending' },
    { label: t('pending_payment'), data: filteredApplications.pending_payment, status: 'pending_payment' },
    { label: t('confirmed'), data: filteredApplications.confirmed, status: 'confirmed' },
    { label: t('rejected'), data: filteredApplications.rejected, status: 'rejected' },
    { label: t('past_bookings'), data: filteredApplications.past, status: 'past' },
  ];

  return (
    <Paper sx={{ p: 2, margin: 'auto', marginTop: 4 }}>
      <Tabs value={tabValue} onChange={handleTabChange} centered>
        {tabs.map((tab, index) => (
          <Tab label={`${tab.label} (${tab.data.length})`} key={index} />
        ))}
      </Tabs>

      {tabs.map((tab, index) => (
        <TabPanel value={tabValue} index={index} key={index}>
          {tab.data.length === 0 ? (
            <Typography sx={{textAlign: 'center', py: 4}}>{t(`no_${tab.status}_booking_requests`)}</Typography>
          ) : (
            renderTable(tab.data, tab.status)
          )}
        </TabPanel>
      ))}

      <BookingDetailsDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        booking={selectedBooking}
      />

      <Dialog open={deleteConfirmation.open} onClose={handleDeleteCancel}>
          <DialogTitle>{t('confirm_delete_title', 'Confirm Deletion')}</DialogTitle>
          <DialogContent>
              <Typography>{t('confirm_delete_application_message', 'Are you sure you want to permanently delete this booking application?')}</Typography>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleDeleteCancel}>{t('cancel', 'Cancel')}</Button>
              <Button onClick={handleDeleteConfirm} color="error">{t('delete', 'Delete')}</Button>
          </DialogActions>
      </Dialog>
    </Paper>
  );
};

BookingRequests.propTypes = {
  officerLocation: PropTypes.string, // This is no longer used but kept for safety
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

export default BookingRequests;
