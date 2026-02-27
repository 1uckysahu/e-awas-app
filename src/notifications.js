import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Creates a notification in Firestore.
 * @param {string} userId - The ID of the user to notify.
 * @param {string} message - The notification message.
 */
export const createNotification = async (userId, message) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      message,
      read: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Listens for new notifications for a user.
 * @param {string} userId - The ID of the user.
 * @param {function} callback - The callback function to call with the notifications.
 * @returns {function} - The unsubscribe function.
 */
export const onNewNotification = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifications);
  });
};

/**
 * Marks a notification as read.
 * @param {string} notificationId - The ID of the notification to mark as read.
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};
