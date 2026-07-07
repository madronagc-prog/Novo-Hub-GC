import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { Source } from '../data/sources';

export function useSources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'fontesDeInformacao'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sourcesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Source[];
      
      setSources(sourcesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fontesDeInformacao');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addSource = async (newSource: Omit<Source, 'id'>) => {
    try {
      await addDoc(collection(db, 'fontesDeInformacao'), {
        ...newSource,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'fontesDeInformacao');
    }
  };

  return { sources, addSource, loading };
}
