import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UserIcon, TruckIcon } from '@heroicons/react/24/outline';

const SignIn = () => {
  const navigate = useNavigate();

  const handlePatientClick = () => {
    navigate('/patient/signin');
  };

  const handleDriverClick = () => {
    // Directly navigate to driver dashboard
    navigate('/driver/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-primary-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Emergency</h1>
          <p className="text-gray-600">Choose your role to continue</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handlePatientClick}
            className="w-full flex items-center justify-center space-x-3 bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <UserIcon className="w-6 h-6" />
            <span>Continue as Patient</span>
          </button>

          <button
            onClick={handleDriverClick}
            className="w-full flex items-center justify-center space-x-3 bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-900 transition-colors"
          >
            <TruckIcon className="w-6 h-6" />
            <span>Continue as Driver</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn; 