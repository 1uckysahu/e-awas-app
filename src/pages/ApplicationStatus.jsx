import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
    Container, TextField, Button, CircularProgress, Typography, Box, Alert, Paper,
    Chip, Divider, TableContainer, Table, TableBody, TableRow, TableCell,
    RadioGroup, FormControlLabel, Radio, FormControl
} from '@mui/material';
import { Assignment, Person, Home, Event } from '@mui/icons-material';

const ApplicationStatus = () => {
    const [applicationId, setApplicationId] = useState('');
    const [application, setApplication] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [applicationType, setApplicationType] = useState('guestHouseBooking');

    const handleSearch = async () => {
        if (!applicationId) {
            setError('Please enter an Application ID.');
            return;
        }
        setLoading(true);
        setError(null);
        setApplication(null);

        try {
            let appData = null;
            let docId = applicationId;

            if (applicationType === 'guestHouseBooking') {
                const appDocRef = doc(db, 'applications', applicationId);
                const appDocSnap = await getDoc(appDocRef);
                if (appDocSnap.exists() && appDocSnap.data().applicationType === 'guestHouseBooking') {
                    appData = { ...appDocSnap.data(), status: appDocSnap.data().status };
                }
            } else if (applicationType === 'quarterApplication') {
                // Step 1: Always find the base application in the 'applications' collection first.
                const mainAppRef = doc(db, 'applications', applicationId);
                const mainAppSnap = await getDoc(mainAppRef);

                if (mainAppSnap.exists()) {
                    const baseData = mainAppSnap.data();
                    let finalData = { ...baseData };
                    let finalStatus = baseData.status;

                    // Step 2: Check for a vacated record to merge and get the vacatedOn date.
                    const vacatedAppRef = doc(db, 'vacatedApplications', applicationId);
                    const vacatedAppSnap = await getDoc(vacatedAppRef);

                    if (vacatedAppSnap.exists()) {
                        const vacatedData = vacatedAppSnap.data();
                        // Merge to ensure we get the vacatedOn date and any other relevant fields.
                        finalData = { ...baseData, ...vacatedData }; 
                        finalStatus = 'vacated'; // Set the definitive status.
                    }
                    appData = { ...finalData, status: finalStatus };
                }
            }

            if (appData) {
                let applicantName = 'N/A';
                if (appData.userId) {
                    const userDocRef = doc(db, 'users', appData.userId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        applicantName = userDocSnap.data().fullName || 'N/A';
                    }
                }
                setApplication({ id: docId, ...appData, applicantName });
            } else {
                setError('Application not found. Please check the ID and selected type.');
            }
        } catch (err) {
            setError('An error occurred while fetching the application.');
            console.error(err);
        }
        setLoading(false);
    };
    
    const getStatusChip = () => {
        if (!application || !application.status) return null;
        let color = 'default';
        let label = application.status.replace('_', ' ').toUpperCase();

        switch (application.status) {
            case 'confirmed':
                color = 'success';
                break;
            case 'pending':
            case 'pending_payment':
                color = 'warning';
                break;
            case 'rejected':
                color = 'error';
                break;
            case 'vacated':
                color = 'info';
                label = 'VACATED';
                break;
            default:
                break;
        }

        return <Chip label={label} color={color} sx={{ fontWeight: 'bold' }} />;
    };

    const renderDateRow = () => {
        if (!application) return null;

        let label = 'Applied On';
        let dateString = application.createdAt ? new Date(application.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';

        if (application.status === 'vacated') {
            label = 'Vacated On';
            dateString = application.vacatedOn ? new Date(application.vacatedOn.seconds * 1000).toLocaleDateString() : 'N/A';
        } else if (application.applicationType === 'guestHouseBooking') {
            label = 'Booking Dates';
            if (application.startDate && application.endDate) {
                dateString = `${new Date(application.startDate.seconds * 1000).toLocaleDateString()} - ${new Date(application.endDate.seconds * 1000).toLocaleDateString()}`;
            } else {
                dateString = 'N/A';
            }
        }

        return (
            <TableRow>
                <TableCell sx={{ width: '50%', p: { xs: 1, sm: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Event sx={{ color: 'primary.main' }}/>
                        <Typography><strong>{label}:</strong></Typography>
                    </Box>
                </TableCell>
                <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                    <Typography>{dateString}</Typography>
                </TableCell>
            </TableRow>
        );
    };

    return (
        <Box sx={{ background: 'linear-gradient(to top, #f3e5f5, #e1bee7)', minHeight: 'calc(100vh - 64px)', p: 4 }}>
            <Container component={Paper} maxWidth="md" sx={{ borderRadius: 4, p: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                    Check Application Status
                </Typography>
                <FormControl component="fieldset" sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <RadioGroup row value={applicationType} onChange={(e) => setApplicationType(e.target.value)}>
                        <FormControlLabel value="guestHouseBooking" control={<Radio />} label="Guest House Booking" />
                        <FormControlLabel value="quarterApplication" control={<Radio />} label="Quarter Application" />
                    </RadioGroup>
                </FormControl>
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
                    <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, mt: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>Application Details</Typography>
                            {getStatusChip()}
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <TableContainer>
                            <Table sx={{ '& td': { border: 0, py: 1 } }}>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ width: '50%', p: { xs: 1, sm: 2 } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Assignment sx={{ color: 'primary.main' }} />
                                                <Typography><strong>Application ID:</strong></Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                                            <Typography>{application.applicationNumber || application.id}</Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ width: '50%', p: { xs: 1, sm: 2 } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Person sx={{ color: 'primary.main' }}/>
                                                <Typography><strong>Applicant Name:</strong></Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                                            <Typography>{application.applicantName}</Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ width: '50%', p: { xs: 1, sm: 2 } }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Home sx={{ color: 'primary.main' }}/>
                                                <Typography><strong>{application.applicationType === 'guestHouseBooking' ? 'Guest House' : 'Quarter'}:</strong></Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                                            <Typography>{application.guestHouseName || application.quarterName || 'N/A'}</Typography>
                                        </TableCell>
                                    </TableRow>
                                    {renderDateRow()}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </Container>
        </Box>
    );
};

export default ApplicationStatus;
