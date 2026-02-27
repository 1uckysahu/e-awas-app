import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Container, Typography, Box, Paper, Tabs, Tab, CircularProgress, Avatar, Stack } from '@mui/material';
import QuartersDisplay from '../components/QuartersDisplay';
import GuestHousesDisplay from '../components/GuestHousesDisplay';
import MyQuarterApplications from '../components/MyQuarterApplications';
import MyBookings from '../components/MyBookings';
import { useTranslation } from 'react-i18next';
import EditProfileDialog from '../components/EditProfileDialog';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
};

const GovernmentDashboard = ({ user }) => {
  const [userData, setUserData] = useState(user);
  const [value, setValue] = useState(0);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setUserData(user);
  }, [user]);

  useEffect(() => {
    const handleOpenEditProfile = () => {
      setEditProfileOpen(true);
    };
    window.addEventListener('openEditProfileDialog', handleOpenEditProfile);
    return () => {
        window.removeEventListener('openEditProfileDialog', handleOpenEditProfile);
    }
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleProfileUpdate = (updatedData) => {
    setUserData(updatedData);
  };

  if (!user) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper 
            elevation={6} 
            sx={{
                p: 4, 
                mb: 4, 
                borderRadius: 3, 
                background: 'linear-gradient(90deg, rgba(33,150,243,1) 0%, rgba(103,58,183,1) 100%)',
                color: 'white'
            }}
        >
            <Stack direction="row" spacing={3} alignItems="center">
                {userData?.photoUrl && (
                    <Avatar 
                        src={userData.photoUrl} 
                        sx={{
                            width: 90, 
                            height: 90, 
                            border: '3px solid white',
                            boxShadow: '0px 4px 12px rgba(0,0,0,0.2)'
                        }}
                    />
                )}
                <Box>
                    <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold' }}>
                        {t('government_employee_dashboard')}
                    </Typography>
                    <Typography variant="h5">{t('welcome_to_dashboard', { name: userData?.fullName })}</Typography>
                </Box>
            </Stack>
        </Paper>
        <Paper sx={{ mt: 2 }}>
          <Tabs value={value} onChange={handleChange} centered indicatorColor="primary" textColor="primary">
            <Tab label={t('quarters')} />
            <Tab label={t('guest_houses')} />
            <Tab label={t('my_applications')} />
            <Tab label={t('my_bookings')} />
          </Tabs>
          <TabPanel value={value} index={0}>
            <QuartersDisplay />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <GuestHousesDisplay />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <MyQuarterApplications user={user} />
          </TabPanel>
          <TabPanel value={value} index={3}>
            <MyBookings user={user}/>
          </TabPanel>
        </Paper>
      </Box>
      <EditProfileDialog
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        user={user}
        userData={userData}
        onProfileUpdate={handleProfileUpdate}
      />
    </Container>
  );
};

GovernmentDashboard.propTypes = {
  user: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    fullName: PropTypes.string,
    photoUrl: PropTypes.string,
    userType: PropTypes.string,
  }),
};

export default GovernmentDashboard;
