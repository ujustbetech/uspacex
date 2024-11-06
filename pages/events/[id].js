import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db, auth } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import axios from 'axios';
import './event.css';
import { onAuthStateChanged } from 'firebase/auth';  // Import Firebase Auth state change listener

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
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      // Check if the user is authenticated using sessionStorage (it will clear when the browser is closed)
      const storedPhoneNumber = sessionStorage.getItem('authenticatedPhoneNumber');

      if (storedPhoneNumber) {
        // Use Firebase to check if the phone number is valid
        const userRef = doc(db, 'userdetails', storedPhoneNumber);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          // Phone number is valid, continue with event logic
          setPhoneNumber(storedPhoneNumber);
          setIsLoggedIn(true);
          fetchEventDetails();
          fetchRegisteredUserCount();
          fetchUserName(storedPhoneNumber);
        } else {
          // Invalid phone number, clear sessionStorage and force re-authentication
          sessionStorage.removeItem('authenticatedPhoneNumber');
          setIsLoggedIn(false);
          setPhoneNumber('');
        }
      } else {
        setIsLoggedIn(false);
        setPhoneNumber('');
      }
    };

    checkAuthentication();
  }, [id]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('https://api.ujustbe.com/mobile-check', {
        MobileNo: phoneNumber,
      });

      if (response.data.message[0].type === 'SUCCESS') {
        // Simulate Firebase Auth login with phone number
        const userCredential = await auth.signInWithPhoneNumber(phoneNumber);
        const user = userCredential.user;

        // Store phone number under custom key in sessionStorage after successful login
        sessionStorage.setItem('authenticatedPhoneNumber', phoneNumber);

        setIsLoggedIn(true);

        await registerUserForEvent(phoneNumber);
        fetchEventDetails();
        fetchRegisteredUserCount();
        fetchUserName(phoneNumber);
      } else {
        setError('Phone number not registered.');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('Login failed. Please try again.');
    }
  };

  const fetchUserName = async (phoneNumber) => {
    const userRef = doc(db, 'userdetails', phoneNumber);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const name = userDoc.data()[" Name"];
      setUserName(name);
    } else {
      setError('User not found.');
    }
  };

  const registerUserForEvent = async (phoneNumber) => {
    if (id) {
      const registeredUsersRef = collection(db, 'monthlymeet', id, 'registeredUsers');
      const newUserRef = doc(registeredUsersRef, phoneNumber);

      try {
        await setDoc(newUserRef, {
          phoneNumber: phoneNumber,
          registeredAt: new Date(),
        });
      } catch (err) {
        console.error('Error registering user in Firebase:', err);
      }
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
      setLoading(false);
    }
  };

  const fetchRegisteredUserCount = async () => {
    if (id) {
      const registeredUsersRef = collection(db, 'monthlymeet', id, 'registeredUsers');
      const userSnapshot = await getDocs(registeredUsersRef);
      setRegisteredUserCount(userSnapshot.size);
    }
  };

  // Modal handlers
  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (!isLoggedIn) {
    return (
      <div className='mainContainer'>
        <div className='logosContainer'>
          <img src="/ujustlogo.png" alt="Logo" className="logo" />
        </div>
        <div className="signin">
          <div className="loginInput">
            <div className='logoContainer'>
              <img src="/logo.png" alt="Logo" className="logos" />
            </div>
            <form onSubmit={handleLogin}>
              <ul>
                <li>
                  <input
                    type="text"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </li>
                <li>
                  <button className="login" type="submit">Login</button>
                </li>
              </ul>
            </form>
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loader-container">
        <svg className="load" viewBox="25 25 50 50">
          <circle r="20" cy="50" cx="50"></circle>
        </svg>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  const eventTime = eventDetails?.time?.seconds
  ? new Date(eventDetails.time.seconds * 1000).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  : "Invalid time";

  return (
    <div className="mainContainer">
      <div className='UserDetails'>
        <h1 className="welcomeText">Welcome {userName || 'User'}</h1>
        <h2 className="eventName">to {eventDetails.name}</h2>
      </div>
      <div className="eventDetails">
        <p> {eventTime}</p>
        <h2>{registeredUserCount}</h2>
        <p>Registered Orbiters</p>
      </div>
      <div className="zoomLinkContainer">
        <a href={eventDetails.zoomLink} target="_blank" rel="noopener noreferrer" className="zoomLink">Join Zoom</a>
      </div>
      <div className="agendaContainer">
        <button className="agendaButton" onClick={handleOpenModal}>View Agenda</button>
      </div>
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-btn" onClick={handleCloseModal}>×</span>
            <h2>{eventDetails.agenda}</h2>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventLoginPage;
