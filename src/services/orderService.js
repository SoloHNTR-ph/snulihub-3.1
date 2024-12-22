// place order 

// {
//     customer: {
//       firstName: string,
//       lastName: string,
//       email: string,
//       address: string,
//       city: string,
//       state: string,
//       zipCode: string
//     },
//     items: [
//       {
//         id: string,
//         name: string,
//         price: number,
//         quantity: number
//       }
//     ],
//     totalAmount: number,
//     createdAt: timestamp,
//     status: string
//   }



import { getFirestore, collection, addDoc, doc, getDoc, query, where, getDocs, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import app from '../firebaseConfig';

const db = getFirestore(app);

// Helper function to get customer's order count
async function getCustomerOrderCount(userId) {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size + 1; // Add 1 for the new order
  } catch (error) {
    console.error('Error getting customer order count:', error);
    throw error;
  }
}

// Helper function to generate product codes
function generateProductCodes(items) {
  return items.map(item => {
    // Get first two letters of product name, convert to lowercase
    const productCode = item.name.slice(0, 2).toLowerCase();
    return productCode;
  });
}

// Generate order code
async function generateOrderCode(userId, zipCode, countryCode, items, orderNumber, franchiseId) {
  try {
    // Format: cu5001phsn1fr000456
    // Get product codes
    const productCodes = generateProductCodes(items);
    
    // Format postal code - keep as is since it can be any format
    const postalCode = zipCode;
    
    // Country code is already in 2 letters format
    const country = countryCode.toLowerCase();
    
    // Combine all product codes
    const productCodesString = productCodes.join('');
    
    // Create the order code with franchise ID if present
    const franchisePart = franchiseId ? franchiseId : 'none';
    const orderCode = `cu${postalCode}${country}${productCodesString}${orderNumber}${franchisePart}`;
    
    return orderCode;
  } catch (error) {
    console.error('Error generating order code:', error);
    throw error;
  }
}

// Generate tracking number
function generateTrackingNumber() {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export const createOrder = async (orderData) => {
  try {
    const ordersCollection = collection(db, 'orders');
    
    // Validate required fields
    if (!orderData.userId) {
      throw new Error('userId is required for creating an order');
    }
    
    if (!orderData.franchiseId) {
      throw new Error('franchiseId is required for creating an order');
    }

    // Generate tracking number
    const trackingNumber = generateTrackingNumber();

    // Log the incoming data for debugging
    console.log('Creating order with data:', {
      userId: orderData.userId,
      franchiseId: orderData.franchiseId,
      items: orderData.items.length,
      trackingNumber
    });
    
    // Get customer's order count
    const orderNumber = await getCustomerOrderCount(orderData.userId);
    
    // Generate order code
    const orderCode = await generateOrderCode(
      orderData.userId,
      orderData.shippingAddress.zipCode,
      orderData.shippingAddress.country,
      orderData.items,
      orderNumber,
      orderData.franchiseId // Make sure franchiseId is passed
    );
    
    // Prepare order data with required fields
    const orderWithTimestamp = {
      userId: orderData.userId,
      franchiseId: orderData.franchiseId,
      orderCode,
      orderNumber,
      items: orderData.items.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: parseInt(item.quantity)
      })),
      shippingAddress: {
        ...orderData.shippingAddress,
        zipCode: orderData.shippingAddress.zipCode || '',
        country: orderData.shippingAddress.country || ''
      },
      customerInfo: {
        firstName: orderData.customerInfo?.firstName || '',
        lastName: orderData.customerInfo?.lastName || '',
        email: orderData.customerInfo?.email || '',
        phone: orderData.customerInfo?.phone || '',
        primaryPhone: orderData.customerInfo?.primaryPhone || '',
        secondaryPhone: orderData.customerInfo?.secondaryPhone || ''
      },
      sellerMessage: orderData.sellerMessage || '',
      storeSlug: orderData.storeSlug || '',
      status: 'pending',
      createdAt: new Date(),
      totalAmount: orderData.items.reduce((total, item) => 
        total + (parseFloat(item.price || 0) * parseInt(item.quantity || 0)), 0),
      trackingNumber
    };
    
    // Log the final order data for debugging
    console.log('Final order data:', {
      userId: orderWithTimestamp.userId,
      franchiseId: orderWithTimestamp.franchiseId,
      orderCode: orderWithTimestamp.orderCode
    });

    const docRef = await addDoc(ordersCollection, orderWithTimestamp);
    
    return { 
      orderId: docRef.id,
      orderCode,
      customerUserId: orderData.userId,
      orderCodeWithFranchise: orderCode,
      success: true 
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrderById = async (orderId) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      return null;
    }
    
    return {
      id: orderDoc.id,
      ...orderDoc.data()
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

export const getOrdersByCode = async (orderCode, userId) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('orderCode', '==', orderCode),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting order by code:', error);
    throw error;
  }
};

export const getOrdersByFranchiseId = async (franchiseId) => {
  try {
    const ordersRef = collection(db, 'orders');
    // Remove the orderBy clause for now to avoid the index requirement
    const q = query(
      ordersRef,
      where('franchiseId', '==', franchiseId)
    );
    
    const querySnapshot = await getDocs(q);
    // Sort the results in memory instead
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by createdAt in descending order
    return orders.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
  } catch (error) {
    console.error('Error getting franchise orders:', error);
    throw error;
  }
};

export const getOrdersByUserId = async (userId) => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort by createdAt in descending order
    return orders.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
};

// Update order status
const updateOrderStatus = async (orderId, status) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status: status.toLowerCase(), // ensure consistent casing
      updatedAt: serverTimestamp(),
      followUp: false // Reset followUp when status changes
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Update follow up status
const updateFollowUpStatus = async (orderId, followUp) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      followUp,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating follow up status:', error);
    throw error;
  }
};

export default {
  createOrder,
  getOrderById,
  getOrdersByCode,
  getOrdersByFranchiseId,
  getOrdersByUserId,
  updateOrderStatus,
  updateFollowUpStatus
};
