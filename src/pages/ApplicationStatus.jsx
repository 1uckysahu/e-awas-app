import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
    Container, TextField, Button, CircularProgress, Typography, Box, Alert, Paper,
    Grid, Chip
} from '@mui/material';
import { Assignment, Person, Home, Event } from '@mui/icons-material';

const ApplicationStatus = () => {
    const [applicationId, setApplicationId] = useState('');
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!applicationId) {
            setError('Please enter an Application ID.');
            return;
        }
        setLoading(true);
        setError(null);
        setApplication(null);
        try {
            const appDocRef = doc(db, 'applications', applicationId);
            const appDocSnap = await getDoc(appDocRef);
            if (appDocSnap.exists()) {
                const appData = appDocSnap.data();
                let applicantName = 'N/A';
                if (appData.userId) {
                    const userDocRef = doc(db, 'users', appData.userId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        applicantName = userDocSnap.data().fullName || 'N/A';
                    }
                }
                setApplication({ id: appDocSnap.id, ...appData, applicantName });
            } else {
                setError('Application not found.');
            }
        } catch (err) {
            setError('An error occurred while fetching the application.');
            console.error(err);
        }
        setLoading(false);
    };

    const getStatusChip = () => {
        if (!application) return null;
        let color = 'default';
        if (application.status === 'confirmed') color = 'success';
        if (application.status === 'pending' || application.status === 'pending_payment') color = 'warning';
        if (application.status === 'rejected') color = 'error';
        return <Chip label={application.status.replace('_', ' ').toUpperCase()} color={color} sx={{ fontWeight: 'bold' }} />;
    };

    const renderApplicationDates = () => {
        if (!application) return null;
        const { startDate, endDate, createdAt, applicationType } = application;
        let dateString = 'N/A';
        if (applicationType === 'guestHouseBooking' && startDate && endDate) {
            dateString = `${new Date(startDate.seconds * 1000).toLocaleDateString()} - ${new Date(endDate.seconds * 1000).toLocaleDateString()}`;
        }
        if (applicationType === 'quarterApplication' && createdAt) {
            dateString = new Date(createdAt.seconds * 1000).toLocaleDateString();
        }
        return (
             <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Event sx={{ color: 'primary.main' }}/>
                <Typography><strong>{application.applicationType === 'guestHouseBooking' ? 'Booking Dates' : 'Applied On'}:</strong> {dateString}</Typography>
            </Grid>
        );
    };

    return (
        <Box sx={{ background: 'linear-gradient(to top, #f3e5f5, #e1bee7)', minHeight: 'calc(100vh - 64px)', p: 4 }}>
            <Container component={Paper} maxWidth="md" sx={{ borderRadius: 4, p: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                    Check Application Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 3, gap: 2 }}>
                    <TextField
                        fullWidth
                        label="Enter Your Application ID"
                        value={applicationId}
                        onChange={(e) => setApplicationId(e.target.value)}
                        variant="outlined"
                        sx={{ maxWidth: 500 }}
                    />
                    <Button variant="contained" color="primary" onClick={handleSearch} disabled={loading} sx={{ py: 1.5, px: 4 }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Search'}
                    </Button>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {application && (
                    <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mt: 4 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>Application Details</Typography>
                               {getStatusChip()}
                            </Grid>
                            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Assignment sx={{ color: 'primary.main' }}/>
                                <Typography><strong>Application ID:</strong> {application.id}</Typography>
                            </Grid>
                             <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Person sx={{ color: 'primary.main' }}/>
                                <Typography><strong>Applicant Name:</strong> {application.applicantName}</Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Home sx={{ color: 'primary.main' }}/>
                                <Typography><strong>Guest House/Quarter:</strong> {application.guestHouseName || application.quarterName || 'N/A'}</Typography>
                            </Grid>
                            {renderApplicationDates()}
                        </Grid>
                    </Paper>
                )}
            </Container>
        </Box>
    );
};

export default ApplicationStatus;
