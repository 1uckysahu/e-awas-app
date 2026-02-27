import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useTranslation } from 'react-i18next';
import Marquee from './Marquee';
import Notifications from './Notifications';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = ({ user }) => {
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (user) {
      if (user.email === 'admin@eawas.com') {
        setUserRole('admin');
      } else {
        const role = user.userType || user.officerType || 'public';
        setUserRole(role);
      }
    } else {
      setUserRole(null);
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('userType');
    navigate('/login');
  };

  const openEditProfileDialog = () => {
    window.dispatchEvent(new CustomEvent('openEditProfileDialog'));
  };

  const getDashboardPath = () => {
    if (!userRole) return '/';
    switch (userRole) {
      case 'public':
        return '/user-dashboard';
      case 'government':
        return '/government-dashboard';
      case 'admin':
        return '/admin-dashboard';
      case 'Quarter Officer':
        return '/quarter-officer-dashboard';
      case 'Guest House Officer':
        return '/guest-house-officer-dashboard';
      default:
        return '/';
    }
  };

  const renderNavLinks = () => {
    const buttonStyle = {
      fontSize: '1.1rem',
      fontWeight: 'bold'
    };
    
    const isAuthPage = ['/login', '/register', '/admin-login', '/officer-login'].includes(location.pathname);

    if (isAuthPage && !user) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          <Button color="inherit" component={Link} to="/" sx={buttonStyle}>{t('home')}</Button>
          <Button color="inherit" component={Link} to="/register" sx={buttonStyle}>{t('registration')}</Button>
          <Button color="inherit" component={Link} to="/login" sx={buttonStyle}>{t('login')}</Button>
          <Button color="inherit" component={Link} to="/admin-login" sx={buttonStyle}>{t('administration')}</Button>
          <Button color="inherit" component={Link} to="/officer-login" sx={buttonStyle}>{t('officer_login')}</Button>
          <Button color="inherit" component={Link} to="/help" sx={buttonStyle}>{t('help')}</Button>
          <LanguageSwitcher />
        </Box>
      );
    }
    
    const isDashboardPage = location.pathname.includes('dashboard');

    if (user) {
      if (userRole === 'admin' || userRole === 'Quarter Officer' || userRole === 'Guest House Officer') {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <Button color="inherit" onClick={handleLogout} sx={buttonStyle}>{t('logout')}</Button>
          </Box>
        );
      }

      if (userRole === 'public' || userRole === 'government') {
        if (isDashboardPage) {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                    <Button color="inherit" component={Link} to="/" sx={buttonStyle}>{t('home')}</Button>
                    <Button color="inherit" onClick={openEditProfileDialog} sx={buttonStyle}>{t('edit_profile')}</Button>
                    <Notifications key={i18n.language} />
                    <Button color="inherit" onClick={handleLogout} sx={buttonStyle}>{t('logout')}</Button>
                </Box>
            );
        } else {
            return (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                    <Button color="inherit" component={Link} to={getDashboardPath()} sx={buttonStyle}>{t('dashboard')}</Button>
                    <Button color="inherit" onClick={handleLogout} sx={buttonStyle}>{t('logout')}</Button>
                </Box>
            );
        }
      }
      
       return (
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <Button color="inherit" onClick={handleLogout} sx={buttonStyle}>{t('logout')}</Button>
        </Box>
      );
    }

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
        <Button color="inherit" component={Link} to="/" sx={buttonStyle}>{t('home')}</Button>
        <Button color="inherit" component={Link} to="/register" sx={buttonStyle}>{t('registration')}</Button>
        <Button color="inherit" component={Link} to="/login" sx={buttonStyle}>{t('login')}</Button>
        <Button color="inherit" component={Link} to="/admin-login" sx={buttonStyle}>{t('administration')}</Button>
        <Button color="inherit" component={Link} to="/officer-login" sx={buttonStyle}>{t('officer_login')}</Button>
        <Button color="inherit" component={Link} to="/help" sx={buttonStyle}>{t('help')}</Button>
        <LanguageSwitcher />
      </Box>
    );
  };

  return (
    <>
      {!user && <Marquee />}
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #8E2DE2 30%, #4A00E0 90%)' }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              cursor: 'default',
              fontSize: '1.7rem',
              fontWeight: 'bold'
            }}
          >
            <img src="https://i.ibb.co/ycCH30Qh/Gemini-Generated-Image-1ewk341ewk341ewk.png" alt="E-Awas Logo" style={{ marginRight: '15px', height: '50px' }} />
            {t('e-awas')}
          </Typography>
          {renderNavLinks()}
        </Toolbar>
      </AppBar>
    </>
  );
};

Navbar.propTypes = {
    user: PropTypes.object,
};

export default Navbar;
