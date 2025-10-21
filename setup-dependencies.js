#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Civit project dependencies...\n');

// Function to run commands
function runCommand(command, cwd = process.cwd()) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      shell: true 
    });
    console.log('✅ Command completed successfully\n');
  } catch (error) {
    console.error(`❌ Error running command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

// Install frontend dependencies
console.log('📦 Installing frontend dependencies...');
runCommand('npm install', './frontend');

// Install backend dependencies
console.log('📦 Installing backend dependencies...');
runCommand('npm install', './backend');

// Create uploads directory for backend
console.log('📁 Creating uploads directory...');
const uploadsDir = path.join(__dirname, 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Create .env files if they don't exist
console.log('🔧 Setting up environment files...');

const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
if (!fs.existsSync(frontendEnvPath)) {
  const frontendEnvContent = `REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAP_API_KEY=your_map_api_key_here`;
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log('✅ Created frontend/.env file');
}

const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(backendEnvPath)) {
  const backendEnvContent = `NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/civita
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:3000

# Optional: Cloudinary for image uploads
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret`;
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Created backend/.env file');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Update the .env files with your actual values');
console.log('2. Make sure MongoDB is running on your system');
console.log('3. Start the backend: cd backend && npm run dev');
console.log('4. Start the frontend: cd frontend && npm start');
console.log('\n🌐 The application will be available at:');
console.log('- Frontend: http://localhost:3000');
console.log('- Backend: http://localhost:5000');
