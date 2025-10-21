import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Categories from './pages/Categories';
import Issues from './pages/Issues';
import MyIssues from './pages/MyIssues';
import Map from './pages/Map';
import PrivateRoute from './components/PrivateRoute';
import RoleBasedRoute from './components/RoleBasedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/categories" 
                element={
                  <RoleBasedRoute allowedRoles={['admin']}>
                    <Categories />
                  </RoleBasedRoute>
                } 
              />
              <Route 
                path="/issues" 
                element={
                  <PrivateRoute>
                    <Issues />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/my-issues" 
                element={
                  <PrivateRoute>
                    <MyIssues />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/map" 
                element={
                  <PrivateRoute>
                    <Map />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
