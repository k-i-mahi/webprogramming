# Civit - Local Problem Reporting System

A modern, full-stack web application for local community problem reporting and management.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

### Installation

1. **Clone and setup the project:**
   ```bash
   git clone <your-repo-url>
   cd civit
   node setup-dependencies.js
   ```

2. **Configure environment variables:**
   
   **Backend (.env):**
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/civita
   JWT_SECRET=your_secure_jwt_secret_here
   CLIENT_URL=http://localhost:3000
   ```

   **Frontend (.env):**
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_MAP_API_KEY=your_map_api_key_here
   ```

3. **Start the application:**
   
   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm start
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🛠️ Features

### For Residents
- **Report Issues**: Submit community problems with photos and location
- **Track Progress**: Monitor the status of reported issues
- **View Map**: See all issues on an interactive map
- **Categories**: Organize issues by type (Infrastructure, Safety, Environment, etc.)

### For Authorities
- **Issue Management**: View, assign, and update issue status
- **User Management**: Manage residents and other authorities
- **Analytics**: View issue statistics and trends
- **Location-based**: Filter issues by geographic area

### For Admins
- **Full Control**: Complete system administration
- **Category Management**: Create and manage issue categories
- **User Roles**: Assign roles to users
- **System Settings**: Configure application settings

## 🏗️ Architecture

### Backend (Node.js + Express)
- **RESTful API** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT Authentication** for secure access
- **Role-based Access Control** (Resident, Authority, Admin)
- **File Upload** support for images
- **Geospatial Queries** for location-based features

### Frontend (React)
- **Modern React** with hooks and functional components
- **React Router** for navigation
- **Axios** for API communication
- **Leaflet Maps** for interactive mapping
- **Responsive Design** with Tailwind CSS
- **Real-time Updates** for issue status

## 📁 Project Structure

```
civit/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Authentication & validation
│   ├── uploads/        # File uploads
│   └── server.js       # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── context/    # React context
│   │   └── App.js      # Main app component
│   └── public/         # Static assets
└── README.md
```

## 🔧 Development

### Available Scripts

**Backend:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

**Frontend:**
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests

### API Endpoints

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

**Issues:**
- `GET /api/issues` - Get all issues (with filters)
- `POST /api/issues` - Create new issue
- `PUT /api/issues/:id` - Update issue
- `DELETE /api/issues/:id` - Delete issue
- `GET /api/issues/nearby` - Get nearby issues

**Categories:**
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in backend/.env

2. **Port Already in Use:**
   - Change PORT in backend/.env
   - Update REACT_APP_API_URL in frontend/.env

3. **CORS Issues:**
   - Check CLIENT_URL in backend/.env matches frontend URL

4. **File Upload Issues:**
   - Ensure uploads directory exists in backend/
   - Check file size limits in multer configuration

### Getting Help

1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check MongoDB connection

## 🎨 Customization

### Styling
- Modify `frontend/src/index.css` for global styles
- Update `frontend/src/pages.css` for page-specific styles
- Use Tailwind CSS classes for component styling

### Adding Features
1. Create new models in `backend/models/`
2. Add controllers in `backend/controllers/`
3. Define routes in `backend/routes/`
4. Create frontend components in `frontend/src/components/`
5. Add pages in `frontend/src/pages/`

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy coding! 🎉**
