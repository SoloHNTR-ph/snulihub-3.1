import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import orderService from '../services/orderService';
import { 
  ShoppingBagIcon, 
  ClockIcon, 
  HeartIcon, 
  UserCircleIcon,
  CheckCircleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { doc, getDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { XMarkIcon } from '@heroicons/react/24/outline';

const CustomerDashboard = () => {
  const { currentUser, isCustomer, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);

  useEffect(() => {
    if (!currentUser || (!isCustomer && !currentUser?.category === 'test')) {
      navigate('/');
    }
  }, [currentUser, isCustomer, navigate]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.id) return;
      
      try {
        const userRef = doc(db, 'users', currentUser.id);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser?.id && !sessionStorage.getItem('userId')) return;
      
      try {
        setOrdersLoading(true);
        const userId = currentUser?.id || sessionStorage.getItem('userId');
        const q = await orderService.getOrdersByUserId(userId);
        setOrders(q);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  // Format status for display
  const formatStatus = (status) => {
    if (status === 'verify payment') return 'Verifying Payment';
    // Capitalize first letter of each word
    return status.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailsModal(true);
  };

  if (!currentUser || (!isCustomer && !currentUser?.category === 'test')) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {userData?.firstName || currentUser?.firstName || 'Customer'}!
              </h1>
              <p className="mt-1 text-gray-500">
                Here's what's happening with your account today.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <ClockIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <p className="text-2xl font-semibold text-gray-900">Comming soon</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <HeartIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Wishlist Items</p>
                <p className="text-2xl font-semibold text-gray-900">Comming soon</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <UserCircleIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Account Type</p>
                <p className="text-2xl font-semibold text-gray-900">Customer</p>
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.trackingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt.toDate()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${order.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-4 whitespace-nowrap text-sm text-gray-500 space-x-2 flex items-center justify-between w-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/order/${order.userId}/${order.orderCode}`);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Track
                        </button>
                        {order.status !== 'pending' && (
                          order.followUp ? (
                            <div className="flex items-center justify-center text-green-600">
                              <CheckCircleIcon className="h-5 w-5 mr-1" />
                              <span>Followed Up</span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                orderService.updateFollowUpStatus(order.id, true);
                                setOrders(orders.map(o => 
                                  o.id === order.id ? {...o, followUp: true} : o
                                ));
                              }}
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                            >
                              Follow Up
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetailsModal && selectedOrder && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowOrderDetailsModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl w-full mx-4 max-h-[90vh] overflow-y-auto md:w-[600px] lg:w-[800px] xl:w-[1000px]"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                <XMarkIcon 
                  className="h-5 w-5 text-gray-400 hover:text-gray-500 cursor-pointer transition-colors" 
                  onClick={() => setShowOrderDetailsModal(false)}
                />
              </div>

              <div className="space-y-2">
                {/* Customer Info and Status - Side by Side */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Customer Info */}
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1">
                      <UserCircleIcon className="h-4 w-4 text-gray-600" />
                      <h3 className="font-semibold text-gray-900 text-sm">Customer Info</h3>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-sm">
                        <span className="text-gray-500">Name:</span>{' '}
                        <span className="font-medium">{`${selectedOrder.customerInfo.firstName} ${selectedOrder.customerInfo.lastName}`}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Email:</span>{' '}
                        <span className="font-medium">{selectedOrder.customerInfo.email}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Phone:</span>{' '}
                        <span className="font-medium">{selectedOrder.customerInfo.primaryPhone || 'N/A'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Order Status */}
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4 text-gray-600" />
                      <h3 className="font-semibold text-gray-900 text-sm">Order Status</h3>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <div>
                        <span className="text-gray-500 text-sm">Status:</span>{' '}
                        <span className={`inline-block px-2 py-0.5 text-sm font-semibold rounded ${
                          selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedOrder.status === 'processing order' ? 'bg-blue-100 text-blue-800' :
                          selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                          selectedOrder.status === 'verify payment' ? 'bg-purple-100 text-purple-800' :
                          selectedOrder.status === 'order sent' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {formatStatus(selectedOrder.status)}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="text-gray-500">Tracking:</span>{' '}
                        <span className="font-medium">{selectedOrder.trackingNumber || 'N/A'}</span>
                      </p>
                      <p className="text-sm">
                        <span className="text-gray-500">Date:</span>{' '}
                        <span className="font-medium">{selectedOrder.createdAt ? new Date(selectedOrder.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Shipping Address</h3>
                  </div>
                  <div className="mt-1">
                    <p className="text-sm font-medium">
                      {selectedOrder.shippingAddress.address},{' '}
                      {`${selectedOrder.shippingAddress.city}, ${selectedOrder.shippingAddress.state} ${selectedOrder.shippingAddress.zipCode}`},{' '}
                      {selectedOrder.shippingAddress.country}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-50 p-2 rounded">
                  <div className="flex items-center gap-1">
                    <ShoppingBagIcon className="h-4 w-4 text-gray-600" />
                    <h3 className="font-semibold text-gray-900 text-sm">Order Items</h3>
                  </div>
                  <div className="mt-1 space-y-1">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
                        <div className="flex items-center gap-2">
                          <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded" />
                          <p className="font-medium text-sm">{item.name}</p>
                        </div>
                        <div className="flex gap-4 text-sm">
                          <span>${item.price.toFixed(2)}</span>
                          <span>×{item.quantity}</span>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1">
                      <div className="text-right">
                        <span className="text-gray-500 text-sm">Total:</span>{' '}
                        <span className="font-medium text-primary-600 text-sm">${selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
