import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser } from "../utils/api";
import "../styles/Auth.css";
import { MEDICAL_SPECIALIZATIONS } from "../constants/specializations";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "Patient",
    doctorDetails: {
      specialization: "",
      yearsOfExperience: 0,
      consultationFee: 0,
      education: [{ degree: "", institution: "", year: "" }],
    },
    driverDetails: {
      vehicleType: "standard",
      vehicleNumber: "",
      licenseNumber: "",
      yearsOfExperience: 0,
      location: "",
    },
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("doctorDetails.")) {
      const field = name.split(".")[1];
      setFormData((prevData) => ({
        ...prevData,
        doctorDetails: {
          ...prevData.doctorDetails,
          [field]: value,
        },
      }));
    } else if (name.startsWith("driverDetails.")) {
      const field = name.split(".")[1];
      setFormData((prevData) => ({
        ...prevData,
        driverDetails: {
          ...prevData.driverDetails,
          [field]: value,
        },
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Prepare data based on role
      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: formData.role
      };

      // Only include role-specific details if the role requires them
      if (formData.role === "Doctor") {
        submitData.doctorDetails = formData.doctorDetails;
      } else if (formData.role === "Driver") {
        submitData.driverDetails = formData.driverDetails;
      }

      console.log('Submitting data:', submitData);
      const response = await signupUser(submitData);
      if (response.success) {
        setMessage("Account created successfully! Please check your email for verification.");
        setTimeout(() => {
          navigate("/verify-email");
        }, 2000);
      } else {
        setMessage(response.message || "Failed to create account");
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.message || "Error creating account. Please try again later.";
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-background">
      <div className='container mx-auto px-4 h-full'>
        <div className='flex content-center items-center justify-center h-full'>
          <div className='w-full lg:w-6/12 px-4'>
            <div className='relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0'>
              <div className='rounded-t mb-0 px-6 py-6'>
                <div className='text-center mb-3'>
                  <h6 className='text-blueGray-500 text-sm font-bold'>
                    Sign up with
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
                  <small>Or sign up with credentials</small>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className='relative w-full mb-3'>
                    <label
                      className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                      htmlFor='name'>
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                      placeholder='Full Name'
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className='relative w-full mb-3'>
                    <label
                      className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                      htmlFor='email'>
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                      placeholder='Email'
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className='relative w-full mb-3'>
                    <label
                      className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                      htmlFor='password'>
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                      placeholder='Password'
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className='relative w-full mb-3'>
                    <label
                      className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                      htmlFor='phone'>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                      placeholder='Phone Number'
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className='relative w-full mb-3'>
                    <label
                      className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                      htmlFor='role'>
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                      value={formData.role}
                      onChange={handleChange}
                      required
                    >
                      <option value="Patient">Patient</option>
                      <option value="Doctor">Doctor</option>
                      <option value="Driver">Driver</option>
                      <option value="Admin">Admin</option>
                      <option value="ClinicStaff">Clinic Staff</option>
                      <option value="Nurse">Nurse</option>
                    </select>
                  </div>

                  {formData.role === "Doctor" && (
                    <>
                      <div className='relative w-full mb-3'>
                        <label
                          className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                          htmlFor='specialization'>
                          Specialization
                        </label>
                        <select
                          id="specialization"
                          name="doctorDetails.specialization"
                          className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                          value={formData.doctorDetails.specialization}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Specialization</option>
                          {MEDICAL_SPECIALIZATIONS.map((spec) => (
                            <option key={spec} value={spec}>
                              {spec}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className='relative w-full mb-3'>
                        <label
                          className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                          htmlFor='yearsOfExperience'>
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          id="yearsOfExperience"
                          name="doctorDetails.yearsOfExperience"
                          className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                          placeholder='Years of Experience'
                          value={formData.doctorDetails.yearsOfExperience}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className='relative w-full mb-3'>
                        <label
                          className='block uppercase text-blueGray-600 text-xs font-bold mb-2'
                          htmlFor='consultationFee'>
                          Consultation Fee
                        </label>
                        <input
                          type="number"
                          id="consultationFee"
                          name="doctorDetails.consultationFee"
                          className='border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150'
                          placeholder='Consultation Fee'
                          value={formData.doctorDetails.consultationFee}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className='text-center mt-6'>
                    <button
                      className='bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150'
                      type='submit'
                      disabled={isLoading}>
                      {isLoading ? "Creating Account..." : "Sign Up"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className='flex flex-wrap mt-6 relative'>
              <div className='w-full text-center'>
                <span className='text-blueGray-200'>Already have an account? </span>
                <Link to="/login" className='text-blueGray-200'>
                  <small>Sign in</small>
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

export default Signup;
