import { useState } from 'react';
import PropTypes from 'prop-types';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db } from '../firebase';
import { 
    Container, 
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
    Alert 
} from '@mui/material';
import { Person, Work, Email, Lock, Phone, CloudUpload, Visibility, VisibilityOff, LockOutlined } from '@mui/icons-material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const authTheme = createTheme({
  palette: {
    primary: {
      main: '#005ea2', // A professional blue
    },
    background: {
        default: '#eef2f6', // A cool, light blue
    },
    text: {
        primary: '#333',
    }
  },
  typography: {
      fontFamily: 'Inter, sans-serif',
      h5: {
          fontWeight: 700,
          color: '#333',
          marginBottom: '1rem',
      },
      body1: {
          color: '#555',
      }
  }
});

const FormSection = ({ title, children }) => (
    <Box sx={{ mb: 4 }}>
        <Typography variant="h5">{title}</Typography>
        {children}
    </Box>
);

FormSection.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

const Auth = () => {
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
        if (reason === 'clickaway') {
          return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <ThemeProvider theme={authTheme}>
             <Box sx={{ 
                minHeight: '100vh', 
                backgroundColor: 'background.default',
                py: { xs: 4, md: 8 },
            }}>
                <Container component="main" maxWidth="md">
                    <Paper 
                        elevation={0}
                        sx={{ 
                            borderRadius: '12px', 
                            p: { xs: 3, md: 6 }, 
                            border: '1px solid #e0e0e0'
                        }}
                    >
                        <Typography component="h1" variant="h4" align="center" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
                            {tabValue === 0 ? t('login') : t('create_your_account')}
                        </Typography>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 5 }}>
                            <Tabs value={tabValue} onChange={handleTabChange} centered>
                                <Tab icon={<LockOutlined />} label={t('login')} />
                                <Tab icon={<Person />} label={t('register')} />
                            </Tabs>
                        </Box>

                        <TabPanel value={tabValue} index={0}>
                            <Typography>{t('login_form_goes_here')}</Typography>
                        </TabPanel>
                        <TabPanel value={tabValue} index={1}>
                            <RegisterForm togglePasswordVisibility={togglePasswordVisibility} showPassword={showPassword} setSnackbar={setSnackbar}/>
                        </TabPanel>
                    </Paper>
                </Container>
                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                    <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </ThemeProvider>
    );
};

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    value: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
};

const RegisterForm = ({ togglePasswordVisibility, showPassword, setSnackbar }) => {
    const { t } = useTranslation();
    const [registerTabValue, setRegisterTabValue] = useState(0);

    const handleRegisterTabChange = (event, newValue) => {
        setRegisterTabValue(newValue);
    };

    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 5 }}>
                <Tabs value={registerTabValue} onChange={handleRegisterTabChange} centered>
                    <Tab icon={<Person />} label={t('public_user')} />
                    <Tab icon={<Work />} label={t('government_employee')} />
                </Tabs>
            </Box>
            <TabPanel value={registerTabValue} index={0}>
                <PublicUserForm togglePasswordVisibility={togglePasswordVisibility} showPassword={showPassword} setSnackbar={setSnackbar}/>
            </TabPanel>
            <TabPanel value={registerTabValue} index={1}>
                <GovernmentEmployeeForm togglePasswordVisibility={togglePasswordVisibility} showPassword={showPassword} setSnackbar={setSnackbar}/>
            </TabPanel>
        </Box>
    )
}

RegisterForm.propTypes = {
    togglePasswordVisibility: PropTypes.func.isRequired,
    showPassword: PropTypes.bool.isRequired,
    setSnackbar: PropTypes.func.isRequired,
};

const PublicUserForm = ({ togglePasswordVisibility, showPassword, setSnackbar }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '', photo: null });

    const handleChange = (e) => {
        if (e.target.name === 'photo') {
            setFormData({ ...formData, photo: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { fullName, email, password, phone, photo } = formData;

        if (!fullName || !email || !password || !phone || !photo) {
            setSnackbar({ open: true, message: t('all_fields_required'), severity: 'error' });
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);

            const photoUrl = await uploadFile(photo, `users/${userCredential.user.uid}/photo.jpg`);

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
        <Box component="form" onSubmit={handleSubmit} noValidate>
            <FormSection title={t('full_name_step')}>
                <TextField fullWidth name="fullName" label={t('full_name')} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }} />
            </FormSection>

            <FormSection title={t('email_address_step')}>
                <TextField fullWidth name="email" label={t('email_address')} type="email" onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }} />
            </FormSection>

            <FormSection title={t('password_step')}>
                 <TextField fullWidth name="password" label={t('password')} type={showPassword ? 'text' : 'password'} onChange={handleChange} InputProps={{ 
                    startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><IconButton onClick={togglePasswordVisibility}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
                }} />
            </FormSection>

            <FormSection title={t('phone_number_step')}>
                <TextField fullWidth name="phone" label={t('phone_number')} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }} />
            </FormSection>

            <FormSection title={t('passport_photo_step')}>
                <Button variant="outlined" component="label" fullWidth startIcon={<CloudUpload />}>
                    {t('upload_photo')}
                    <input type="file" name="photo" hidden accept="image/*" onChange={handleChange} />
                </Button>
            </FormSection>
            
            <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, p: 1.5, fontWeight: 'bold' }}>{loading ? <CircularProgress size={24} color="inherit" /> : t('register')}</Button>
        </Box>
    );
};

PublicUserForm.propTypes = {
    togglePasswordVisibility: PropTypes.func.isRequired,
    showPassword: PropTypes.bool.isRequired,
    setSnackbar: PropTypes.func.isRequired,
};

const GovernmentEmployeeForm = ({ togglePasswordVisibility, showPassword, setSnackbar }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', phone: '', photo: null, department: '', officialEmail: '', joiningLetter: null });

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'photo' || name === 'joiningLetter') {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { fullName, email, password, phone, photo, department, officialEmail, joiningLetter } = formData;

        if (!fullName || !email || !password || !phone || !photo || !department || !joiningLetter) {
            setSnackbar({ open: true, message: t('all_fields_except_official_email_required'), severity: 'error' });
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(userCredential.user);

            const photoUrl = await uploadFile(photo, `users/${userCredential.user.uid}/photo.jpg`);
            const joiningLetterUrl = await uploadFile(joiningLetter, `users/${userCredential.user.uid}/joining_letter.pdf`);

            await setDoc(doc(db, 'users', userCredential.user.uid), {
                fullName,
                email,
                phone,
                photoUrl,
                department,
                officialEmail,
                joiningLetterUrl,
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
        <Box component="form" onSubmit={handleSubmit} noValidate>
            <FormSection title={t('full_name_step')}>
                <TextField fullWidth name="fullName" label={t('full_name')} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }} />
            </FormSection>

            <FormSection title={t('email_address_step')}>
                <TextField fullWidth name="email" label={t('email_address')} type="email" onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }} />
            </FormSection>

            <FormSection title={t('password_step')}>
                 <TextField fullWidth name="password" label={t('password')} type={showPassword ? 'text' : 'password'} onChange={handleChange} InputProps={{ 
                    startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><IconButton onClick={togglePasswordVisibility}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
                }} />
            </FormSection>

            <FormSection title={t('phone_number_step')}>
                <TextField fullWidth name="phone" label={t('phone_number')} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }} />
            </FormSection>

            <FormSection title={t('department_details_step')}>
                <TextField fullWidth name="department" label={t('department')} onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Work /></InputAdornment> }} sx={{ mb: 2 }}/>
                <TextField fullWidth name="officialEmail" label={t('official_email_optional')} type="email" onChange={handleChange} InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }} />
            </FormSection>

            <FormSection title={t('required_documents_step')}>
                <Button variant="outlined" component="label" fullWidth startIcon={<CloudUpload />} sx={{ mb: 2 }}>
                    {t('upload_passport_photo')}
                    <input type="file" name="photo" hidden accept="image/*" onChange={handleChange}/>
                </Button>
                <Button variant="outlined" component="label" fullWidth startIcon={<CloudUpload />}>
                    {t('upload_joining_letter')}
                    <input type="file" name="joiningLetter" hidden accept=".pdf,.jpg,.png" onChange={handleChange}/>
                </Button>
            </FormSection>

            <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, p: 1.5, fontWeight: 'bold' }}>{loading ? <CircularProgress size={24} color="inherit"/> : t('register')}</Button>
        </Box>
    );
};

GovernmentEmployeeForm.propTypes = {
    togglePasswordVisibility: PropTypes.func.isRequired,
    showPassword: PropTypes.bool.isRequired,
    setSnackbar: PropTypes.func.isRequired,
};

const uploadFile = async (file, path) => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

export default Auth;
