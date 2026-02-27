import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import OfficerLogin from './pages/OfficerLogin';
import GuestHouseDashboard from './pages/GuestHouseDashboard';
import QuarterOfficerDashboard from './pages/QuarterOfficerDashboard';
import UserDashboard from './pages/UserDashboard';
import GovernmentDashboard from './pages/GovernmentDashboard';
import Dashboard from './pages/Dashboard';
import Help from './pages/Help';
import GuestHouseDetail from './pages/GuestHouseDetail';
import BookGuestHouse from './pages/BookGuestHouse';
import QuarterDetail from './pages/QuarterDetails';
import PublicGuestHouses from './pages/PublicGuestHouses';
import PublicQuarters from './pages/PublicQuarters';
import Availability from './pages/Availability';
import Payment from './pages/Payment';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from './firebase';

const AppRoutes = ({ user }) => {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/officer-login" element={<OfficerLogin />} />
            <Route path="/guest-house-dashboard" element={<GuestHouseDashboard />} />
            <Route path="/guest-houses" element={<PublicGuestHouses />} />
            <Route path="/guesthouse/:id" element={<GuestHouseDetail />} />
            <Route path="/book-guesthouse/:id" element={<BookGuestHouse />} />
            <Route path="/quarter-officer-dashboard" element={<QuarterOfficerDashboard />} />
            <Route path="/quarters" element={<PublicQuarters />} />
            <Route path="/quarter/:quarterId" element={<QuarterDetail />} />
            <Route path="/user-dashboard" element={<UserDashboard user={user} />} />
            <Route path="/government-dashboard" element={<GovernmentDashboard user={user} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/help" element={<Help />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/payment/:applicationId" element={<Payment />} />
        </Routes>
    );
};

AppRoutes.propTypes = {
    user: PropTypes.object,
};

function App() {
    const [user, setUser] = useState(null);
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setUser({ ...currentUser, ...userData });
                    localStorage.setItem('userType', userData.userType);
                    setVerifying(false);
                } else {
                    // This will trigger onAuthStateChanged again with a null user
                    await signOut(auth);
                }
            } else {
                setUser(null);
                localStorage.removeItem('userType');
                setVerifying(false);
            }
        });

        return () => unsubscribe();
    }, []);

    if (verifying) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Router>
            <CssBaseline />
            <Navbar user={user} />
            <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: 'calc(100vh - 64px)' }}>
                <AppRoutes user={user} />
            </Box>
        </Router>
    );
}

export default App;
