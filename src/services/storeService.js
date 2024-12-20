import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import app from '../firebaseConfig';
import { getFirestore } from 'firebase/firestore';

const db = getFirestore(app);
const STORES_COLLECTION = 'stores';

const storeService = {
  async createStore(franchiseId, storeName, storeSlug) {
    try {
      const storeRef = doc(db, STORES_COLLECTION, storeSlug);
      await setDoc(storeRef, {
        franchiseId,
        storeName,
        storeSlug,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return storeSlug;
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  },

  async getStoreBySlug(slug) {
    try {
      const storeRef = doc(db, STORES_COLLECTION, slug);
      const storeDoc = await getDoc(storeRef);
      return storeDoc.exists() ? storeDoc.data() : null;
    } catch (error) {
      console.error('Error getting store:', error);
      throw error;
    }
  },

  async getStoreByFranchiseId(franchiseId) {
    try {
      const storesRef = collection(db, STORES_COLLECTION);
      const q = query(storesRef, where('franchiseId', '==', franchiseId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty ? null : querySnapshot.docs[0].data();
    } catch (error) {
      console.error('Error getting store by franchise ID:', error);
      throw error;
    }
  }
};

export default storeService;
