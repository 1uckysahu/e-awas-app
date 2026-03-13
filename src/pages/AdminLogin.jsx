import { useState, useRef } from 'react';
import {
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    InputAdornment,
    IconButton,
    CircularProgress,
    Snackbar,
    Alert,
    Avatar,
    CssBaseline,
    Grid,
    Stack,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
// 🔥 THE FIX IS HERE: Added signOut to the import list!
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'; 
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; 
import { useTranslation } from 'react-i18next';
import ReCAPTCHA from 'react-google-recaptcha';
import { ThemeProvider } from '@mui/material/styles';
import officerTheme from '../theme/officerTheme';

const AdminLogin = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
    const [captchaValue, setCaptchaValue] = useState(null);
    const recaptchaRef = useRef();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!captchaValue) {
            setSnackbar({ open: true, message: t('complete_captcha'), severity: 'warning' });
            setLoading(false);
            return;
        }

        try {
            // Real Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Check against your specific Admin UID
            if (user.uid === 'HelxiXRDkWREWG2GTeofSTbTO4p1') {
                // Update Firestore profile
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    isAdmin: true,
                    officerType: 'Admin'
                }, { merge: true });
                
                localStorage.setItem('userType', 'Admin');
                setSnackbar({ open: true, message: t('login_successful'), severity: 'success' });
                navigate('/admin-dashboard');
            } else {
                // 🔥 THE FIX IS HERE: Successfully logs out unauthorized users without crashing!
                await signOut(auth);
                setSnackbar({ open: true, message: t('access_denied_admin'), severity: 'error' });
            }
        } catch (error) {
            setSnackbar({ open: true, message: t('login_failed_error'), severity: 'error' });
        } finally {
            setLoading(false);
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
            }
            setCaptchaValue(null);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <ThemeProvider theme={officerTheme}>
            <CssBaseline />
            <Grid container sx={{ minHeight: '100vh', m: 0, p: 0, width: '100%' }}>
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
                        alt={t('e_awas_logo')}
                        src="https://i.ibb.co/ycCH30Qh/Gemini-Generated-Image-1ewk341ewk341ewk.png"
                    />
                    <Typography variant="h2" fontWeight="bold" gutterBottom>
                        {t('e_awas')}
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {t('official_housing_allotment_system')}
                    </Typography>
                </Grid>
                 <Grid 
                    size={{ xs: 12, md: 6 }}
                    sx={{
                        background: 'linear-gradient(45deg, #8E2DE2 30%, #4A00E0 90%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 3,
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
                        <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold' }}>
                            {t('admin_login_title')}
                        </Typography>
                        <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
                            <Stack spacing={3}>
                                <TextField
                                    required
                                    fullWidth
                                    label={t('email_address')}
                                    name="email"
                                    autoComplete="email"
                                    autoFocus
                                    variant="outlined"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Email /></InputAdornment>
                                    }}
                                />
                                <TextField
                                    required
                                    fullWidth
                                    name="password"
                                    label={t('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    variant="outlined"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={togglePasswordVisibility} edge="end">
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                                    <ReCAPTCHA
                                        sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
                                        onChange={(value) => setCaptchaValue(value)}
                                        ref={recaptchaRef}
                                    />
                                </Box>
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    disabled={loading}
                                    sx={{ fontWeight: 'bold' }}
                                >
                                    {loading ? <CircularProgress size={24} color="inherit" /> : t('sign_in')}
                                </Button>
                            </Stack>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
};

export default AdminLogin;