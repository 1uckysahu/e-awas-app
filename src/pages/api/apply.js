import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { quarterId, userId, applicationData } = req.body;

      if (!quarterId || !userId || !applicationData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const applicationRef = await addDoc(collection(db, 'applications'), {
        quarterId,
        userId,
        ...applicationData,
        status: 'pending',
        submittedAt: serverTimestamp(),
      });

      res.status(201).json({ message: 'Application submitted successfully', applicationId: applicationRef.id });
    } catch (error) {
      console.error('Error submitting application:', error);
      res.status(500).json({ error: 'Failed to submit application' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
