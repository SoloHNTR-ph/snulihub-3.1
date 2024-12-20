import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import orderService from '../services/orderService';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const FranchiseDashboard = () => {
  const { currentUser, isFranchise, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [uniqueCustomers, setUniqueCustomers] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState('');

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      // Check session storage first
      const sessionUserId = sessionStorage.getItem('userId');
      const sessionStoreName = sessionStorage.getItem('storeName');
      
      if (!currentUser && !sessionUserId) {
        navigate('/');
        return;
      }

      try {
        // Fetch fresh user data using either current user ID or session ID
        const userId = currentUser?.id || sessionUserId;
        const freshUserData = await userService.getUserById(userId);
        
        if (freshUserData) {
          setUserData(freshUserData);
          // Set store name prioritizing: fresh data > session storage > empty string
          const newStoreName = freshUserData.storeName || sessionStoreName || '';
          setStoreName(newStoreName);
          
          // Always update session storage
          sessionStorage.setItem('storeName', newStoreName);
          sessionStorage.setItem('firstName', freshUserData.firstName || '');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to session storage if fetch fails
        if (sessionStoreName) {
          setStoreName(sessionStoreName);
        }
      }
    };

    initializeDashboard();
  }, [currentUser, isFranchise, navigate]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser?.id && !sessionStorage.getItem('userId')) return;
      
      try {
        setOrdersLoading(true);
        const userId = currentUser?.id || sessionStorage.getItem('userId');
        const orders = await orderService.getOrdersByFranchiseId(userId);
        setOrders(orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  // Calculate total revenue and unique customers whenever orders change
  useEffect(() => {
    const calculateTotalRevenue = () => {
      const total = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      setTotalRevenue(total);
    };

    const calculateUniqueCustomers = () => {
      const uniqueUserIds = new Set(orders.map(order => order.userId));
      setUniqueCustomers(uniqueUserIds.size);
    };

    calculateTotalRevenue();
    calculateUniqueCustomers();
  }, [orders]);

  const handleStoreNameUpdate = async () => {
    if (!storeName.trim()) return;
    
    setLoading(true);
    try {
      const userId = currentUser?.id || sessionStorage.getItem('userId');
      const newSlug = await userService.updateStoreSlug(userId, storeName.trim());
      
      // Update session storage
      sessionStorage.setItem('storeName', storeName.trim());
      sessionStorage.setItem('storeSlug', newSlug);

      // Fetch updated user data
      const updatedUser = await userService.getUserById(userId);
      if (updatedUser) {
        setUserData(updatedUser);
      }

      setIsEditingStore(false);
    } catch (error) {
      console.error('Error updating store name:', error);
      const previousStoreName = sessionStorage.getItem('storeName');
      if (previousStoreName) setStoreName(previousStoreName);
    } finally {
      setLoading(false);
    }
  };

  // Get display name from various sources
  const getDisplayName = () => {
    return userData?.firstName || 
           sessionStorage.getItem('firstName') || 
           currentUser?.firstName || 
           'User';
  };

  // Format status for display
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
      setShowConfirmModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error confirming payment:', error);
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
      setShowConfirmModal(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating shipping status:', error);
    }
  };

  if (!currentUser && !sessionStorage.getItem('userId')) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {getDisplayName()}!
              </h1>
              <div className="mt-2 flex items-center">
                <p className="text-gray-500 mr-2">Store:</p>
                {isEditingStore ? (
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm mr-2"
                      placeholder="Enter store name"
                    />
                    <button
                      onClick={handleStoreNameUpdate}
                      disabled={loading}
                      className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingStore(false);
                        setStoreName(userData?.storeName || sessionStorage.getItem('storeName') || '');
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm ml-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-gray-900 font-medium">
                      {storeName || 'Loading...'}
                    </span>
                    <button
                      onClick={() => setIsEditingStore(true)}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Quick Stats */}
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
                <p className="text-sm font-medium text-gray-500">Customers</p>
                <p className="text-2xl font-semibold text-gray-900">{uniqueCustomers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <BuildingStorefrontIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Store Status</p>
                <p className="text-2xl font-semibold text-gray-900">Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.trackingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {`${order.customerInfo.firstName} ${order.customerInfo.lastName}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt.toDate()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
    </div>
  );
};

export default FranchiseDashboard;
