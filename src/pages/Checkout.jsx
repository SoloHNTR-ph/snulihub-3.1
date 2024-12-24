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
import { Link } from 'react-router-dom';

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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    countryCode: '',
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
      
      // Create new user
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

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email';
      }
      if (!formData.primaryPhone.trim()) errors.primaryPhone = 'Primary phone is required';
    }
    
    if (step === 2) {
      if (!formData.address.trim()) errors.address = 'Address is required';
      if (!formData.city.trim()) errors.city = 'City is required';
      if (!formData.state.trim()) errors.state = 'State is required';
      if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required';
      if (!formData.country) errors.country = 'Country is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const steps = [
    { id: 1, title: 'Contact Information' },
    { id: 2, title: 'Shipping Details' }
  ];

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
      <div className="absolute top-4 left-4">
        <Link to={`/store`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          <span>← Back to Store</span>
        </Link>
      </div>
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

          {/* Form Section */}
          <div className="fade-in-left">
            <form onSubmit={handleSubmit} className="backdrop-blur-lg bg-white/90 p-6 rounded-xl shadow-xl border border-gray-100">
              <div className="border-b border-gray-200 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Order Confirmation</h2>
                <p className="text-sm text-gray-500 mt-1">Please complete all required fields</p>
              </div>
              
              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex justify-center items-center">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                        currentStep >= step.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100'
                      }`}>
                        {step.id}
                      </div>
                      <div className={`ml-2 text-sm font-medium transition-all duration-200 ${
                        currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`w-16 h-0.5 mx-2 rounded transition-all duration-200 ${
                          currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {currentStep === 1 && (
                <div className="space-y-6 fade-in">
                  <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            name="firstName"
                            placeholder="First Name"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${formErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required
                          />
                          {formErrors.firstName && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.firstName}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            name="lastName"
                            placeholder="Last Name"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${formErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required
                          />
                          {formErrors.lastName && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.lastName}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <input
                          type="email"
                          name="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          required
                        />
                        {formErrors.email && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="tel"
                            name="primaryPhone"
                            placeholder="Primary Phone"
                            value={formData.primaryPhone}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${formErrors.primaryPhone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required
                          />
                          {formErrors.primaryPhone && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.primaryPhone}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="tel"
                            name="secondaryPhone"
                            placeholder="Alternative Phone (Optional)"
                            value={formData.secondaryPhone}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 fade-in">
                  <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Details</h3>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          name="address"
                          placeholder="Address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border ${formErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          required
                        />
                        {formErrors.address && (
                          <p className="mt-1 text-sm text-red-500">{formErrors.address}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            name="city"
                            placeholder="City"
                            value={formData.city}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${formErrors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required
                          />
                          {formErrors.city && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.city}</p>
                          )}
                        </div>
                        <div>
                          <input
                            type="text"
                            name="state"
                            placeholder="State"
                            value={formData.state}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${formErrors.state ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required
                          />
                          {formErrors.state && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.state}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            name="zipCode"
                            placeholder="ZIP Code"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border ${formErrors.zipCode ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            required
                          />
                          {formErrors.zipCode && (
                            <p className="mt-1 text-sm text-red-500">{formErrors.zipCode}</p>
                          )}
                        </div>
                        <div>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                              className={`w-full px-3 py-2 border ${formErrors.country ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex items-center justify-between`}
                            >
                              {formData.country ? (
                                <div className="flex items-center gap-2">
                                  <ReactCountryFlag
                                    countryCode={countries.find(c => c.name === formData.country)?.code || 'US'}
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
                            {formErrors.country && (
                              <p className="mt-1 text-sm text-red-500">{formErrors.country}</p>
                            )}
                            {showCountryDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                                <div className="p-1">
                                  {countries.map((country) => (
                                    <button
                                      key={country.code}
                                      type="button"
                                      onClick={() => {
                                        handleInputChange({
                                          target: { name: 'country', value: country.name }
                                        });
                                        handleInputChange({
                                          target: { name: 'countryCode', value: country.code }
                                        });
                                        setShowCountryDropdown(false);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 rounded-md"
                                    >
                                      <ReactCountryFlag
                                        countryCode={country.code}
                                        svg
                                        style={{
                                          width: '20px',
                                          height: '15px',
                                        }}
                                      />
                                      {country.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <textarea
                        name="sellerMessage"
                        placeholder="Message to Seller (Optional)"
                        value={formData.sellerMessage}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows="3"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-between items-center border-t border-gray-100 pt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      prevStep();
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                  >
                    ← Previous Step
                  </button>
                )}
                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      nextStep();
                    }}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 ml-auto"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 ml-auto"
                  >
                    Process Order
                  </button>
                )}
              </div>
              
              {formErrors.submit && (
                <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
                  {formErrors.submit}
                </div>
              )}
            </form>
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
