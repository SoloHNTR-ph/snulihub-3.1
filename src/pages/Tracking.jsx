import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MagnifyingGlassIcon, UserIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { collection, query, where, getDocs, getFirestore, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import app from '../firebaseConfig';
import orderService from '../services/orderService';
import Navbar from '../components/Navbar';

const Tracking = () => {
  const { customerUserId, orderCodeWithFranchise: orderCode } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    referenceNumber: '',
    proofOfPayment: null,
    paymentMethod: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      console.log('Fetching order with:', { customerUserId, orderCode });
      try {
        setLoading(true);
        const db = getFirestore(app);
        const ordersRef = collection(db, 'orders');
        
        // Query orders collection with both orderCode and userId for security
        const q = query(
          ordersRef,
          where('orderCode', '==', orderCode),
          where('userId', '==', customerUserId)
        );
        console.log('Executing query...');
        const querySnapshot = await getDocs(q);
        console.log('Query results:', querySnapshot.size);
        
        if (querySnapshot.empty) {
          console.log('No matching orders found');
          setError('Order not found');
          setLoading(false);
          return;
        }
        
        // Get the first matching order
        const orderDoc = querySnapshot.docs[0];
        const orderData = {
          id: orderDoc.id,
          ...orderDoc.data()
        };
        console.log('Order data:', orderData);
        
        // Verify this order belongs to the customer
        if (orderData.userId !== customerUserId) {
          console.log('Unauthorized: Order belongs to different user');
          setError('Unauthorized access');
          setLoading(false);
          return;
        }
        
        setOrder(orderData);
        setPaymentStatus(orderData.status || 'pending');
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Error fetching order details');
      } finally {
        setLoading(false);
      }
    };

    if (customerUserId && orderCode) {
      fetchOrder();
    } else {
      console.log('Missing required parameters:', { customerUserId, orderCode });
      setLoading(false);
    }
  }, [customerUserId, orderCode]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // Handle password submission here
    setShowPasswordModal(false);
  };

  const handlePaymentFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'proofOfPayment' && files) {
      setPaymentForm(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else if (name === 'amount') {
      // Only allow numbers and decimal point
      const numericValue = value.replace(/[^\d.]/g, '');
      // Ensure only one decimal point
      const parts = numericValue.split('.');
      const formattedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : numericValue;
      setPaymentForm(prev => ({
        ...prev,
        [name]: formattedValue
      }));
    } else {
      setPaymentForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!order?.id) return;

    try {
      setSubmitting(true);
      
      // Here you would typically upload the proof of payment image to storage
      // and get the URL, but for now we'll just update the status
      
      await orderService.updateOrderStatus(order.id, 'verify payment');
      
      // Update local state
      setOrder(prev => ({
        ...prev,
        status: 'verify payment'
      }));
      setPaymentStatus('verify payment');
      setShowPaymentModal(false);
      
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStepStatus = (status) => {
    // Map status to step index
    const statusToStepIndex = {
      'pending': 0,
      'verify payment': 0,
      'processing order': 1,
      'order sent': 2
    };

    const currentStepIndex = statusToStepIndex[status] ?? -1;
    
    return (stepIndex) => {
      // When order is sent, mark all steps as complete
      if (status === 'order sent') return 'complete';
      
      if (stepIndex < currentStepIndex) return 'complete';
      if (stepIndex === currentStepIndex) return 'current';
      return 'upcoming';
    };
  };

  const steps = [
    { 
      title: 'Payment Confirmation', 
      description: 'Payment confirmation in progress',
      index: 0
    },
    { 
      title: 'Processing Order', 
      description: 'Your order is being processed',
      index: 1
    },
    { 
      title: 'Order Sent', 
      description: 'Package is on the way',
      index: 2
    }
  ];

  const handlePaymentSent = () => {
    setPaymentStatus('received');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 h-auto">
          <div className="flex justify-between items-start w-full mb-8 relative">
            {/* Add a background line that spans the entire width */}
            <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200" aria-hidden="true" />
            
            {steps.map((step, index) => {
              const getStatus = getStepStatus(paymentStatus);
              const status = getStatus(index);
              return (
                <div key={step.title} className="relative flex flex-col items-center flex-1">
                  <div className="relative">
                    <div className="flex items-center justify-center">
                      <span className="relative z-10 flex h-8 w-8 items-center justify-center">
                        {status === 'complete' ? (
                          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                            <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        ) : status === 'current' ? (
                          <div className="h-8 w-8 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full border-2 border-gray-300 bg-white" />
                        )}
                      </span>
                    </div>
                    <div className="mt-3 text-center">
                      <div className="text-sm font-medium text-gray-900">{step.title}</div>
                      <p className="text-sm text-gray-500 mt-1 max-w-[150px]">{step.description}</p>
                      {/* Payment Status for first step */}
                      {index === 0 && paymentStatus !== 'processing order' && paymentStatus !== 'order sent' && (
                        <div className="mt-4">
                          <div className="w-0.5 h-16 bg-gray-200 mx-auto" />
                          <div className="relative -mt-1">
                            <div className="relative flex flex-col items-center">
                              <span className="flex h-8 w-8 items-center justify-center">
                                {paymentStatus === 'pending' ? (
                                  <div className="h-8 w-8 rounded-full border-2 border-yellow-500 bg-white flex items-center justify-center">
                                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                                  </div>
                                ) : paymentStatus === 'verify payment' ? (
                                  <div className="h-8 w-8 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center">
                                    <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                  </div>
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </span>
                              <div className="mt-3 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                                {paymentStatus === 'pending' ? (
                                  <>
                                    <p className="text-yellow-600 font-medium text-sm">Pending Payment</p>
                                    <button
                                      onClick={() => setShowPaymentModal(true)}
                                      className="mt-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap"
                                    >
                                      Send Payment
                                    </button>
                                  </>
                                ) : paymentStatus === 'verify payment' ? (
                                  <p className="text-blue-600 font-medium text-sm">Waiting for Approval</p>
                                ) : (
                                  <p className="text-green-600 font-medium text-sm">Payment Approved</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Processing Status for second step */}
                      {index === 1 && paymentStatus === 'processing order' && (
                        <div className="mt-4">
                          <div className="w-0.5 h-16 bg-gray-200 mx-auto" />
                          <div className="relative -mt-1">
                            <div className="relative flex flex-col items-center">
                              <span className="flex h-8 w-8 items-center justify-center">
                                <div className="h-8 w-8 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center">
                                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                </div>
                              </span>
                              <div className="mt-3 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                                <p className="text-blue-600 font-medium text-sm">Processing Your Order</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Order Sent Status for third step */}
                      {index === 2 && paymentStatus === 'order sent' && (
                        <div className="mt-4">
                          <div className="w-0.5 h-16 bg-gray-200 mx-auto" />
                          <div className="relative -mt-1">
                            <div className="relative flex flex-col items-center">
                              <span className="flex h-8 w-8 items-center justify-center">
                                <div className="h-8 w-8 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center">
                                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                                </div>
                              </span>
                              <div className="mt-3 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                                <p className="text-blue-600 font-medium text-sm">Order is on the way</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-sm relative animate-fadeIn">            
            <XMarkIcon 
              className="h-5 w-5 absolute right-6 top-6 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" 
              onClick={() => setShowPasswordModal(false)}
            />
            <h2 className="text-xl font-semibold text-gray-800 mb-8">Add a Password</h2>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={passwordForm.password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100/50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                  placeholder="Password"
                />
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100/50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  required
                  placeholder="Confirm Password"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                Set Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-fadeIn">            
            <XMarkIcon 
              className="h-5 w-5 absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" 
              onClick={() => setShowPaymentModal(false)}
            />
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Send Payment</h2>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* GCash */}
                  <label 
                    className={`relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 
                      ${paymentForm.paymentMethod === 'gcash' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-200'}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gcash"
                      checked={paymentForm.paymentMethod === 'gcash'}
                      onChange={handlePaymentFormChange}
                      className="sr-only"
                    />
                    <img src="/gcash-logo.png" alt="GCash" className="h-6 w-auto mb-1" />
                    <span className="text-xs font-medium">GCash</span>
                    {paymentForm.paymentMethod === 'gcash' && (
                      <div className="absolute top-1 right-1 h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </div>
                    )}
                  </label>

                  {/* Maya */}
                  <label 
                    className={`relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 
                      ${paymentForm.paymentMethod === 'maya' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-200'}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="maya"
                      checked={paymentForm.paymentMethod === 'maya'}
                      onChange={handlePaymentFormChange}
                      className="sr-only"
                    />
                    <img src="/maya-logo.png" alt="Maya" className="h-6 w-auto mb-1" />
                    <span className="text-xs font-medium">Maya</span>
                    {paymentForm.paymentMethod === 'maya' && (
                      <div className="absolute top-1 right-1 h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </div>
                    )}
                  </label>

                  {/* Bank Transfer */}
                  <label 
                    className={`relative flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 
                      ${paymentForm.paymentMethod === 'bank' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-200'}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentForm.paymentMethod === 'bank'}
                      onChange={handlePaymentFormChange}
                      className="sr-only"
                    />
                    <img src="/bank-logo.png" alt="Bank Transfer" className="h-6 w-auto mb-1" />
                    <span className="text-xs font-medium">Bank</span>
                    {paymentForm.paymentMethod === 'bank' && (
                      <div className="absolute top-1 right-1 h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Payment Details - Show if a payment method is selected */}
              {paymentForm.paymentMethod && (
                <>
                  {/* Payment Instructions */}
                  <div className="bg-gray-50 p-3 rounded-lg text-xs">
                    <h3 className="font-medium text-gray-900 mb-1">Payment Details</h3>
                    {paymentForm.paymentMethod === 'gcash' && (
                      <div className="text-gray-600">
                        <p>GCash: 09123456789</p>
                        <p>Name: SnuliHub Store</p>
                      </div>
                    )}
                    {paymentForm.paymentMethod === 'maya' && (
                      <div className="text-gray-600">
                        <p>Maya: 09123456789</p>
                        <p>Name: SnuliHub Store</p>
                      </div>
                    )}
                    {paymentForm.paymentMethod === 'bank' && (
                      <div className="text-gray-600">
                        <p>BDO: 1234567890</p>
                        <p>Name: SnuliHub Store</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label htmlFor="amount" className="block text-xs font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <style jsx>{`
                        input[type="number"]::-webkit-inner-spin-button,
                        input[type="number"]::-webkit-outer-spin-button {
                          -webkit-appearance: none;
                          margin: 0;
                        }
                        input[type="number"] {
                          -moz-appearance: textfield;
                        }
                      `}</style>
                      <input
                        type="text"
                        name="amount"
                        id="amount"
                        value={paymentForm.amount}
                        onChange={handlePaymentFormChange}
                        className="w-full px-3 py-2 rounded-lg border-0 bg-gray-100/50 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        required
                        placeholder="Enter amount"
                        inputMode="decimal"
                      />
                    </div>

                    <div>
                      <label htmlFor="referenceNumber" className="block text-xs font-medium text-gray-700 mb-1">
                        Reference No.
                      </label>
                      <input
                        type="text"
                        name="referenceNumber"
                        id="referenceNumber"
                        value={paymentForm.referenceNumber}
                        onChange={handlePaymentFormChange}
                        className="w-full px-3 py-2 rounded-lg border-0 bg-gray-100/50 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        required
                        placeholder="Enter reference"
                      />
                    </div>
                  </div>

                  {/* <div>
                    <label htmlFor="proofOfPayment" className="block text-xs font-medium text-gray-700 mb-1">
                      Proof of Payment
                    </label>
                    <div className="mt-1 flex justify-center px-4 py-3 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                        <div className="flex text-xs text-gray-600">
                          <label htmlFor="proofOfPayment" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input
                              id="proofOfPayment"
                              name="proofOfPayment"
                              type="file"
                              className="sr-only"
                              onChange={handlePaymentFormChange}
                              accept="image/*"
                              required
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div> */}
                </>
              )}

              <button
                type="submit"
                disabled={submitting || !paymentForm.paymentMethod}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  (submitting || !paymentForm.paymentMethod) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracking;
