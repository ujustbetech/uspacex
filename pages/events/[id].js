import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import axios from 'axios';

const EventLoginPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);
  const [registeredUserCount, setRegisteredUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check registration status on page load
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      const userPhoneNumber = localStorage.getItem('userPhoneNumber');
      if (userPhoneNumber && id) {
        const registeredUserRef = doc(db, 'monthlymeet', id, 'registeredUsers', userPhoneNumber);
        const userDoc = await getDoc(registeredUserRef);
        
        if (userDoc.exists()) {
          setIsLoggedIn(true);
          fetchEventDetails();
          fetchRegisteredUserCount();
          fetchUserName(userPhoneNumber);
        } else {
          // If user is not registered for this event, clear the localStorage and reset
          localStorage.removeItem('userPhoneNumber');
          setIsLoggedIn(false);
          setPhoneNumber('');
        }
      }
      setLoading(false);
    };

    checkRegistrationStatus();
  }, [id]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://api.ujustbe.com/mobile-check', {
        MobileNo: phoneNumber,
      });

      if (response.data.message[0].type === 'SUCCESS') {
        localStorage.setItem('userPhoneNumber', phoneNumber);
        setIsLoggedIn(true);
        await registerUserForEvent(phoneNumber);
        fetchEventDetails();
        fetchRegisteredUserCount();
        fetchUserName(phoneNumber);
      } else {
        setError('Phone number not registered.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  const fetchUserName = async (phoneNumber) => {
    const userRef = doc(db, 'userdetails', phoneNumber);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      setUserName(userDoc.data()[" Name"]);
    } else {
      setError('User not found.');
    }
  };

  const registerUserForEvent = async (phoneNumber) => {
    if (id) {
      const registeredUsersRef = collection(db, 'monthlymeet', id, 'registeredUsers');
      const newUserRef = doc(registeredUsersRef, phoneNumber);
      await setDoc(newUserRef, {
        phoneNumber,
        registeredAt: new Date(),
      });
    }
  };

  const fetchEventDetails = async () => {
    if (id) {
      const eventRef = doc(db, 'monthlymeet', id);
      const eventDoc = await getDoc(eventRef);
      if (eventDoc.exists()) {
        setEventDetails(eventDoc.data());
      } else {
        setError('No event found.');
      }
    }
  };

  const fetchRegisteredUserCount = async () => {
    if (id) {
      const registeredUsersRef = collection(db, 'monthlymeet', id, 'registeredUsers');
      const userSnapshot = await getDocs(registeredUsersRef);
      setRegisteredUserCount(userSnapshot.size);
    }
  };

  // Render login form if user is not logged in
  if (!isLoggedIn) {
    return (
      <div className='login-container'>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Display event details if user is logged in and registered
  return (
    <div className="event-container">
      <h1>Welcome, {userName}</h1>
      <h2>Event: {eventDetails?.name}</h2>
      <p>Registered Orbiters: {registeredUserCount}</p>
      <a href={eventDetails?.zoomLink} target="_blank">Join Zoom Meet</a>
    </div>
  );
};

export default EventLoginPage;
