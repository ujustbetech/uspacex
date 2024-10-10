import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useRouter } from 'next/router';



const ManageEvents = () => {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch all events from the 'monthlymeet' collection
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const eventCollection = collection(db, 'monthlymeet');
                const eventSnapshot = await getDocs(eventCollection);
                const eventList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEvents(eventList);
            } catch (error) {
                console.error('Error fetching events:', error);
                setError('Error fetching events. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const handleViewUsers = (eventId) => {
        router.push(`/RegisteredUser/${eventId}`);
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            await deleteDoc(doc(db, 'monthlymeet', eventId));
            setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
            alert('Event deleted successfully!');
        } catch (error) {
            console.error('Error deleting event:', error);
            setError('Error deleting event. Please try again.');
        }
    };

    const formatTime = (timestamp) => {
        if (timestamp && timestamp.seconds) {
            return format(new Date(timestamp.seconds * 1000), 'dd/MM/yyyy HH:mm');
        }
        return 'Invalid time';
    };

    return (
        <>
         <section className='c-userslist box '>
            <h2>Events Listing</h2>
            <button className="m-button-5" onClick={() => window.history.back()}>
    Back
  </button>
            <table className='table-class'>
                   
                    {loading && <p>Loading events...</p>}
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    
                    {/* Event Table */}
                    {/* <table className="leave-requests-table"> */}
                        <thead>
                            <tr> 
                                <th>Sr no</th>
                                <th>Event Name</th>
                                <th>Time</th>
                                <th>Zoom Link</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event,index) => (
                                <tr key={event.id}>
                                    <td>{index + 1}</td> 
                                    <td>{event.name}</td>
                                    <td>{formatTime(event.time)}</td>
                                    <td>
                                        <a href={event.zoomLink} target="_blank" rel="noreferrer">Join Meeting</a>
                                    </td>
                                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                        <button className ="m-button-6" onClick={() => handleViewUsers(event.id)}>View</button>
                                        {/* <button className = "m-button-6" onClick={() => handleDeleteEvent(event.id)} style={{ marginLeft: '10px', backgroundColor: 'red', color: 'white' }}>
                                            Delete
                                        </button> */}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
            </section>

        </>
    );
};

export default ManageEvents;
