import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

export const sendEmail = async (to, subject, html) => {
  try {
    await addDoc(collection(db, 'mail'), {
      to: to,
      message: {
        subject: subject,
        html: html,
      },
    });
    console.log('Email queued for delivery');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
