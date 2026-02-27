import { useEffect, useReducer } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const initialState = {
  data: null,
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'IDLE':
      return { data: null, loading: false, error: null };
    case 'LOADING':
      return { data: null, loading: true, error: null };
    case 'SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'ERROR':
      return { data: null, loading: false, error: action.payload };
    default:
      return state;
  }
}

const useDocument = (collectionName, documentId) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!documentId) {
      dispatch({ type: 'IDLE' });
      return;
    }

    dispatch({ type: 'LOADING' });

    const docRef = doc(db, collectionName, documentId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          dispatch({ type: 'SUCCESS', payload: { id: snapshot.id, ...snapshot.data() } });
        } else {
          // Document does not exist, which is a valid success state with null data
          dispatch({ type: 'SUCCESS', payload: null });
        }
      },
      (err) => {
        dispatch({ type: 'ERROR', payload: err });
      }
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts
    // or when the dependencies (collectionName, documentId) change.
    return () => unsubscribe();
  }, [collectionName, documentId]);

  return state;
};

export default useDocument;
