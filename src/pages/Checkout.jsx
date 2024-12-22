import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService';
import { userService } from '../services/userService';
import { getOrdersByCode } from '../services/orderService';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ReactCountryFlag from 'react-country-flag';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { useParams } from 'react-router-dom';
import { useStore } from '../utils/useStore';

// Add country data
const countries = [
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'Australia', code: 'AU', dialCode: '+61' },
  { name: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'China', code: 'CN', dialCode: '+86' },
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62' },
  { name: 'Japan', code: 'JP', dialCode: '+81' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60' },
  { name: 'Philippines', code: 'PH', dialCode: '+63' },
  { name: 'Singapore', code: 'SG', dialCode: '+65' },
  { name: 'South Korea', code: 'KR', dialCode: '+82' },
  { name: 'Thailand', code: 'TH', dialCode: '+66' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84' },
].sort((a, b) => a.name.localeCompare(b.name));

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart, addToCart, updateQuantity } = useCart();
  const { currentUser, login } = useAuth();
  const { storeSlug } = useParams();
  const { storeData, loading: storeLoading, error: storeError, setStoreData } = useStore(storeSlug);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    countryCode: 'US',
    primaryPhone: '',
    secondaryPhone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    message: '',
    sellerMessage: '',
    password: ''
  });

  // If no storeSlug is provided, use the default store
  useEffect(() => {
    if (!storeSlug && !storeData) {
      // Default store data
      const defaultStoreData = {
        storeName: 'SnuliHub Store',
        storeSlug: 'snulihub',
        franchiseId: 'default' // You might want to set this to a specific franchise ID
      };
      setStoreData(defaultStoreData);
    }
  }, [storeSlug, storeData]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });

  const [showPrimaryPhoneDropdown, setShowPrimaryPhoneDropdown] = useState(false);
  const [showSecondaryPhoneDropdown, setShowSecondaryPhoneDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const [formErrors, setFormErrors] = useState({});

  const [defaultProduct, setDefaultProduct] = useState(null);

  useEffect(() => {
    if (storeError) {
      setFormErrors({ submit: 'Error loading store information. Please try again.' });
    }
  }, [storeError]);

  // Populate form data with user information if logged in
  useEffect(() => {
    const loadUserData = async () => {
      console.log('Checkout: Current user state:', currentUser);
      
      if (currentUser?.id) {
        try {
          console.log('Checkout: Fetching user data for ID:', currentUser.id);
          // Fetch fresh user data from Firebase
          const userData = await userService.getUserById(currentUser.id);
          console.log('Checkout: Fetched user data:', userData);
          
          if (userData) {
            // Find the country object based on stored country code or name
            const userCountry = countries.find(
              c => c.code === userData.countryCode || c.name === userData.country
            );
            console.log('Checkout: Matched country:', userCountry);

            // Format phone numbers without country code
            const formatPhoneNumber = (phone) => {
              if (!phone) return '';
              // Allow + at the start and digits
              const cleanedValue = phone.replace(/[^\d+]/g, '');
              // Ensure + only appears at the start if present
              return cleanedValue.replace(/\+/g, (match, index) => index === 0 ? match : '');
            };

            const formattedData = {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              country: userCountry?.name || userData.country || '',
              countryCode: userCountry?.code || 'US',
              primaryPhone: formatPhoneNumber(userData.primaryPhone) || '',
              secondaryPhone: formatPhoneNumber(userData.secondaryPhone) || '',
              address: userData.address || '',
              city: userData.city || '',
              state: userData.state || '',
              zipCode: userData.zipCode || '',
            };

            console.log('Checkout: Setting form data:', formattedData);
            setFormData(prevData => ({
              ...prevData,
              ...formattedData
            }));
          }
        } catch (error) {
          console.error('Error loading user data for autofill:', error);
        }
      } else {
        console.log('Checkout: No user ID found in currentUser');
      }
    };

    loadUserData();
  }, [currentUser]);

  // Log form data changes
  useEffect(() => {
    console.log('Checkout: Form data updated:', formData);
  }, [formData]);

  // Fetch default test product
  useEffect(() => {
    const fetchDefaultProduct = async () => {
      try {
        const products = await productService.getAllProducts();
        const testProduct = products.find(p => p.name.toLowerCase() === 'test');
        if (testProduct && cartItems.length === 0) {
          // Ensure quantity is set to 1
          const productWithQuantity = { ...testProduct, quantity: 1 };
          setDefaultProduct(productWithQuantity);
          // Clear cart first to ensure we start fresh
          clearCart();
          // Add the product with quantity 1
          addToCart(productWithQuantity);
        }
      } catch (error) {
        console.error('Error fetching default product:', error);
      }
    };

    fetchDefaultProduct();
  }, [addToCart, clearCart]);

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormErrors({}); // Clear errors when user types
    
    if (name === 'primaryPhone' || name === 'secondaryPhone') {
      // Allow + and digits only
      let cleanedValue = value.replace(/[^\d+]/g, '');
      // Ensure + only appears at the start if present
      cleanedValue = cleanedValue.replace(/\+/g, (match, index) => index === 0 ? match : '');
      
      setFormData(prevData => ({
        ...prevData,
        [name]: cleanedValue
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});  // Clear previous errors
    
    try {
      if (!storeData?.franchiseId) {
        setFormErrors({ submit: 'Store information is not properly loaded. Please try again.' });
        return;
      }

      let userId = currentUser?.id;
      
      if (!userId) {
        // Only create/update user if not logged in
        if (!formData.password) {
          setShowPasswordModal(true);
          return;
        }
        
        // Check if email already exists
        try {
          const existingUser = await userService.getUserByEmail(formData.email);
          if (existingUser) {
            setFormErrors({
              email: 'This email is already registered. Please use a different email or login to your account.'
            });
            return;
          }
        } catch (error) {
          // If error is "User not found", that's good - continue
          if (!error.message.includes('not found')) {
            throw error;
          }
        }

        // Generate user ID first
        const generatedId = await userService.generateNextUserId('cu');
        
        // Create new user
        const newUser = await userService.createUser({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          category: 'customer',
          id: generatedId,
          userId: generatedId,
          primaryPhone: formData.primaryPhone || '',
          secondaryPhone: formData.secondaryPhone || '',
          phone: formData.primaryPhone || '', // For backwards compatibility
          address: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          country: formData.country || '',
          countryCode: formData.countryCode || '',
          zipCode: formData.zipCode || '',
          cardNumber: formData.cardNumber || '',
          cvv: formData.cvv || '',
          expiryDate: formData.expiryDate || '',
        });
        userId = newUser.id;
      }

      // Create the order
      const orderData = {
        ...formData,
        userId: userId,
        items: cartItems,
        storeSlug: storeSlug,
        sellerMessage: formData.sellerMessage,
        franchiseId: storeData?.franchiseId || 'default', // Handle both franchise and default store cases
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.countryCode
        },
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          primaryPhone: formData.primaryPhone || '',
          secondaryPhone: formData.secondaryPhone || '',
          phone: formData.primaryPhone || '' // For backwards compatibility
        }
      };

      // Log the order data before creating the order
      console.log('Creating order with data:', orderData);

      const order = await createOrder(orderData);
      
      // Clear the cart
      clearCart();
      
      // Navigate to tracking page with correct URL format
      navigate(`/order/${order.customerUserId}/${order.orderCodeWithFranchise}`);
    } catch (error) {
      console.error('Error creating order:', error);
      setFormErrors({ submit: 'Error creating order. Please try again.' });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    // Add password to formData
    setFormData(prev => ({
      ...prev,
      password: passwordForm.password
    }));
    
    setShowPasswordModal(false);
    
    try {
      // Check if email already exists
      try {
        const existingUser = await userService.getUserByEmail(formData.email);
        if (existingUser) {
          setFormErrors({
            email: 'This email is already registered. Please use a different email or login to your account.'
          });
          return;
        }
      } catch (error) {
        // If error is "User not found", that's good - continue
        if (!error.message.includes('not found')) {
          throw error;
        }
      }

      // Generate user ID first
      const generatedId = await userService.generateNextUserId('cu');
      
      // Create new user first
      const newUser = await userService.createUser({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: passwordForm.password,
        category: 'customer',
        id: generatedId,
        userId: generatedId,
        primaryPhone: formData.primaryPhone || '',
        secondaryPhone: formData.secondaryPhone || '',
        phone: formData.primaryPhone || '', // For backwards compatibility
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        country: formData.country || '',
        countryCode: formData.countryCode || '',
        zipCode: formData.zipCode || '',
        cardNumber: formData.cardNumber || '',
        cvv: formData.cvv || '',
        expiryDate: formData.expiryDate || '',
      });
      // Automatically log in the user
      await login(formData.email, passwordForm.password);
      
      // Store session data
      sessionStorage.setItem('sessionEmail', formData.email);
      sessionStorage.setItem('userRole', 'customer');
      sessionStorage.setItem('userId', generatedId);
      
      // Create order with new user
      const orderData = {
        userId: generatedId,
        franchiseId: storeData?.franchiseId || 'default', // Handle both franchise and default store cases
        items: cartItems.map(item => ({
          ...item,
          name: item.name,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity)
        })),
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.countryCode,
        },
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          primaryPhone: formData.primaryPhone || '',
          secondaryPhone: formData.secondaryPhone || '',
          phone: formData.primaryPhone || '' // For backwards compatibility
        },
        sellerMessage: formData.sellerMessage,
        contactInfo: {
          email: formData.email,
          primaryPhone: formData.primaryPhone || '',
          secondaryPhone: formData.secondaryPhone || '',
          phone: formData.primaryPhone || '', // For backwards compatibility
        },
      };

      const order = await createOrder(orderData);
      clearCart();
      
      // Get order details using the secure function
      const orders = await getOrdersByCode(order.orderCode, generatedId);
      if (orders && orders.length > 0) {
        navigate(`/order/${generatedId}/${order.orderCode}`);
      } else {
        console.error('Order not found after creation');
        setFormErrors({ submit: 'Error creating order. Please try again.' });
      }
    } catch (error) {
      console.error('Error processing order:', error);
      setFormErrors({ submit: 'Error creating order. Please try again.' });
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-lg text-gray-600">One moment . . .</p>
        </div>
      </div>
    );
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal();
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 max-w-7xl mx-auto w-full p-3">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-3 fade-in-up">
          Finalizing Order
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[calc(100%-2rem)]">
          {/* Order Summary */}
          <div className="fade-in-right">
            <div className="backdrop-blur-lg bg-white/80 p-3 rounded-xl shadow-xl border border-gray-100 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Order Summary</h2>
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3 py-2 border-b border-gray-200">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover transform hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col">
                        <h3 className="font-semibold text-sm text-gray-900">{item.name}</h3>
                        <div className="flex items-center justify-center space-x-2 my-1">
                          <button 
                            className="text-xs px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <p className="text-xs text-gray-600 min-w-[80px] text-center">Quantity: {item.quantity}</p>
                          <button 
                            className="text-xs px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <p className="text-primary-600 font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2 text-gray-900">
                  <span>Total</span>
                  <span className="text-primary-600">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-primary-100 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900">Secure Checkout</p>
                    <p className="text-xs text-gray-500">Your data is protected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="fade-in-up">
            <div className="backdrop-blur-lg bg-white/80 p-3 rounded-xl shadow-xl border border-gray-100 gap-5">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Order Confimation</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Personal Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="peer w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black"
                      required
                      placeholder=" "
                    />
                    <label htmlFor="firstName" className="absolute text-sm text-gray-500 duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">First Name</label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="peer w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black"
                      required
                      placeholder=" "
                    />
                    <label htmlFor="lastName" className="absolute text-sm text-gray-500 duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">Last Name</label>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`peer w-full px-2 py-1.5 rounded-lg border ${formErrors.email ? 'border-red-500' : 'border-gray-200'} focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black`}
                    required
                    placeholder=" "
                  />
                  <label htmlFor="email" className={`absolute text-sm ${formErrors.email ? 'text-red-500' : 'text-gray-500'} duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1`}>Email</label>
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="tel"
                      name="primaryPhone"
                      id="primaryPhone"
                      value={formData.primaryPhone}
                      onChange={handleInputChange}
                      className="peer w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black"
                      required
                      placeholder=" "
                    />
                    <label htmlFor="primaryPhone" className="absolute text-sm text-gray-500 duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">Phone Number</label>
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      name="secondaryPhone"
                      id="secondaryPhone"
                      value={formData.secondaryPhone}
                      onChange={handleInputChange}
                      className="peer w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black"
                      placeholder=" "
                    />
                    <label htmlFor="secondaryPhone" className="absolute text-sm text-gray-500 duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">Alternative Phone (Optional)</label>
                  </div>
                </div>

                {/* Address and City */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative md:col-span-2">
                    <input
                      type="text"
                      name="address"
                      id="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="peer w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black"
                      required
                      placeholder=" "
                    />
                    <label htmlFor="address" className="absolute text-sm text-gray-500 duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">Address</label>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      name="city"
                      id="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="peer w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black"
                      required
                      placeholder=" "
                    />
                    <label htmlFor="city" className="absolute text-sm text-gray-500 duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">City</label>
                  </div>
                </div>

                {/* State, Country, and Zip Code */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <input
                      type="text"
                      name="state"
                      id="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="peer w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black"
                      required
                      placeholder=" "
                    />
                    <label htmlFor="state" className="absolute text-sm text-gray-500 duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">State</label>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="peer w-full pl-3 pr-2 py-1.5 rounded-lg border border-gray-200 focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black text-left"
                    >
                      {formData.country ? (
                        <div className="flex items-center gap-2">
                          <ReactCountryFlag
                            countryCode={formData.country}
                            svg
                            style={{
                              width: '20px',
                              height: '15px',
                            }}
                          />
                          {formData.country}
                        </div>
                      ) : (
                        <span className="text-gray-400">Select country</span>
                      )}
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                        <div className="p-1">
                          {countries.map((country) => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                handleInputChange({
                                  target: { name: 'country', value: country.code }
                                });
                                setShowCountryDropdown(false);
                              }}
                              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-white"
                              title={country.name}
                            >
                              <ReactCountryFlag
                                countryCode={country.code}
                                svg
                                style={{
                                  width: '20px',
                                  height: '15px',
                                }}
                              />
                              {country.code}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <label className="absolute text-sm text-gray-500 duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">Country</label>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      name="zipCode"
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="peer w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black"
                      required
                      placeholder=" "
                    />
                    <label htmlFor="zipCode" className="absolute text-sm text-gray-500 duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">Zip Code</label>
                  </div>
                </div>

                {/* Message Seller */}
                <div className="relative">
                  <input
                    type="text"
                    name="sellerMessage"
                    id="sellerMessage"
                    value={formData.sellerMessage}
                    onChange={handleInputChange}
                    className="peer w-full px-2 py-1.5 rounded-lg border border-gray-200 focus:ring-0 focus:border-gray-200 outline-none transition-all duration-200 bg-white pt-4 text-black"
                    placeholder=" "
                    maxLength={500}
                  />
                  <label htmlFor="sellerMessage" className="absolute text-sm text-gray-500 duration-200 transform -translate-y-4 scale-75 top-1 z-10 origin-[0] bg-white px-2 peer-focus:px-2 peer-focus:text-primary-600 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-4 left-1">Message Seller (Optional)</label>
                </div>

                <p className="text-xs text-gray-600">You may now send your payment directly to the seller</p>
                <div className="border-t border-gray-200 pt-1">
                  <h3 className="text-md font-bold text-gray-900 mb-1">Payment Breakdown</h3>
                  <p className="text-sm text-black">your tracking number will be securely generated as soon your order is finalized.</p>

                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 mt-4 focus:ring-0"
                  >
                    Process Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {!currentUser && showPasswordModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 w-full max-w-sm relative animate-fadeIn">            
            <XMarkIcon 
              className="h-5 w-5 absolute right-6 top-6 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors" 
              onClick={() => setShowPasswordModal(false)}
            />
            <h2 className="text-md text-gray-800 mt-4">To generate secured tracking number and link,</h2>
            <h2 className="text-xl font-semibold text-gray-800 mb-8">Add a Password</h2>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={passwordForm.password}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100/50 text-gray-900 placeholder-gray-500 focus:ring-0 focus:border-gray-200 transition-all duration-200"
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
                  className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100/50 text-gray-900 placeholder-gray-500 focus:ring-0 focus:border-gray-200 transition-all duration-200"
                  required
                  placeholder="Confirm Password"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:ring-0"
              >
                Confirm Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
