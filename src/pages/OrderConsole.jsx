import React, { useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  getDocs,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import app from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationContext';
import { useAuth } from '../context/AuthContext';
import orderService from '../services/orderService';
import { 
  CurrencyDollarIcon, 
  ShoppingBagIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  MapPinIcon,
  ChatBubbleLeftIcon,
  TruckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const db = getFirestore(app);

const OrderConsole = () => {
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { currentUser } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const updateStatistics = (ordersData) => {
    const revenue = ordersData.reduce((total, order) => total + order.totalAmount, 0);
    setTotalRevenue(revenue);

    const uniqueCustomerIds = new Set(ordersData.map(order => order.userId));
    setUniqueCustomers(uniqueCustomerIds.size);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const userRole = sessionStorage.getItem('userRole');
      
      if (!currentUser || !userRole) {
        navigate('/admin/login', { replace: true });
        return;
      }
      
      if (userRole !== 'webmaster') {
        navigate('/login', { 
          state: { message: 'Access denied: Not an admin account' }
        });
        return;
      }
    };

    checkAuth();
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('franchiseId', '==', 'default')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        ordersData.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
        
        setOrders(ordersData);
        
        updateStatistics(ordersData);
        
        setOrdersLoading(false);
      } catch (error) {
        console.error('Error in real-time update:', error);
        setOrdersLoading(false);
      }
    }, (error) => {
      console.error('Error setting up real-time listener:', error);
      setOrdersLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const formatStatus = (status) => {
    if (status === 'verify payment') return 'Verify Payment';
    if (status === 'processing order') return 'Processing Order';
    if (status === 'order sent') return 'Order Sent';
    return status.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handlePaymentConfirmation = async () => {
    if (!selectedOrder) return;
    
    try {
      await orderService.updateOrderStatus(selectedOrder.id, 'processing order');
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: 'processing order' }
          : order
      ));
      showNotification('Order status updated successfully', 'success');
      setShowConfirmModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error confirming payment:', error);
      showNotification('Error updating order status', 'error');
    }
  };

  const handleShippingConfirmation = async () => {
    if (!selectedOrder) return;
    
    try {
      await orderService.updateOrderStatus(selectedOrder.id, 'order sent');
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, status: 'order sent' }
          : order
      ));
      showNotification('Order shipping status updated successfully', 'success');
      setShowConfirmModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating shipping status:', error);
      showNotification('Error updating shipping status', 'error');
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrderDetails(order);
    setShowOrderDetailsModal(true);
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (currentUser.category !== 'webmaster') {
    navigate('/login', { 
      state: { message: 'Access denied: Not an admin account' }
    });
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Confirmation Modal */}
      {showConfirmModal && selectedOrder && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-fadeIn">
          <XMarkIcon 
            className="h-5 w-5 absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" 
            onClick={() => {
              setShowConfirmModal(false);
              setSelectedOrder(null);
            }}
          />
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {modalType === 'payment' ? 'Confirm Payment' : 'Confirm Shipping'}
          </h2>
          
          <div className="bg-gray-50 p-3 rounded-lg text-sm mb-4">
            <p className="text-gray-600">
              Order: <span className="font-medium text-gray-900">{selectedOrder.trackingNumber}</span>
            </p>
            <p className="text-gray-600">
              Customer: <span className="font-medium text-gray-900">{selectedOrder.customerInfo.firstName} {selectedOrder.customerInfo.lastName}</span>
            </p>
            {selectedOrder.paymentInfo && (
              <>
                <p className="text-gray-600">
                  Payment Method: <span className="font-medium text-gray-900 capitalize">{selectedOrder.paymentInfo.method}</span>
                </p>
                <p className="text-gray-600">
                  Reference Number: <span className="font-medium text-gray-900">{selectedOrder.paymentInfo.reference}</span>
                </p>
              </>
            )}
            {modalType === 'shipping' && (
              <p className="text-gray-600 mt-2">
                The product is sent to the customer?
              </p>
            )}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setSelectedOrder(null);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={modalType === 'payment' ? handlePaymentConfirmation : handleShippingConfirmation}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {modalType === 'payment' ? 'Confirm Payment' : 'Confirm Shipping'}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[80vh] overflow-y-auto my-4">
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={() => setShowOrderDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {/* Customer Info */}
                <div className="bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-1 mb-1">
                    <UserCircleIcon className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Customer Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <p className="text-gray-500 text-xs">Name</p>
                      <p className="font-medium text-sm">{`${selectedOrderDetails.customerInfo.firstName} ${selectedOrderDetails.customerInfo.lastName}`}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Email</p>
                      <p className="font-medium text-sm">{selectedOrderDetails.customerInfo.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Primary Phone</p>
                      <p className="font-medium text-sm">{selectedOrderDetails.customerInfo.primaryPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Secondary Phone</p>
                      <p className="font-medium text-sm">{selectedOrderDetails.customerInfo.secondaryPhone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-1 mb-1">
                    <MapPinIcon className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Shipping Address</h3>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <p className="text-gray-500 text-xs">Street Address</p>
                      <p className="font-medium text-sm">{selectedOrderDetails.shippingAddress.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">City, State & ZIP</p>
                      <p className="font-medium text-sm">
                        {`${selectedOrderDetails.shippingAddress.city}, ${selectedOrderDetails.shippingAddress.state} ${selectedOrderDetails.shippingAddress.zipCode}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Country</p>
                      <p className="font-medium text-sm">{selectedOrderDetails.shippingAddress.country}</p>
                    </div>
                  </div>
                </div>

                {/* Order Status and Tracking */}
                <div className="bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-1 mb-1">
                    <ClockIcon className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Order Status</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <p className="text-gray-500 text-xs">Current Status</p>
                      <span className={`inline-block px-2 py-0.5 text-sm font-semibold rounded ${
                        selectedOrderDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedOrderDetails.status === 'processing order' ? 'bg-blue-100 text-blue-800' :
                        selectedOrderDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedOrderDetails.status === 'verify payment' ? 'bg-purple-100 text-purple-800' :
                        selectedOrderDetails.status === 'order sent' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {formatStatus(selectedOrderDetails.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Tracking Number</p>
                      <p className="font-medium text-sm">{selectedOrderDetails.trackingNumber || 'Not Available'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 text-xs">Order Date</p>
                      <p className="font-medium text-sm">{selectedOrderDetails.createdAt ? new Date(selectedOrderDetails.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-1 mb-1">
                    <ShoppingBagIcon className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Order Items</h3>
                  </div>
                  <div className="space-y-1.5">
                    {selectedOrderDetails.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
                        <div className="flex items-center gap-2">
                          <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded" />
                          <div>
                            <p className="text-gray-500 text-xs">Item</p>
                            <p className="font-medium text-sm">{item.name}</p>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-right">
                            <p className="text-gray-500 text-xs">Price</p>
                            <p className="text-sm">${item.price.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500 text-xs">Qty</p>
                            <p className="text-sm">{item.quantity}</p>
                          </div>
                          <div className="text-right min-w-[80px]">
                            <p className="text-gray-500 text-xs">Total</p>
                            <p className="font-medium text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1">
                      <div className="text-right min-w-[80px]">
                        <p className="text-gray-500 text-xs">Total Amount</p>
                        <p className="font-medium text-sm text-primary-600">${selectedOrderDetails.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                {selectedOrderDetails.paymentInfo && (
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1 mb-1">
                      <TruckIcon className="h-4 w-4 text-gray-600" />
                      <h3 className="font-semibold text-gray-900 text-sm">Payment Information</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <p className="text-gray-500 text-xs">Payment Method</p>
                        <p className="font-medium text-sm capitalize">{selectedOrderDetails.paymentInfo.method}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Reference Number</p>
                        <p className="font-medium text-sm">{selectedOrderDetails.paymentInfo.reference}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seller Message */}
                {selectedOrderDetails.sellerMessage && (
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1 mb-1">
                      <ChatBubbleLeftIcon className="h-4 w-4 text-gray-600" />
                      <h3 className="font-semibold text-gray-900 text-sm">Seller Message</h3>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Message</p>
                      <p className="text-sm">{selectedOrderDetails.sellerMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <ShoppingBagIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Orders Made</p>
              <p className="text-2xl font-semibold text-gray-900">{uniqueCustomers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <BuildingStorefrontIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Account Status</p>
              <p className="text-2xl font-semibold text-gray-900">Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                Order ID
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordersLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => handleOrderClick(order)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {order.trackingNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {`${order.customerInfo.firstName} ${order.customerInfo.lastName}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {new Date(order.createdAt.toDate()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span 
                          className={`px-2 py-0.5 text-sm font-semibold rounded-full ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'processing order' ? 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200' :
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'verify payment' ? 'bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200' :
                            order.status === 'order sent' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                          onClick={(e) => {
                            if (order.status === 'verify payment') {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setModalType('payment');
                              setShowConfirmModal(true);
                            } else if (order.status === 'processing order') {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setModalType('shipping');
                              setShowConfirmModal(true);
                            }
                          }}
                        >
                          {formatStatus(order.status)}
                        </span>
                        {order.followUp && order.status !== 'pending' && (
                          <ExclamationTriangleIcon 
                            className="h-5 w-5 text-yellow-500" 
                            title="Customer has followed up on this order"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderConsole;
