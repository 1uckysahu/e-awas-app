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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Grid
} from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { Email, Lock, Visibility, VisibilityOff, Person, LockOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTranslation } from 'react-i18next';
import officerTheme from '../theme/officerTheme';
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
    const { t } = useTranslation();
    const [userType, setUserType] = useState('public');
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

        if (!email || !password) {
            setSnackbar({ open: true, message: t('email_password_required'), severity: 'error' });
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

            if (user.emailVerified) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const dbUserType = userDoc.data().userType;
                    if (dbUserType !== userType) {
                        setSnackbar({ open: true, message: t('user_type_mismatch'), severity: 'error' });
                        setLoading(false);
                        return;
                    }

                    localStorage.setItem('userType', dbUserType);
                    setSnackbar({ open: true, message: t('login_successful'), severity: 'success' });
                    if (dbUserType === 'government') {
                        navigate('/government-dashboard');
                    } else if (dbUserType === 'public') {
                        navigate('/user-dashboard');
                    } else {
                        navigate('/'); // Fallback to home
                    }
                } else {
                    setSnackbar({ open: true, message: t('user_data_not_found'), severity: 'error' });
                }
            } else {
                setSnackbar({ open: true, message: t('verify_email_before_login'), severity: 'warning' });
            }
        } catch {
            setSnackbar({ open: true, message: t('invalid_email_or_password'), severity: 'error' });
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
                        <LockOutlined sx={{ fontSize: 32 }}/>
                    </Avatar>
                    <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold' }}>
                        {t('user_login')}
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
                            <FormControl fullWidth variant="outlined">
                                <InputLabel id="user-type-select-label">{t('user_type')}</InputLabel>
                                <Select
                                    labelId="user-type-select-label"
                                    value={userType}
                                    label={t('user_type')}
                                    onChange={(e) => setUserType(e.target.value)}
                                    required
                                >
                                    <MenuItem value="public">{t('public_user')}</MenuItem>
                                    <MenuItem value="government">{t('government_employee')}</MenuItem>
                                </Select>
                            </FormControl>
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
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
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Grid>
        </ThemeProvider>
    );
};

export default Login;