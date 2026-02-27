import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import UserDashboard from './UserDashboard';
import GovernmentDashboard from './GovernmentDashboard';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUser({ ...currentUser, ...userDoc.data() });
        } else {
          setUser(null); // No user document found
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render the correct dashboard component based on userType
  if (user.userType === 'government') {
    return <GovernmentDashboard user={user} />;
  } else if (user.userType === 'public') {
    return <UserDashboard user={user} />;
  } else {
    // Fallback for any other user type or if userType is not defined.
    return <Navigate to="/login" replace />;
  }
};

export default Dashboard;
