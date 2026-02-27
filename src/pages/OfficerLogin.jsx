import { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Avatar,
  ThemeProvider,
  InputAdornment,
  IconButton,
  Snackbar,
  CircularProgress,
  Stack,
  CssBaseline,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { LockOutlined, Email, Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';
import officerTheme from '../theme/officerTheme';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useTranslation } from 'react-i18next';
import ReCAPTCHA from "react-google-recaptcha";

const OfficerLogin = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [officerType, setOfficerType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [captchaValue, setCaptchaValue] = useState(null);
  const recaptchaRef = useRef();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password || !officerType) {
      setSnackbar({ open: true, message: t('all_fields_are_required'), severity: 'error' });
      setLoading(false);
      return;
    }

    if (!captchaValue) {
        setSnackbar({ open: true, message: t('complete_captcha'), severity: 'error' });
        setLoading(false);
        return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await signOut(auth);
        setSnackbar({ open: true, message: t('no_officer_record'), severity: 'error' });
        return;
      }

      const userData = userDoc.data();

      if (userData.officerType !== officerType) {
        await signOut(auth);
        setSnackbar({
          open: true,
          message: t('account_not_registered_as_officer', { officerType: t(officerType.replace(' ', '_')).toLowerCase() }),
          severity: 'error'
        });
        return;
      }

      localStorage.setItem('userType', officerType);
      setSnackbar({ open: true, message: t('login_successful'), severity: 'success' });

      navigate(
        officerType === 'Guest House Officer'
          ? '/guest-house-dashboard'
          : '/quarter-officer-dashboard'
      );

    } catch (error) {
      console.error('Login attempt failed:', error);

      let message = t('unexpected_error');

      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        message = t('invalid_email_or_password');
      } else if (error.code === 'permission-denied') {
        message = t('firestore_permission_denied');
      }

      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setCaptchaValue(null);
    }
  };

  return (
    <ThemeProvider theme={officerTheme}>
      <CssBaseline />
        <Grid container sx={{ minHeight: '100vh' }}>
            <Grid
                size={{ xs: 12, md: 6 }}
                sx={{
                    position: 'relative',
                    display: { xs: 'none', md: 'flex' },
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 4,
                    color: 'white',
                    textAlign: 'center',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url(https://i.ibb.co/xqTcfTGp/Gemini-Generated-Image-goi6a7goi6a7goi6.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(4px)',
                        zIndex: 1,
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 2,
                    },
                    '& > *': {
                        position: 'relative',
                        zIndex: 3,
                    }
                }}
            >
                <Box
                    component="img"
                    sx={{ height: 120, mb: 3 }}
                    alt="E-Awas Logo"
                    src="https://i.ibb.co/ycCH30Qh/Gemini-Generated-Image-1ewk341ewk341ewk.png"
                />
                <Typography variant="h2" fontWeight="bold" gutterBottom>
                    E-AWAS
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    Official Housing Allotment System
                </Typography>
            </Grid>
            <Grid 
                size={{ xs: 12, md: 6 }}
                sx={{
                    bgcolor: '#f4f6f8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3
                }}
            >
                <Paper 
                    sx={{
                        p: 4,
                        width: '100%',
                        maxWidth: 480,
                        borderRadius: 4,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2
                    }}
                >
                    <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                        <AdminPanelSettings sx={{ fontSize: 32 }} />
                    </Avatar>

                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{t('officer_login_title')}</Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 2}}>
                        {t('officer_login_subtitle')}
                    </Typography>

                    <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
                        <Stack spacing={3}>
                            <TextField
                                label={t('email_address')}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Email /></InputAdornment>,
                                }}
                            />
                            <TextField
                                label={t('password')}
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><LockOutlined /></InputAdornment>,
                                    endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                    ),
                                }}
                            />

                            <FormControl fullWidth required variant="outlined">
                                <InputLabel>{t('officer_type')}</InputLabel>
                                <Select value={officerType} onChange={(e) => setOfficerType(e.target.value)} label={t('officer_type')}>
                                    <MenuItem value="Guest House Officer">{t('guest_house_officer')}</MenuItem>
                                    <MenuItem value="Quarter Officer">{t('quarter_officer')}</MenuItem>
                                </Select>
                            </FormControl>
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                                <ReCAPTCHA
                                    sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                                    onChange={(value) => setCaptchaValue(value)}
                                    ref={recaptchaRef}
                                />
                            </Box>
                            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ fontWeight: 'bold' }}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : t('sign_in')}
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
            </Grid>
        </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={8000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default OfficerLogin;
