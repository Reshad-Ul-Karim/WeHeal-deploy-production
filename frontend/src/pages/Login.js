// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../utils/api";
import "../styles/Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const response = await loginUser(email, password);
      if (response.success) {
        setMessage("Login successful!");
        
        // Get the user role and redirect to appropriate dashboard
        const userRole = response.user.role.toLowerCase();
        
        // Handle different role redirects
        if (userRole === 'driver') {
          // Drivers go directly to emergency driver dashboard
          navigate('/emergency/driver');
        } else {
          // All other users go to their respective dashboards
          navigate(`/dashboard/${userRole}`);
        }
      } else {
        setMessage(response.message || "Login failed");
      }
    } catch (error) {
      setMessage("Error logging in. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-background">
      <div className='container mx-auto px-4 h-full'>
        <div className='flex content-center items-center justify-end h-full w-full'>
          <div className='w-full lg:w-4/12 px-4' style={{ marginRight: '0', marginLeft: 'auto' }}>
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
              <div className='flex-auto px-4 lg:px-10 py-10 pt-0'>
                <div className='text-blueGray-400 text-center mb-3 font-bold'>
                  <small>Or sign in with credentials</small>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className='relative w-full mb-3'>
                    <label
                      className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                      htmlFor='grid-password'>
                      Email
                    </label>
                    <input
                      type="email"
                      className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                      placeholder='Email'
                      value={email}
                      onChange={handleEmailChange}
                      required
                    />
                  </div>

                  <div className='relative w-full mb-3'>
                    <label
                      className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                      htmlFor='grid-password'>
                      Password
                    </label>
                    <input
                      type="password"
                      className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                      placeholder='Password'
                      value={password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div>
                    <label className='inline-flex items-center cursor-pointer'>
                      <input
                        id='customCheckLogin'
                        type='checkbox'
                        className='form-checkbox border-0 rounded text-blueGray-700 ml-1 w-5 h-5 ease-linear transition-all duration-150'
                      />
                      <span className='ml-2 text-sm font-semibold text-blueGray-600'>
                        Remember me
                      </span>
                    </label>
                  </div>

                  <div className='text-center mt-6'>
                    <button
                      className='bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150'
                      type='submit'
                      disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
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
