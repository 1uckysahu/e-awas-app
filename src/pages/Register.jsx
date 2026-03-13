import { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { 
    Grid, 
    Paper, 
    Typography, 
    Tabs, 
    Tab, 
    Box, 
    TextField, 
    Button, 
    InputAdornment, 
    IconButton, 
    CircularProgress,
    Snackbar,
    Alert,
    Avatar,
    Stack,
    CssBaseline
} from '@mui/material';
import { Person, Work, Email, Lock, Phone, CloudUpload, Visibility, VisibilityOff, PersonAdd } from '@mui/icons-material';
import { ThemeProvider } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import officerTheme from '../theme/officerTheme';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const CLOUD_NAME = 'dyr6sb0tu';
const UPLOAD_PRESET = 'E-awas2';

// 🔥 NAYE RULES: 1MB limit aur sirf JPG allowed
const MAX_FILE_SIZE = 1024 * 1024; // 1 MB
const SUPPORTED_FORMATS = ['image/jpg', 'image/jpeg'];

const Register = () => {
    const { t } = useTranslation();
    const [tabValue, setTabValue] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
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
                        background: 'linear-gradient(45deg, #8E2DE2 30%, #4A00E0 90%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: { xs: 3, md: 7 },
                        m: 0,
                        height: '100%'
                    }}
                >
                    <Paper
                        sx={{
                            p: 4,
                            width: '100%',
                            maxWidth: 800,
                            borderRadius: 4,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                            <PersonAdd sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold' }}>
                            {t('create_your_account')}
                        </Typography>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, width: '100%' }}>
                            <Tabs value={tabValue} onChange={handleTabChange} centered>
                                <Tab icon={<Person />} label={t('public_user')} />
                                <Tab icon={<Work />} label={t('government_employee')} />
                            </Tabs>
                        </Box>
                        <TabPanel value={tabValue} index={0}>
                            <PublicUserForm togglePasswordVisibility={togglePasswordVisibility} showPassword={showPassword} setSnackbar={setSnackbar}/>
                        </TabPanel>
                        <TabPanel value={tabValue} index={1}>
                            <GovernmentEmployeeForm togglePasswordVisibility={togglePasswordVisibility} showPassword={showPassword} setSnackbar={setSnackbar}/>
                        </TabPanel>
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

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} style={{width: '100%'}} {...other}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

// 🔥 FIX: Strict Yup Validation for Photo (Size & Format)
const getPublicUserSchema = (t) => yup.object().shape({
    fullName: yup.string().required(t('full_name_required')),
    email: yup.string().email(t('invalid_email')).required(t('email_required')),
    password: yup.string().min(6, t('password_min_length')).required(t('password_required')),
    phone: yup.string().required(t('phone_number_required')),
    photo: yup.mixed()
        .test('fileRequired', t('photo_required'), (value) => {
            return value && value.length > 0;
        })
        .test('fileSize', 'Image size must be less than 1 MB', (value) => {
            return value && value[0] && value[0].size <= MAX_FILE_SIZE;
        })
        .test('fileFormat', 'Only JPG/JPEG formats are allowed', (value) => {
            return value && value[0] && SUPPORTED_FORMATS.includes(value[0].type);
        }),
});

const PublicUserForm = ({ togglePasswordVisibility, showPassword, setSnackbar }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
    const { control, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: yupResolver(getPublicUserSchema(t)),
    });
    const photo = watch("photo");

    const onSubmit = async (data) => {
        setLoading(true);
        const { fullName, email, password, phone, photo } = data;

        try {
            const photoUrl = await uploadFile(photo[0]);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                fullName,
                email,
                phone,
                photoUrl,
                userType: 'public',
            });

            setSnackbar({ open: true, message: t('registration_successful_verification_email_sent'), severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ maxWidth: 450, mx: 'auto' }}>
            <Stack spacing={2.5}>
                <Controller
                    name="fullName"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField {...field} fullWidth required label={t('full_name')} variant="outlined" error={!!errors.fullName} helperText={errors.fullName?.message} InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }} />
                    )}
                />
                <Controller
                    name="email"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField {...field} fullWidth required type="email" variant="outlined" label={t('email_address')} error={!!errors.email} helperText={errors.email?.message} InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }} />
                    )}
                />
                <Controller
                    name="password"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField {...field} fullWidth required label={t('password')} variant="outlined" type={showPassword ? 'text' : 'password'} error={!!errors.password} helperText={errors.password?.message} InputProps={{ 
                            startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                            endAdornment: <InputAdornment position="end"><IconButton onClick={togglePasswordVisibility}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
                        }} />
                    )}
                />
                <Controller
                    name="phone"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField {...field} fullWidth required label={t('phone_number')} variant="outlined" error={!!errors.phone} helperText={errors.phone?.message} InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }} />
                    )}
                />
                <Stack spacing={1.5}>
                    <Controller
                        name="photo"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                            <Button variant="outlined" component="label" fullWidth startIcon={<CloudUpload />}>
                                {t('upload_photo')} (JPG, Max 1MB) {/* Updated label for clarity */}
                                <input type="file" hidden accept=".jpg, .jpeg" onChange={(e) => {field.onChange(e.target.files); setPhotoPreview(URL.createObjectURL(e.target.files[0]));}} />
                            </Button>
                        )}
                    />
                    {photo && photo.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {photoPreview && <Avatar src={photoPreview} sx={{ mr: 2 }} />}
                            <Typography variant="body2">{photo[0].name}</Typography>
                        </Box>
                    )}
                     {errors.photo && <Typography color="error" variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>{errors.photo.message}</Typography>}
                </Stack>
                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ fontWeight: 'bold' }}>{loading ? <CircularProgress size={24} color="inherit" /> : t('register')}</Button>
            </Stack>
        </Box>
    );
};

PublicUserForm.propTypes = {
  togglePasswordVisibility: PropTypes.func.isRequired,
  showPassword: PropTypes.bool.isRequired,
  setSnackbar: PropTypes.func.isRequired,
};

// 🔥 FIX: Strict Yup Validation + Optional Official Email (Size & Format)
const getGovernmentEmployeeSchema = (t) => yup.object().shape({
    fullName: yup.string().required(t('full_name_required')),
    email: yup.string().email(t('invalid_email')).required(t('email_required')),
    password: yup.string().min(6, t('password_min_length')).required(t('password_required')),
    phone: yup.string().required(t('phone_number_required')),
    department: yup.string().required(t('department_required')),
    officialEmail: yup.string().email(t('invalid_email')).nullable().notRequired(),
    photo: yup.mixed()
        .test('fileRequired', t('photo_required'), (value) => {
            return value && value.length > 0;
        })
        .test('fileSize', 'Image size must be less than 1 MB', (value) => {
            return value && value[0] && value[0].size <= MAX_FILE_SIZE;
        })
        .test('fileFormat', 'Only JPG/JPEG formats are allowed', (value) => {
            return value && value[0] && SUPPORTED_FORMATS.includes(value[0].type);
        }),
});

const GovernmentEmployeeForm = ({ togglePasswordVisibility, showPassword, setSnackbar }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(null);
     const { control, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: yupResolver(getGovernmentEmployeeSchema(t)),
    });
    const photo = watch("photo");

    const onSubmit = async (data) => {
        setLoading(true);
        const { fullName, email, password, phone, photo, department, officialEmail } = data;

        try {
            const photoUrl = await uploadFile(photo[0]);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                fullName,
                email,
                phone,
                photoUrl,
                department,
                officialEmail: officialEmail || null, 
                userType: 'government',
            });

            setSnackbar({ open: true, message: t('registration_successful_verification_email_sent'), severity: 'success' });
        } catch (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ maxWidth: 450, mx: 'auto' }}>
            <Stack spacing={2.5}>
                 <Controller
                    name="fullName"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField {...field} fullWidth required label={t('full_name')} variant="outlined" error={!!errors.fullName} helperText={errors.fullName?.message} InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }} />
                    )}
                />
                <Controller
                    name="email"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField {...field} fullWidth required type="email" variant="outlined" label={t('email_address')} error={!!errors.email} helperText={errors.email?.message} InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }} />
                    )}
                />
                <Controller
                    name="password"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField {...field} fullWidth required label={t('password')} variant="outlined" type={showPassword ? 'text' : 'password'} error={!!errors.password} helperText={errors.password?.message} InputProps={{ 
                            startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                            endAdornment: <InputAdornment position="end"><IconButton onClick={togglePasswordVisibility}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
                        }} />
                    )}
                />
                <Controller
                    name="phone"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField {...field} fullWidth required label={t('phone_number')} variant="outlined" error={!!errors.phone} helperText={errors.phone?.message} InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }} />
                    )}
                />
                <Controller
                    name="department"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField {...field} fullWidth required label={t('department')} variant="outlined" error={!!errors.department} helperText={errors.department?.message} InputProps={{ startAdornment: <InputAdornment position="start"><Work /></InputAdornment> }} />
                    )}
                />
                <Controller
                    name="officialEmail"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                        <TextField {...field} fullWidth label={t('official_email_optional')} variant="outlined" type="email" error={!!errors.officialEmail} helperText={errors.officialEmail?.message} InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }} />
                    )}
                />
                <Stack spacing={1.5}>
                     <Controller
                        name="photo"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                            <Button variant="outlined" component="label" fullWidth startIcon={<CloudUpload />}>
                                {t('upload_passport_photo')} (JPG, Max 1MB) {/* Updated label */}
                                <input type="file" hidden accept=".jpg, .jpeg" onChange={(e) => {field.onChange(e.target.files); setPhotoPreview(URL.createObjectURL(e.target.files[0]));}}/>
                            </Button>
                        )}
                    />
                    {photo && photo.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {photoPreview && <Avatar src={photoPreview} sx={{ mr: 2 }} />}
                            <Typography variant="body2">{photo[0].name}</Typography>
                        </Box>
                    )}
                    {errors.photo && <Typography color="error" variant="body2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>{errors.photo.message}</Typography>}
                </Stack>
                <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ fontWeight: 'bold' }}>{loading ? <CircularProgress size={24} color="inherit"/> : t('register')}</Button>
            </Stack>
        </Box>
    );
};

GovernmentEmployeeForm.propTypes = {
  togglePasswordVisibility: PropTypes.func.isRequired,
  showPassword: PropTypes.bool.isRequired,
  setSnackbar: PropTypes.func.isRequired,
};

const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    const res = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, formData);
    return res.data.secure_url;
};

export default Register;