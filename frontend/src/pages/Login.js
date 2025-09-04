// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../utils/api";
import { testApiConnection, testLogin } from "../utils/testApi";
import "../styles/Auth.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCustomerCareLogin, setIsCustomerCareLogin] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (isCustomerCareLogin) {
      if (!userId || !password) {
        setMessage("Please fill in both User ID and Password");
        return;
      }
      console.log('Customer care login validation passed:', { userId, password });
    } else {
      if (!email || !password) {
        setMessage("Please fill in both Email and Password");
        return;
      }
      console.log('Regular login validation passed:', { email, password });
    }
    
    setIsLoading(true);
    setMessage(''); // Clear any previous messages
    
    try {
      const loginData = isCustomerCareLogin 
        ? { userId, password }
        : { email, password };
      
      console.log('=== LOGIN DEBUG ===');
      console.log('Login attempt with data:', loginData);
      console.log('Is customer care login:', isCustomerCareLogin);
      console.log('Form data - userId:', userId, 'email:', email, 'password:', password);
        
      const response = await loginUser(loginData);
      console.log('=== LOGIN RESPONSE ===');
      console.log('Full response:', response);
      console.log('Response success:', response.success);
      console.log('Response message:', response.message);
      console.log('Response user:', response.user);
      
      if (response.success) {
        console.log('Login successful, redirecting...');
        setMessage("Login successful!");
        
        // Get the user role and redirect to appropriate dashboard
        const userRole = response.user.role;
        console.log('User role (original):', userRole);
        const userRoleLower = userRole.toLowerCase();
        console.log('User role (lowercase):', userRoleLower);
        
        // Handle different role redirects
        if (userRoleLower === 'driver') {
          console.log('Redirecting to driver dashboard');
          navigate('/emergency/driver');
        } else if (userRoleLower === 'customercare') {
          console.log('Redirecting to customer care dashboard');
          navigate('/dashboard/customer-care');
        } else {
          console.log('Redirecting to general dashboard:', `/dashboard/${userRoleLower}`);
          navigate(`/dashboard/${userRoleLower}`);
        }
      } else {
        console.log('Login failed:', response.message);
        setMessage(response.message || "Login failed");
      }
    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Login error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      setMessage("Error logging in. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-background">
      <div className='container mx-auto px-4 h-full'>
        <div className='flex content-center items-center justify-end h-full w-full'>
          <div className='w-full lg:w-6/12 px-4' style={{ marginRight: '0', marginLeft: 'auto' }}>
            <div className='relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0'>
              <div className='rounded-t mb-0 px-6 py-6'>
                <div className='text-center mb-3'>
                  <h6 className='text-blueGray-500 text-sm font-bold'>
                    Sign in with
                  </h6>
                </div>
                <div className='btn-wrapper text-center'>
                  <button
                    className='bg-white active:bg-blueGray-50 text-blueGray-700 font-normal px-4 py-2 rounded outline-none focus:outline-none mr-2 mb-1 uppercase shadow hover:shadow-md inline-flex items-center font-bold text-xs ease-linear transition-all duration-150'
                    type='button'>
                    <img
                      src="/img/github.svg"
                      alt='...'
                      className='w-5 mr-1'
                    />
                    Github
                  </button>
                  <button
                    className='bg-white active:bg-blueGray-50 text-blueGray-700 font-normal px-4 py-2 rounded outline-none focus:outline-none mr-1 mb-1 uppercase shadow hover:shadow-md inline-flex items-center font-bold text-xs ease-linear transition-all duration-150'
                    type='button'>
                    <img
                      alt='...'
                      className='w-5 mr-1'
                      src="/img/google.svg"
                    />
                    Google
                  </button>
                </div>
                <hr className='mt-6 border-b-1 border-blueGray-300' />
              </div>
              <div className='flex-auto px-4 lg:px-10 py-3 pt-0'>
                <div className='text-blueGray-400 text-center mb-3 font-bold'>
                  <small>Or sign in with credentials</small>
                </div>
                
                {/* Customer Care Login Toggle */}
                <div className='text-center mb-4'>
                  <label className='inline-flex items-center cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={isCustomerCareLogin}
                      onChange={(e) => setIsCustomerCareLogin(e.target.checked)}
                      className='form-checkbox border-0 rounded text-blueGray-700 ml-1 w-5 h-5 ease-linear transition-all duration-150'
                    />
                    <span className='ml-2 text-sm font-semibold text-blueGray-600'>
                      Customer Care Officer Login
                    </span>
                  </label>
                </div>
                
                <form onSubmit={handleSubmit}>
                  {isCustomerCareLogin ? (
                    <div className='relative w-full mb-3'>
                      <label
                        className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                        htmlFor='userId'>
                        User ID
                      </label>
                      <input
                        type='text'
                        id='userId'
                        value={userId}
                        onChange={handleUserIdChange}
                        className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                        placeholder='Enter your User ID'
                        required
                      />
                    </div>
                  ) : (
                    <div className='relative w-full mb-3'>
                      <label
                        className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                        htmlFor='grid-password'>
                        Email
                      </label>
                      <input
                        type='email'
                        id='email'
                        value={email}
                        onChange={handleEmailChange}
                        className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                        placeholder='Email'
                        required
                      />
                    </div>
                  )}

                  <div className='relative w-full mb-3'>
                    <label
                      className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                      htmlFor='grid-password'>
                      Password
                    </label>
                    <input
                      type='password'
                      id='password'
                      value={password}
                      onChange={handlePasswordChange}
                      className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                      placeholder='Password'
                      required
                    />
                  </div>
                  
                  {!isCustomerCareLogin && (
                    <div className='mb-4'>
                      <label className='inline-flex items-center cursor-pointer'>
                        <input
                          id='customCheckLogin'
                          type='checkbox'
                          className='form-checkbox'
                        />
                        <span className='ml-2 text-sm font-semibold text-blueGray-600'>
                          Remember me
                        </span>
                      </label>
                    </div>
                  )}

                  <div className='text-center mt-6'>
                    <button
                      className='bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150'
                      type='submit'
                      disabled={isLoading}>
                      {isLoading ? "Signing In..." : "Sign In"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className='flex flex-wrap mt-6 relative'>
              <div className='w-1/2'>
                <Link
                  to="/forgot-password"
                  className='text-blueGray-200'>
                  <small>Forgot password?</small>
                </Link>
              </div>
              <div className='w-1/2 text-right'>
                <Link to="/signup" className='text-blueGray-200'>
                  <small>Create new account</small>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}>
          <p className={`message ${message.includes("success") ? "success" : "error"}`}>
            {message}
          </p>
        </div>
      )}
    </div>
  );
};

export default Login;
