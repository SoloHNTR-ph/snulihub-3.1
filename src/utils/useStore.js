import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import storeService from '../services/storeService';
import { productService } from '../services/productService';
import userService from '../services/userService';

export const useStore = (storeSlug) => {
  const [storeData, setStoreData] = useState(null);
  const [featuredProduct, setFeaturedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadStoreData = async () => {
      try {
        let currentStoreData = null;

        if (!storeSlug) {
          currentStoreData = {
            storeName: 'SnuliHub Store',
            storeSlug: 'snulihub'
          };
          setStoreData(currentStoreData);
        } else {
          // First try to find user by storeName
          const userQuerySnapshot = await userService.getUserByStoreName(storeSlug);
          if (userQuerySnapshot) {
            const userData = userQuerySnapshot.data();
            currentStoreData = {
              storeName: userData.storeName,
              storeSlug: userData.storeSlug || storeSlug,
              franchiseId: userData.id
            };
            setStoreData(currentStoreData);
          } else {
            // If not found by storeName, try to find store directly
            const store = await storeService.getStoreBySlug(storeSlug);
            if (store) {
              currentStoreData = store;
              setStoreData(currentStoreData);
              sessionStorage.setItem('currentStoreName', store.storeName);
            } else {
              console.log('Store not found:', storeSlug);
              setError('Store not found');
              return;
            }
          }
        }

        // Only fetch featured products if we have a valid store
        if (currentStoreData) {
          const featuredProducts = await productService.getFeaturedProducts(1);
          if (featuredProducts?.length > 0) {
            setFeaturedProduct(featuredProducts[0]);
          }
        }
      } catch (err) {
        console.error('Error loading store data:', err);
        setError(err.message || 'Error loading store data');
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [storeSlug, navigate]);

  return {
    storeData,
    featuredProduct,
    loading,
    error,
    setStoreData
  };
};
