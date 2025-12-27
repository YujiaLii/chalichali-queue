import { useState, useEffect } from 'react'
import { db } from './firebase' 
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc } from 'firebase/firestore'
import './App.css'

function App() {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [queue, setQueue] = useState([]);
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
      setMyId(docRef.id);
      localStorage.setItem('chaliQueueId', docRef.id);
    }
  };

  const handleNext = async (id) => {
    if(window.confirm("Process next customer?")) {
      await deleteDoc(doc(db, "queue", id));
    }
  };

  const checkPin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthorized(true);
    } else {
      alert("Wrong PIN!");
      setPinInput('');
    }
  };

  const myIndex = queue.findIndex(item => item.id === myId) + 1;
  const waitTime = (myIndex - 1) * 20;

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
          <img src="/chalichali_logo.jpg" alt="Logo" className="nav-logo" />
          <span>ChaliChali</span>
        </div>
        <div className="nav-links">
          <button onClick={() => {setCurrentView('user'); setIsAuthorized(false)}}>Join Line</button>
          <button onClick={() => setCurrentView('admin')}>Admin</button>
        </div>
      </nav>

      {currentView === 'admin' ? (
        !isAuthorized ? (
          <div className="card pin-card">
            <h2>Staff Entry</h2>
            <form onSubmit={checkPin}>
              <input type="password" placeholder="PIN" value={pinInput} onChange={(e) => setPinInput(e.target.value)} autoFocus />
              <button type="submit" className="join-btn">Unlock</button>
            </form>
          </div>
        ) : (
          <div className="admin-section">
            <div className="admin-header">
              <h2>Queue Management</h2>
              <button className="logout-btn" onClick={() => setIsAuthorized(false)}>Lock</button>
            </div>
            <div className="admin-list">
              {queue.map((person, index) => (
                <div key={person.id} className="admin-item">
                  <div className="info">
                    <span className="rank">#{index + 1}</span>
                    <strong>{person.name}</strong>
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
              <img src="/chalichali_logo.jpg" alt="ChaliChali" className="hero-logo" />
              <h1>Capture the Moment!</h1>
              <div className="price-tag">Only $10!</div>
              <p className="payment-method">💵 Cash Only</p>
              
              <p className="waiting-count">{queue.length} people currently waiting</p>
              
              <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <input type="tel" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                <button type="submit" className="join-btn">Get My Spot</button>
              </form>
            </div>
          ) : (
            <div className="card success">
              <img src="/chalichali_logo.jpg" alt="ChaliChali" className="hero-logo-small" />
              <h2>Success!</h2>
              <div className="badge">#{myIndex}</div>
              {myIndex === 1 ? (
                <p className="next-notice"><strong>You are next!</strong> Please head to the booth.</p>
              ) : (
                <p>Estimated wait: <strong>{waitTime} mins</strong></p>
              )}
              
              <div className="marketing-footer">
                <p className="marketing-main">Ready for your close-up? 📸</p>
                <p className="marketing-price">Only $10! (Cash Only)</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App