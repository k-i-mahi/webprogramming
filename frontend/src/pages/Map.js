import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import categoryService from '../services/categoryService';
import MapView from '../components/MapView';
import Feedback from '../components/Feedback';
import './Map.css';

const Map = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Load categories error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="map-page">
        <Feedback type="loading" fullPage={true} />
      </div>
    );
  }

  return (
    <div className="map-page">
      <MapView categories={categories} />
    </div>
  );
};

export default Map;
