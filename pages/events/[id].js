import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { db } from '../../firebaseConfig';
import { doc, getDoc, collection, getDocs, setDoc } from 'firebase/firestore';
import axios from 'axios';
import './event.css';
import { IoMdClose } from "react-icons/io";

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
    const checkRegistrationStatus = async () => {
      const userPhoneNumber = localStorage.getItem('userPhoneNumber');
      if (userPhoneNumber && id) {
        // Fetch the registration status from Firebase
        const registeredUsersRef = doc(db, 'monthlymeet', id, 'registeredUsers', userPhoneNumber);
        const userDoc = await getDoc(registeredUsersRef);
  
        if (userDoc.exists()) {
          setIsLoggedIn(true);
          fetchEventDetails();
          fetchRegisteredUserCount();
          fetchUserName(userPhoneNumber);
        } else {
          // If not registered, clear storage and reset state
          localStorage.removeItem('userPhoneNumber');
          setIsLoggedIn(false);
          setPhoneNumber(''); // Clear the input field
        }
      }
    };
  
    checkRegistrationStatus();
  }, [id]);
  

  const clearSession = () => {
    localStorage.removeItem('userPhoneNumber');
    setIsLoggedIn(false);
    setPhoneNumber('');
  };

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

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  if (loading) {
    return (
      <div className="loader-container">
        <svg className="load" viewBox="25 25 50 50">
          <circle r="20" cy="50" cx="50"></circle>
        </svg>
      </div>
    );
  }

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
      <h2 className="eventName">to {eventDetails?.name || 'Event'}</h2>
    </div>
    <div className="eventDetails">
      <p>{eventTime}</p>
      <h2>{registeredUserCount}</h2>
      <p>Registered Orbiters</p>
    </div>
    <div className="zoomLinkContainer">
      {eventDetails?.zoomLink ? (
        <a href={eventDetails.zoomLink} target="_blank" rel="noopener noreferrer" className="zoomLink">
          <img src="/zoom-icon.png" alt="Zoom Link" width={30} />
          <span>Join Zoom Meet</span>
        </a>
      ) : (
        <span>No Zoom link available</span>
      )}
    </div>
    <div className="agenda">
      <button className="agendabutton" onClick={handleOpenModal}>View Agenda</button>
    </div>

    {showModal && (
      <div className="modal-overlay">
        <div className="modal-content">
          <button className="close-modal" onClick={handleCloseModal}>×</button>
          <h2>Agenda</h2>
          {eventDetails?.agenda ? (
            <div dangerouslySetInnerHTML={{ __html: eventDetails.agenda }}></div>
          ) : (
            <p>No agenda available.</p>
          )}
        </div>
      </div>
    )}
  </div>
);

    
};

export default EventLoginPage;
