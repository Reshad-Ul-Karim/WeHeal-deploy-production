import { Prescription } from '../models/prescriptionModel.js';
import { Appointment } from '../models/appointmentModel.js';
import { User } from '../models/userModel.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Create a new prescription
export const createPrescription = async (req, res) => {
  try {
    console.log('=== CREATE PRESCRIPTION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request user:', req.user);
    console.log('Request headers:', req.headers);
    
    const {
      patientId,
      appointmentId,
      patientName,
      symptoms,
      medications,
      recommendedTests,
      nextAppointment,
      extraInstructions
    } = req.body;

    const doctorId = req.user._id;
    const doctorName = req.user.name;
    
    console.log('Extracted data:', {
      patientId,
      appointmentId,
      patientName,
      symptoms,
      medications,
      recommendedTests,
      nextAppointment,
      extraInstructions
    });
    
    console.log('Doctor info:', {
      doctorId,
      doctorName
    });
    
    console.log('User attempting to create prescription:', {
      userId: req.user._id,
      userName: req.user.name,
      userRole: req.user.role
    });

    // Validate appointment exists and belongs to this doctor
    console.log('Validating appointment:', appointmentId);
    const appointment = await Appointment.findById(appointmentId);
    console.log('Appointment found:', appointment);
    
    if (!appointment) {
      console.log('Appointment not found for ID:', appointmentId);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    console.log('Appointment details:', {
      appointmentId: appointment._id,
      doctorId: appointment.doctorId,
      patientId: appointment.patientId,
      appointmentDate: appointment.appointmentDate
    });

    if (appointment.doctorId.toString() !== doctorId.toString()) {
      console.log('Doctor ID mismatch:', {
        appointmentDoctorId: appointment.doctorId.toString(),
        currentDoctorId: doctorId.toString(),
        match: appointment.doctorId.toString() === doctorId.toString()
      });
      return res.status(403).json({
        success: false,
        message: 'You can only create prescriptions for your appointments'
      });
    }
    
    console.log('Appointment validation passed');

    // Check if prescription already exists for this appointment
    console.log('Checking for existing prescription for appointment:', appointmentId);
    const existingPrescription = await Prescription.findOne({ appointmentId });
    console.log('Existing prescription found:', existingPrescription);
    
    if (existingPrescription) {
      console.log('Prescription already exists for this appointment');
      return res.status(400).json({
        success: false,
        message: 'Prescription already exists for this appointment'
      });
    }
    
    console.log('No existing prescription found, proceeding with creation');

    // Validate medications array
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      console.log('Medications validation failed:', {
        medications,
        isArray: Array.isArray(medications),
        length: medications?.length
      });
      return res.status(400).json({
        success: false,
        message: 'At least one medication is required'
      });
    }

    // Validate each medication has required fields
    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      console.log(`Validating medication ${i + 1}:`, med);
      
      if (!med.name || !med.dosage || !med.frequency || !med.duration) {
        console.log(`Medication ${i + 1} validation failed:`, {
          hasName: !!med.name,
          hasDosage: !!med.dosage,
          hasFrequency: !!med.frequency,
          hasDuration: !!med.duration,
          medication: med
        });
        return res.status(400).json({
          success: false,
          message: `Medication ${i + 1} is missing required fields (name, dosage, frequency, duration)`
        });
      }
    }
    
    console.log('All validations passed successfully');

    console.log('Creating prescription with data:', {
      patientId,
      doctorId,
      appointmentId,
      patientName,
      doctorName,
      symptoms,
      medications: medications.length,
      recommendedTests,
      nextAppointment,
      extraInstructions
    });

    const prescriptionData = {
      patientId,
      doctorId,
      appointmentId,
      patientName,
      doctorName,
      symptoms,
      medications,
      recommendedTests,
      nextAppointment: nextAppointment ? new Date(nextAppointment) : null,
      extraInstructions
    };
    
    console.log('Prescription data object:', prescriptionData);

    const prescription = new Prescription(prescriptionData);
    console.log('Prescription model instance created:', prescription);

    console.log('Prescription object created, attempting to save...');
    console.log('Prescription schema validation before save...');
    
    // Validate the prescription before saving
    const validationError = prescription.validateSync();
    if (validationError) {
      console.error('Prescription validation error before save:', validationError);
      console.error('Validation error details:', {
        name: validationError.name,
        message: validationError.message,
        errors: validationError.errors
      });
      return res.status(400).json({
        success: false,
        message: 'Prescription validation failed',
        error: Object.values(validationError.errors).map(err => err.message).join(', ')
      });
    }
    
    console.log('Prescription validation passed, proceeding with save...');
    await prescription.save();
    console.log('Prescription saved successfully');

    // Update appointment status to indicate prescription created
    await Appointment.findByIdAndUpdate(appointmentId, {
      prescriptionCreated: true
    });

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: prescription
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    
    // Handle specific database errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    
    if (error.name === 'MongoError' && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Prescription ID already exists, please try again'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating prescription',
      error: error.message
    });
  }
};

// Get all prescriptions for a doctor
export const getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    let query = { doctorId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'name email phone')
      .populate('appointmentId', 'appointmentDate appointmentTime')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPrescriptions = await Prescription.countDocuments(query);
    const totalPages = Math.ceil(totalPrescriptions / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPrescriptions,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescriptions',
      error: error.message
    });
  }
};

// Get all prescriptions for a patient
export const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    let query = { patientId };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const prescriptions = await Prescription.find(query)
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'appointmentDate appointmentTime')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPrescriptions = await Prescription.countDocuments(query);
    const totalPages = Math.ceil(totalPrescriptions / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPrescriptions,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescriptions',
      error: error.message
    });
  }
};

// Get a single prescription by ID
export const getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const prescription = await Prescription.findById(id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'appointmentDate appointmentTime');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if user has access to this prescription
    if (userRole === 'Doctor' && prescription.doctorId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own prescriptions'
      });
    }

    if (userRole === 'Patient' && prescription.patientId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own prescriptions'
      });
    }

    res.status(200).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescription',
      error: error.message
    });
  }
};

// Update a prescription
export const updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;
    const updateData = req.body;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    if (prescription.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own prescriptions'
      });
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('patientId', 'name email phone')
     .populate('doctorId', 'name specialization')
     .populate('appointmentId', 'appointmentDate appointmentTime');

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: updatedPrescription
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating prescription',
      error: error.message
    });
  }
};

// Delete a prescription
export const deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user._id;

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    if (prescription.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own prescriptions'
      });
    }

    await Prescription.findByIdAndDelete(id);

    // Update appointment status
    await Appointment.findByIdAndUpdate(prescription.appointmentId, {
      prescriptionCreated: false
    });

    res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting prescription',
      error: error.message
    });
  }
};

// Generate PDF for a prescription
export const generatePrescriptionPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const prescription = await Prescription.findById(id)
      .populate('patientId', 'name email phone')
      .populate('doctorId', 'name specialization')
      .populate('appointmentId', 'appointmentDate appointmentTime');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Check if user has access to this prescription
    if (userRole === 'Doctor' && prescription.doctorId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own prescriptions'
      });
    }

    if (userRole === 'Patient' && prescription.patientId._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own prescriptions'
      });
    }

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription.prescriptionId}.pdf`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(24).text('Medical Prescription', { align: 'center' });
    doc.moveDown();

    // Header information
    doc.fontSize(12);
    doc.text(`Prescription ID: ${prescription.prescriptionId}`);
    doc.text(`Date: ${prescription.date.toLocaleDateString()}`);
    doc.moveDown();

    // Patient and Doctor info
    doc.fontSize(14).text('Patient Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${prescription.patientName}`);
    doc.text(`Email: ${prescription.patientId.email}`);
    doc.text(`Phone: ${prescription.patientId.phone}`);
    doc.moveDown();

    doc.fontSize(14).text('Doctor Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${prescription.doctorName}`);
    doc.text(`Specialization: ${prescription.doctorId.specialization}`);
    doc.moveDown();

    // Symptoms
    if (prescription.symptoms) {
      doc.fontSize(14).text('Symptoms', { underline: true });
      doc.fontSize(12);
      doc.text(prescription.symptoms);
      doc.moveDown();
    }

    // Medications
    if (prescription.medications && prescription.medications.length > 0) {
      doc.fontSize(14).text('Medications', { underline: true });
      doc.fontSize(12);
      prescription.medications.forEach((med, index) => {
        doc.text(`${index + 1}. ${med.name}`);
        doc.text(`   Dosage: ${med.dosage}`);
        doc.text(`   Frequency: ${med.frequency}`);
        doc.text(`   Duration: ${med.duration}`);
        if (med.comments) {
          doc.text(`   Comments: ${med.comments}`);
        }
        doc.moveDown(0.5);
      });
    }

    // Recommended Tests
    if (prescription.recommendedTests) {
      doc.fontSize(14).text('Recommended Tests', { underline: true });
      doc.fontSize(12);
      doc.text(prescription.recommendedTests);
      doc.moveDown();
    }

    // Next Appointment
    if (prescription.nextAppointment) {
      doc.fontSize(14).text('Next Appointment', { underline: true });
      doc.fontSize(12);
      doc.text(`Date: ${prescription.nextAppointment.toLocaleDateString()}`);
      doc.moveDown();
    }

    // Extra Instructions
    if (prescription.extraInstructions) {
      doc.fontSize(14).text('Extra Instructions', { underline: true });
      doc.fontSize(12);
      doc.text(prescription.extraInstructions);
      doc.moveDown();
    }

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text('This prescription is valid for the specified duration only.', { align: 'center' });
    doc.text('Please consult your doctor before making any changes to the medication.', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Error generating prescription PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating PDF',
      error: error.message
    });
  }
};
