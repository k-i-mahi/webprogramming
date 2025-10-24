import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import categoryService from '../services/categoryService';

const CategoryContext = createContext();

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategory must be used within CategoryProvider');
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoize fetchCategories to prevent recreation on every render
  const fetchCategories = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await categoryService.getCategories(params);

      setCategories(response.data);

      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Failed to fetch categories';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since it doesn't depend on any external values

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]); // Include fetchCategories in dependencies

  const getCategoryById = useCallback(
    (id) => {
      return categories.find((cat) => cat._id === id);
    },
    [categories],
  );

  const getCategoryByName = useCallback(
    (name) => {
      return categories.find((cat) => cat.name === name);
    },
    [categories],
  );

  const value = {
    categories,
    loading,
    error,
    fetchCategories,
    getCategoryById,
    getCategoryByName,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export default CategoryContext;
