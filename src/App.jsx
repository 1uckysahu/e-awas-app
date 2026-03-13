import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
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
import ProtectedRoute from './components/ProtectedRoute';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from './firebase';
import ApplicationStatus from './pages/ApplicationStatus';

const AppContent = () => {
    const [user, setUser] = useState(null);
    const [verifying, setVerifying] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Ye tracker hamesha latest aane wale user ko yaad rakhega
        let expectedAuthId = null;

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            // Jaise hi koi change ho, expected ID ko update kar do
            expectedAuthId = currentUser ? currentUser.uid : null;
            
            if (currentUser) {
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    
                    // 🛑 RACE CONDITION FIX: 
                    // Agar data aane me late hua, aur tab tak (AdminLogin) ne user ko 
                    // logout kar diya hai, toh data ko ignore karo aur yahin ruk jao!
                    if (expectedAuthId !== currentUser.uid) {
                        return; 
                    }

                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        const userRole = userData.userType || userData.officerType;

                        // Unverified public/government users ko block karo
                        if ((userRole === 'public' || userRole === 'government') && !currentUser.emailVerified) {
                            await signOut(auth);
                        } else {
                            // Sab perfectly theek hai
                            setUser({ ...currentUser, ...userData });
                            localStorage.setItem('userType', userRole || 'public');
                        }
                    } else {
                        await signOut(auth);
                    }
                } catch (error) {
                    console.error("Error fetching user details:", error);
                }
            } else {
                // User logged out hai
                setUser(null);
                localStorage.removeItem('userType');
            }
            setVerifying(false);
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
        <>
            <Navbar user={user} />
            <Box sx={{ p: 2.5, backgroundColor: 'background.default', minHeight: 'calc(100vh - 64px)' }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route path="/officer-login" element={<OfficerLogin />} />
                    <Route path="/guest-houses" element={<PublicGuestHouses />} />
                    <Route path="/guesthouse/:id" element={<GuestHouseDetail />} />
                    <Route path="/book-guesthouse/:id" element={<BookGuestHouse />} />
                    <Route path="/quarters" element={<PublicQuarters />} />
                    <Route path="/quarter/:quarterId" element={<QuarterDetail />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/availability" element={<Availability />} />
                    <Route path="/payment/:applicationId" element={<Payment />} />
                    <Route path="/status" element={<ApplicationStatus />} />
                    <Route path="/admin-dashboard" element={<ProtectedRoute user={user} allowedRoles={['Admin']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/quarter-officer-dashboard" element={<ProtectedRoute user={user} allowedRoles={['Quarter Officer']}><QuarterOfficerDashboard /></ProtectedRoute>} />
                    <Route path="/guest-house-dashboard" element={<ProtectedRoute user={user} allowedRoles={['Guest House Officer']}><GuestHouseDashboard /></ProtectedRoute>} />
                    <Route path="/user-dashboard" element={<ProtectedRoute user={user} allowedRoles={['public', 'government']}><UserDashboard user={user} /></ProtectedRoute>} />
                    <Route path="/government-dashboard" element={<ProtectedRoute user={user} allowedRoles={['government']}><GovernmentDashboard user={user} /></ProtectedRoute>} />
                </Routes>
            </Box>
        </>
    );
};

function App() {
    return (
        <Router>
            <CssBaseline />
            <AppContent />
        </Router>
    );
}

export default App;
