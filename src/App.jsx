import { useState, useEffect } from 'react'
import { db } from './firebase' 
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc } from 'firebase/firestore'
import './App.css'

function App() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [myId, setMyId] = useState(null);
  
  const [currentView, setCurrentView] = useState('user'); 
  const [pinInput, setPinInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const ADMIN_PIN = "0113"; // <--- CHANGE YOUR CODE HERE

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
      setMyId(docRef.id);
      setIsSubmitted(true);
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

  const myIndex = queue.findIndex(item => item.id === myId) + 1;
  
  // Calculate wait time: 
  // If they are #2, they wait for person #1 (20 mins).
  // If they are #1, they are next! (0-5 mins or just "You're next!")
  const waitTime = (myIndex - 1) * 20;

  return (
    <div className="container">
      <nav className="navbar">
        <div className="nav-brand">📸 ChaliChali</div>
        <div className="nav-links">
          <button onClick={() => {setCurrentView('user'); setIsAuthorized(false)}}>Guest Sign-In</button>
          <button onClick={() => setCurrentView('admin')}>Admin Dashboard</button>
        </div>
      </nav>

      {currentView === 'admin' ? (
        !isAuthorized ? (
          /* --- PIN PROTECTION VIEW --- */
          <div className="card pin-card">
            <h2>Enter Admin PIN</h2>
            <form onSubmit={checkPin}>
              <input 
                type="password" 
                placeholder="Enter 4-digit code" 
                value={pinInput} 
                onChange={(e) => setPinInput(e.target.value)} 
                autoFocus
              />
              <button type="submit" className="join-btn">Unlock</button>
            </form>
          </div>
        ) : (
          /* --- AUTHORIZED ADMIN VIEW --- */
          <div className="admin-section">
            <div className="admin-header">
              <h2>Staff Dashboard</h2>
              <button className="logout-btn" onClick={() => setIsAuthorized(false)}>Lock</button>
            </div>
            <p>Total in line: {queue.length}</p>
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
        /* --- GUEST VIEW --- */
        <div className="user-section">
          <header>
            <h1>Join the Photo Booth Queue</h1>
            <p>{queue.length} people currently waiting</p>
          </header>
          {!isSubmitted ? (
            <div className="card">
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
                <p><strong>You are next!</strong>Please head to the booth.</p>
               ) : (
                <p>Estimated wait time: {waitTime} mins</p>
               )}
              <button className="secondary-btn" onClick={() => setIsSubmitted(false)}>Add another person</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App