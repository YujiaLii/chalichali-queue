import { useState, useEffect } from 'react'
import { db } from './firebase' 
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc } from 'firebase/firestore'
import './App.css'

function App() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [queue, setQueue] = useState([]);
  // We initialize myId from localStorage so it "remembers" after a refresh
  const [myId, setMyId] = useState(localStorage.getItem('chaliQueueId') || null);
  
  const [currentView, setCurrentView] = useState('user'); 
  const [pinInput, setPinInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const ADMIN_PIN = "0113"; 

  useEffect(() => {
    const q = query(collection(db, "queue"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQueue(items);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name && phoneNumber) {
      const docRef = await addDoc(collection(db, "queue"), {
        name: name,
        phone: phoneNumber,
        timestamp: serverTimestamp(),
      });
      // Save ID to state and local storage
      setMyId(docRef.id);
      localStorage.setItem('chaliQueueId', docRef.id);
    }
  };

  const handleNext = async (id) => {
    if(window.confirm("Are you sure you want to remove this guest?")) {
      await deleteDoc(doc(db, "queue", id));
    }
  };

  const checkPin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthorized(true);
    } else {
      alert("Wrong PIN! Access Denied.");
      setPinInput('');
    }
  };

  // Logic to find position
  const myIndex = queue.findIndex(item => item.id === myId) + 1;
  const waitTime = (myIndex - 1) * 20;

  // If the person was removed from the queue by Admin, clear their local storage
  useEffect(() => {
    if (myId && queue.length > 0) {
      const stillInQueue = queue.find(item => item.id === myId);
      if (!stillInQueue) {
        setMyId(null);
        localStorage.removeItem('chaliQueueId');
      }
    }
  }, [queue, myId]);

return (
    <div className="container">
      <nav className="navbar">
        <div className="nav-brand">
          {/* Replace with your local logo image */}
          <img src="/logo.png" alt="ChaliChali" className="nav-logo" />
        </div>
        <div className="nav-links">
          <button onClick={() => {setCurrentView('user'); setIsAuthorized(false)}}>Guest Sign-In</button>
          <button onClick={() => setCurrentView('admin')}>Admin Dashboard</button>
        </div>
      </nav>

      {currentView === 'admin' ? (
        !isAuthorized ? (
          <div className="card pin-card">
            <h2>Enter Admin PIN</h2>
            <form onSubmit={checkPin}>
              <input type="password" placeholder="PIN" value={pinInput} onChange={(e) => setPinInput(e.target.value)} autoFocus />
              <button type="submit" className="join-btn">Unlock</button>
            </form>
          </div>
        ) : (
          <div className="admin-section">
            <div className="admin-header">
              <h2>Staff Dashboard</h2>
              <button className="logout-btn" onClick={() => setIsAuthorized(false)}>Lock</button>
            </div>
            <div className="admin-list">
              {queue.map((person, index) => (
                <div key={person.id} className="admin-item">
                  <div className="info">
                    <span className="rank">#{index + 1}</span>
                    <strong>{person.name}</strong>
                    <span className="phone">{person.phone}</span>
                  </div>
                  <button className="done-btn" onClick={() => handleNext(person.id)}>Next</button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="user-section">
          {!myId ? (
            <div className="card">
              <div className="marketing-header">
                <h1>Capture the Moment!</h1>
                <div className="price-tag">$10 per session</div>
                <p className="cash-only">💵 Cash Only</p>
              </div>
              
              <p className="waiting-text">{queue.length} people currently waiting</p>
              
              <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                <button type="submit" className="join-btn">Join the Line</button>
              </form>
            </div>
          ) : (
            <div className="card success">
              <h2>Success!</h2>
              <div className="badge">#{myIndex}</div>
              {myIndex === 1 ? (
                <p><strong>You are next!</strong> Please head to the booth.</p>
              ) : (
                <p>Estimated wait time: <strong>{waitTime} mins</strong></p>
              )}
              <hr />
              <p className="reminder-text">Please have <strong>$10 Cash</strong> ready!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App