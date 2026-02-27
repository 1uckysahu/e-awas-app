import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                // **CRITICAL FIX**: Always fetch the user's full profile from Firestore.
                // Previously, the app would sometimes only use the basic authUser object,
                // which does not contain the essential `userType` field.
                const userDocRef = doc(db, 'users', authUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // Combine the auth data with the full user profile from the database.
                    // This ensures `userType` is always present.
                    setUser({ 
                        uid: authUser.uid, 
                        email: authUser.email, 
                        ...userDoc.data() 
                    });
                } else {
                    // If there's no user document, something is wrong. Log them out.
                    setUser(null);
                }
            } else {
                // No authenticated user.
                setUser(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const value = {
        user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};