import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
    IconButton, Badge, Popover, Typography, List, ListItem, ListItemText, Divider, 
    CircularProgress, Box 
} from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  const decodeMessage = (text) => {
      if (!text) return '';
      // Converts the safe HTML codes back into readable punctuation
      return text
          .replace(/&#x2F;/g, '/')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&');
  };

  useEffect(() => {
    let unsubscribeFromSnapshots = () => {};

    const unsubscribeFromAuth = onAuthStateChanged(auth, (user) => {
        unsubscribeFromSnapshots(); // Clean up listener for the previous user

        if (user) {
            setLoading(true);
            const q = query(
              collection(db, 'notifications'), 
              where('userId', '==', user.uid),
              orderBy('createdAt', 'desc')
            );

            unsubscribeFromSnapshots = onSnapshot(q, (querySnapshot) => {
              const notificationsToKeep = [];
              const threeDaysAgo = new Date();
              threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

              querySnapshot.forEach((document) => {
                const notif = { id: document.id, ...document.data() };
                // Ensure createdAt field exists to prevent errors
                if (notif.createdAt && typeof notif.createdAt.toDate === 'function') {
                    const createdAtDate = notif.createdAt.toDate();
                    if (notif.isRead && createdAtDate < threeDaysAgo) {
                        // Fire and forget deletion for old, read notifications
                        deleteDoc(doc(db, 'notifications', notif.id)).catch(error => {
                            console.error("Error deleting old notification: ", error);
                        });
                    } else {
                        notificationsToKeep.push(notif);
                    }
                }
              });

              setNotifications(notificationsToKeep);
              const unread = notificationsToKeep.filter(n => !n.isRead).length;
              setUnreadCount(unread);
              setLoading(false);
            }, (error) => {
                console.error("Error fetching notifications: ", error);
                setLoading(false);
            });
        } else {
            // No user is signed in, clear all notification state
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
        }
    });

    // Cleanup both listeners on component unmount
    return () => {
        unsubscribeFromAuth();
        unsubscribeFromSnapshots();
    };
  }, [t]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    notifications.forEach((notif) => {
        if (!notif.isRead) {
            const notifRef = doc(db, 'notifications', notif.id);
            updateDoc(notifRef, { isRead: true }).catch(error => {
                console.error("Error marking notification as read: ", error);
            });
        }
    });
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'notifications-popover' : undefined;

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
         <NotificationsIcon />
       </Badge>
     </IconButton>
     <Popover
       id={id}
       open={open}
       anchorEl={anchorEl}
       onClose={handleClose}
       anchorOrigin={{
         vertical: 'bottom',
         horizontal: 'right',
       }}
       transformOrigin={{
         vertical: 'top',
         horizontal: 'right',
       }}
     >
       <Box sx={{ width: 360, p: 2 }}>
           <Typography variant="h6" gutterBottom>{t('notifications')}</Typography>
           <Divider />
           {loading ? (
               <Box sx={{ display: 'flex', justifyContent: 'center', my: 2}}><CircularProgress /></Box>
           ) : notifications.length === 0 ? (
               <Typography sx={{ p: 2 }}>{t('no_notifications')}</Typography>
           ) : (
               <List dense>
               {notifications.map((notif) => (
                   <ListItem key={notif.id} sx={{ backgroundColor: !notif.isRead ? '#f5f5f5' : 'transparent'}}>
                   <ListItemText 
                       primary={decodeMessage(notif.message)}
                       secondary={notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : ''}
                   />
                   </ListItem>
               ))}
               </List>
           )}
       </Box>
     </Popover>
   </>
 );
};

export default Notifications;
