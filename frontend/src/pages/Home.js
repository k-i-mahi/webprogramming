import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span>🎉</span>
            <span>Welcome to the Future</span>
          </div>

          <h1 className="hero-title">
            Welcome to <span className="gradient-text">Civita</span>
          </h1>

          <p className="hero-subtitle">
            A modern community management platform built with cutting-edge
            technology. Connect, collaborate, and create meaningful change in
            your community.
          </p>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Issues Resolved</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Communities</div>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="hero-actions">
              <div className="welcome-message">
                <span className="wave">👋</span>
                <span>
                  Welcome back, <strong>{user?.name}</strong>!
                </span>
              </div>
              <div className="action-buttons">
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  <span>🏠</span>
                  Go to Dashboard
                </Link>
                <Link to="/profile" className="btn btn-secondary btn-lg">
                  <span>👤</span>
                  View Profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                <span>🚀</span>
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                <span>🔐</span>
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Animated Background Elements */}
        <div className="hero-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Why Choose Civita?</h2>
          <p className="section-subtitle">
            Everything you need to manage and improve your community
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3 className="feature-title">Report Issues</h3>
            <p className="feature-description">
              Easily report community issues with photos, location, and detailed
              descriptions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3 className="feature-title">Community Driven</h3>
            <p className="feature-description">
              Connect with neighbors and work together to solve local problems.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Fast Resolution</h3>
            <p className="feature-description">
              Track issue progress in real-time and get updates instantly.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">Secure & Private</h3>
            <p className="feature-description">
              Your data is protected with enterprise-grade security measures.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Analytics Dashboard</h3>
            <p className="feature-description">
              Visualize community trends and track improvement metrics.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3 className="feature-title">Location-Based</h3>
            <p className="feature-description">
              Find and resolve issues based on geographical proximity.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="process-section">
        <div className="section-header">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Get started in three simple steps</p>
        </div>

        <div className="process-steps">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3 className="step-title">Sign Up</h3>
              <p className="step-description">
                Create your free account in seconds. No credit card required.
              </p>
            </div>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3 className="step-title">Report Issues</h3>
              <p className="step-description">
                Identify and report community issues with ease.
              </p>
            </div>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3 className="step-title">Track Progress</h3>
              <p className="step-description">
                Monitor resolution status and community impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="roles-section">
        <div className="section-header">
          <h2 className="section-title">Multiple User Roles</h2>
          <p className="section-subtitle">
            Designed for everyone in the community
          </p>
        </div>

        <div className="roles-grid">
          <div className="role-card">
            <div className="role-icon">👨‍👩‍👧‍👦</div>
            <h3 className="role-title">Residents</h3>
            <ul className="role-features">
              <li>✓ Report community issues</li>
              <li>✓ Track issue status</li>
              <li>✓ Add comments and updates</li>
              <li>✓ View community activity</li>
            </ul>
          </div>

          <div className="role-card role-card-primary">
            <div className="role-badge">Most Popular</div>
            <div className="role-icon">🏛️</div>
            <h3 className="role-title">Authority</h3>
            <ul className="role-features">
              <li>✓ Manage assigned issues</li>
              <li>✓ Update resolution status</li>
              <li>✓ Communicate with residents</li>
              <li>✓ Access analytics</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-icon">👑</div>
            <h3 className="role-title">Admin</h3>
            <ul className="role-features">
              <li>✓ Full system access</li>
              <li>✓ Assign issues to authorities</li>
              <li>✓ Manage users and roles</li>
              <li>✓ Generate reports</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="cta-section">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-subtitle">
              Join thousands of communities already using Civita
            </p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">
                Sign Up Now
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Learn More
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Civita</h4>
            <p>Building better communities together.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link to="/about">About</Link>
            <Link to="/features">Features</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Civita. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
