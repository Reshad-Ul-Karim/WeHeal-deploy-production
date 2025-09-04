import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import '../styles/DoctorAvailability.css';

const DoctorAvailability = () => {
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctor/availability');
      if (response.data.success) {
        console.log('Fetched availability:', response.data.data);
        // Log the number of time slots for each day
        response.data.data.forEach(day => {
          console.log(`${day.dayOfWeek}: ${day.timeSlots.length} time slots`);
          if (day.timeSlots.length > 0) {
            console.log(`First slot: ${day.timeSlots[0].startTime} - ${day.timeSlots[0].endTime}`);
            console.log(`Last slot: ${day.timeSlots[day.timeSlots.length - 1].startTime} - ${day.timeSlots[day.timeSlots.length - 1].endTime}`);
          }
        });
        setAvailability(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch availability');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading availability');
    } finally {
      setLoading(false);
    }
  };

  const handleDayChange = (day) => {
    setSelectedDay(day);
  };

  const handleWorkingDayToggle = async (day) => {
    try {
      setSaving(true);
      const dayData = availability.find(a => a.dayOfWeek === day);
      
      const payload = {
        timeSlots: dayData.timeSlots,
        isWorkingDay: !dayData.isWorkingDay
      };
      
      const response = await api.put(`/doctor/availability/${day}`, payload);

      if (response.data.success) {
        setAvailability(prev => prev.map(a => 
          a.dayOfWeek === day ? response.data.data : a
        ));
        setError(null);
      } else {
        setError(response.data.message || 'Failed to update working day');
      }
    } catch (err) {
      console.error('Error updating working day:', err);
      setError(err.response?.data?.message || 'Error updating working day');
    } finally {
      setSaving(false);
    }
  };

  const handleSlotToggle = async (day, slotIndex) => {
    try {
      setSaving(true);
      const dayData = availability.find(a => a.dayOfWeek === day);
      const updatedTimeSlots = dayData.timeSlots.map((slot, index) => 
        index === slotIndex ? { ...slot, isAvailable: !slot.isAvailable } : slot
      );

      const payload = {
        timeSlots: updatedTimeSlots,
        isWorkingDay: dayData.isWorkingDay
      };
      
      const response = await api.put(`/doctor/availability/${day}`, payload);

      if (response.data.success) {
        setAvailability(prev => prev.map(a => 
          a.dayOfWeek === day ? response.data.data : a
        ));
        setError(null);
      } else {
        setError(response.data.message || 'Failed to update time slot');
      }
    } catch (err) {
      console.error('Error updating time slot:', err);
      setError(err.response?.data?.message || 'Error updating time slot');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const selectedDayData = availability.find(a => a.dayOfWeek === selectedDay);

  return (
    <div className="availability-container">
      <div className="availability-header">
        <h2>Manage Your Availability</h2>
        <button 
          className="refresh-btn"
          onClick={fetchAvailability}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      
      <div className="info-message">
        <p>⏰ Time slots now available from 00:00 (midnight) to 23:50 (11:50 PM)</p>
        <p>Each slot is 50 minutes with 10-minute breaks between appointments</p>
        <p>✅ All 24 time slots are now available for scheduling</p>
      </div>
      
      <div className="days-nav">
        {availability.map(day => (
          <button
            key={day.dayOfWeek}
            className={`day-button ${selectedDay === day.dayOfWeek ? 'active' : ''} ${!day.isWorkingDay ? 'non-working' : ''}`}
            onClick={() => handleDayChange(day.dayOfWeek)}
          >
            {day.dayOfWeek}
          </button>
        ))}
      </div>

      {selectedDayData && (
        <div className="day-schedule">
          <div className="day-header">
            <div className="day-info">
              <h3>{selectedDayData.dayOfWeek}</h3>
              <span className="slot-count">{selectedDayData.timeSlots.length} time slots available</span>
            </div>
            <label className="working-day-toggle">
              <input
                type="checkbox"
                checked={selectedDayData.isWorkingDay}
                onChange={() => handleWorkingDayToggle(selectedDayData.dayOfWeek)}
                disabled={saving}
              />
              Working Day
            </label>
          </div>

          <div className="time-slots">
            {selectedDayData.timeSlots.map((slot, index) => (
              <div 
                key={index}
                className={`time-slot ${slot.isAvailable ? 'available' : ''} ${saving ? 'disabled' : ''}`}
                onClick={() => !saving && handleSlotToggle(selectedDayData.dayOfWeek, index)}
              >
                <span className="time">{slot.startTime} - {slot.endTime}</span>
                <span className="status">{slot.isAvailable ? 'Available' : 'Unavailable'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAvailability; 