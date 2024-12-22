import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { generateStoreSlug } from '../utils/slugUtils';
import storeService from './storeService';

// Constants for collections and documents
const USERS_COLLECTION = 'users';
const COUNTERS_COLLECTION = 'counters';
const CUSTOMER_COUNTER_DOC = 'customerCounter';
const FRANCHISE_COUNTER_DOC = 'franchiseCounter';

const userSchemas = {
  customer: {
    required: {
      id: 'string',
      userId: 'string',
      category: 'string',
      email: 'string',
      firstName: 'string',
      lastName: 'string',
      password: 'string',
      permissions: 'boolean',
      schemaVersion: 'number',
      isActive: 'boolean',
      isOnline: 'boolean',
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    },
    optional: {
      address: 'string',
      city: 'string',
      state: 'string',
      country: 'string',
      countryCode: 'string',
      zipCode: 'string',
      phone: 'string',
      primaryPhone: 'string',
      secondaryPhone: 'string',
      cardNumber: 'string',
      cvv: 'string',
      expiryDate: 'string',
      lastActiveAt: 'timestamp',
      lastLoginAt: 'timestamp'
    }
  },
  franchiser: {
    required: {
      id: 'string',
      userId: 'string',
      category: 'string',
      email: 'string',
      firstName: 'string',
      lastName: 'string',
      password: 'string',
      username: 'string',
      permissions: 'boolean',
      schemaVersion: 'number',
      isActive: 'boolean',
      isOnline: 'boolean',
      createdAt: 'timestamp',
      updatedAt: 'timestamp',
      storeName: '',
      storeSlug: '',
      storeStatus: 'building'
    },
    optional: {
      address: 'string',
      city: 'string',
      state: 'string',
      country: 'string',
      countryCode: 'string',
      zipCode: 'string',
      phone: 'string',
      primaryPhone: 'string',
      secondaryPhone: 'string',
      lastActiveAt: 'timestamp',
      lastLoginAt: 'timestamp',
      storeDescription: '',
      storeTheme: 'default'
    }
  },
  test: {
    required: {
      id: 'string',
      userId: 'string',
      category: 'string',
      email: 'string',
      firstName: 'string',
      lastName: 'string',
      password: 'string',
      permissions: 'boolean',
      schemaVersion: 'number',
      isActive: 'boolean',
      isOnline: 'boolean',
      createdAt: 'timestamp',
      updatedAt: 'timestamp'
    },
    optional: {
      lastActiveAt: 'timestamp',
      lastLoginAt: 'timestamp'
    }
  }
};

export const userService = {
  // Create user
  async createUser(userData) {
    try {
      // Validate required fields
      const requiredFields = ['email', 'firstName', 'lastName', 'category', 'id'];
      for (const field of requiredFields) {
        if (!userData[field]) {
          throw new Error(`${field} is required`);
        }
      }

      // Check if user with email already exists
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', userData.email));
      const emailQuerySnapshot = await getDocs(emailQuery);
      
      if (!emailQuerySnapshot.empty) {
        throw new Error('Email already exists');
      }

      // Create user document with specific ID
      const userRef = doc(db, 'users', userData.id);
      
      // Check if user already exists
      const existingUser = await getDoc(userRef);
      if (existingUser.exists()) {
        // If ID exists, try to generate a new one
        userData.id = await this.generateNextUserId(userData.category === 'customer' ? 'cu' : 'fr');
      }

      // Create user with all required fields
      await setDoc(doc(db, 'users', userData.id), {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isOnline: false,
        lastActiveAt: null,
        lastLoginAt: null,
        schemaVersion: 1,
        // Ensure all fields are properly stored
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        country: userData.country || '',
        countryCode: userData.countryCode || '',
        zipCode: userData.zipCode || '',
        phone: userData.phone || '',
        primaryPhone: userData.primaryPhone || '',
        secondaryPhone: userData.secondaryPhone || '',
        cardNumber: userData.cardNumber || '',
        cvv: userData.cvv || '',
        expiryDate: userData.expiryDate || ''
      });

      return { id: userData.id };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },

  // Read user
  async getUserById(userId) {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    return { id: userDoc.id, ...userDoc.data() };
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentData = userDoc.data();

      // If category is changing, handle in the component level
      if (userData.category && userData.category !== currentData.category) {
        return true; // Let the component handle category changes
      }

      // Handle regular updates
      const updateData = {
        ...currentData,
        ...userData,
        updatedAt: new Date()
      };

      // Remove any undefined or empty values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      await updateDoc(userRef, updateData);
      return true;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  },

  // Delete user
  async deleteUser(userId) {
    await deleteDoc(doc(db, 'users', userId));
  },

  // Generate next user ID
  async generateNextUserId(category = 'cu') {
    const counterDoc = category === 'cu' ? CUSTOMER_COUNTER_DOC : FRANCHISE_COUNTER_DOC;
    const counterRef = doc(db, COUNTERS_COLLECTION, counterDoc);

    try {
      return await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        let nextNumber;
        if (!counterDoc.exists()) {
          // Initialize counter if it doesn't exist
          nextNumber = 1;
        } else {
          nextNumber = counterDoc.data().currentCount + 1;
        }

        // Update the counter
        transaction.set(counterRef, { currentCount: nextNumber });

        // Format the user ID with leading zeros (6 digits)
        return `${category}${String(nextNumber).padStart(6, '0')}`;
      });
    } catch (error) {
      console.error('Error generating user ID:', error);
      throw new Error(`Failed to generate user ID: ${error.message}`);
    }
  },

  // Validate user role
  async validateUserRole(userId, requiredRole) {
    const user = await this.getUserById(userId);
    return user.category === requiredRole;
  },

  async getUserByEmail(email) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };
  },

  async getUserByUsername(username) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };
  },

  // Get user by store name
  async getUserByStoreName(storeName) {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where('storeName', '==', storeName));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0];
      }
      return null;
    } catch (error) {
      console.error('Error getting user by store name:', error);
      throw error;
    }
  },

  // Detect user category from userId
  detectCategory(userId) {
    if (userId.startsWith('cu')) return 'customer';
    if (userId.startsWith('fr')) return 'franchise';
    if (userId.startsWith('ad')) return 'admin';
    throw new Error('Invalid user ID format');
  },

  async upgradeToFranchise(userId) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentCategory = this.detectCategory(userId);

      // Only allow upgrading customers
      if (currentCategory !== 'customer') {
        throw new Error('Only customers can be upgraded to franchise');
      }

      // Check if this customer was previously a franchise
      let newFranchiseId;
      if (userData.previousFranchiseId && userData.previousFranchiseId.startsWith('fr')) {
        newFranchiseId = userData.previousFranchiseId;
      } else {
        newFranchiseId = await this.generateNextUserId('fr');
      }

      // Create new franchise user with old data
      const newUserRef = doc(db, USERS_COLLECTION, newFranchiseId);
      const updatedUserData = {
        ...userData,
        id: newFranchiseId,
        userId: newFranchiseId,
        category: 'franchise',
        previousId: userId,
        previousFranchiseId: null,
        storeName: '',
        storeSlug: '',
        storeStatus: 'building',
        updatedAt: serverTimestamp()
      };

      await runTransaction(db, async (transaction) => {
        const oldUserDoc = await transaction.get(userRef);
        if (!oldUserDoc.exists()) {
          throw new Error('Original user no longer exists');
        }
        transaction.set(newUserRef, updatedUserData);
        transaction.delete(userRef);
      });

      return { userId: newFranchiseId, success: true };
    } catch (error) {
      console.error('Error upgrading user to franchise:', error);
      throw new Error(`Failed to upgrade user to franchise: ${error.message}`);
    }
  },

  // Revert franchise back to customer
  async revertToCustomer(userId) {
    try {
      const userRef = doc(db, USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentCategory = this.detectCategory(userId);

      // Only allow reverting franchises
      if (currentCategory !== 'franchise') {
        throw new Error('Only franchises can be reverted to customer');
      }

      // Check if we have the original customer ID
      if (!userData.previousId || !userData.previousId.startsWith('cu')) {
        throw new Error('Original customer ID not found or invalid');
      }

      const originalCustomerId = userData.previousId;

      // Create new customer user with old data
      const newUserRef = doc(db, USERS_COLLECTION, originalCustomerId);
      const updatedUserData = {
        ...userData,
        id: originalCustomerId,
        userId: originalCustomerId,
        category: 'customer',
        previousFranchiseId: userId,
        previousId: null,
        updatedAt: serverTimestamp()
      };

      await runTransaction(db, async (transaction) => {
        const oldUserDoc = await transaction.get(userRef);
        if (!oldUserDoc.exists()) {
          throw new Error('Original user no longer exists');
        }
        transaction.set(newUserRef, updatedUserData);
        transaction.delete(userRef);
      });

      return { userId: originalCustomerId, success: true };
    } catch (error) {
      console.error('Error reverting user to customer:', error);
      throw new Error(`Failed to revert user to customer: ${error.message}`);
    }
  },

  async updateUserAttributes(userId, userData) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const currentData = userDoc.data();

      // Prepare the complete update data
      const updateData = {
        ...currentData,
        ...userData,
        id: userData.id || currentData.id,
        userId: userData.id || currentData.id, // Ensure userId matches id
        schemaVersion: 1,
        updatedAt: new Date(),
        isActive: userData.isActive ?? currentData.isActive ?? true,
        isOnline: userData.isOnline ?? currentData.isOnline ?? false,
        lastActiveAt: userData.lastActiveAt ?? currentData.lastActiveAt ?? null,
        lastLoginAt: userData.lastLoginAt ?? currentData.lastLoginAt ?? null,
        permissions: userData.permissions ?? currentData.permissions ?? false,
        phone: userData.phone ?? currentData.phone ?? '',
        createdAt: currentData.createdAt || new Date()
      };

      // Ensure all dates are properly formatted
      ['createdAt', 'updatedAt', 'lastActiveAt', 'lastLoginAt'].forEach(field => {
        if (updateData[field] && typeof updateData[field].toDate === 'function') {
          updateData[field] = updateData[field].toDate();
        }
      });

      await updateDoc(userRef, updateData);
      return true;
    } catch (error) {
      console.error('Update error:', error);
      throw new Error(`Failed to update user attributes: ${error.message}`);
    }
  },

  async updateStoreSlug(userId, storeName) {
    try {
      const storeSlug = generateStoreSlug(storeName);
      
      // Check if slug exists in stores collection
      const existingStore = await storeService.getStoreBySlug(storeSlug);
      
      let finalSlug = storeSlug;
      if (existingStore && existingStore.franchiseId !== userId) {
        finalSlug = `${storeSlug}-${userId.substring(0, 4)}`;
      }

      // Update user document
      await updateDoc(doc(db, USERS_COLLECTION, userId), {
        storeName,
        storeSlug: finalSlug,
        storeStatus: 'active'
      });

      // Create/Update store document
      await storeService.createStore(userId, storeName, finalSlug);

      return finalSlug;
    } catch (error) {
      console.error('Error updating store slug:', error);
      throw error;
    }
  },

  // Update store URL for franchise users
  updateStoreUrl: async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      
      // Check if user is a franchise and has a storeName
      if (userData.category === 'franchise' && userData.storeName) {
        const storeUrl = `/${userData.storeName}/store`;
        
        // Update the user document with the store URL
        await updateDoc(doc(db, USERS_COLLECTION, userId), {
          storeUrl: storeUrl,
          updatedAt: serverTimestamp()
        });
        
        return { success: true, storeUrl };
      } else {
        throw new Error('User is not a franchise or does not have a store name');
      }
    } catch (error) {
      console.error('Error updating store URL:', error);
      throw error;
    }
  },
};

export default userService;
