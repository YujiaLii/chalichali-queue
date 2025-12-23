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
  const [isAdmin, setIsAdmin] = useState(false); // Toggle for staff

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

  // Function for the operator to remove the person at the front
  const handleNext = async (id) => {
    await deleteDoc(doc(db, "queue", id));
  };

  const myIndex = queue.findIndex(item => item.id === myId) + 1;

  // --- ADMIN VIEW ---
  if (isAdmin) {
    return (
      <div className="container">
        <h1>Staff Dashboard</h1>
        <button onClick={() => setIsAdmin(false)}>Back to Sign-In</button>
        <div className="admin-list">
          {queue.map((person, index) => (
            <div key={person.id} className="admin-item">
              <span>{index + 1}. {person.name} ({person.phone})</span>
              <button onClick={() => handleNext(person.id)}>✅ Done / Next</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- CUSTOMER VIEW ---
  return (
    <div className="container">
      <header>
        <h1 onClick={() => setIsAdmin(true)} style={{cursor: 'pointer'}}>📸 ChaliChali Photo Booth</h1>
        <p>Current Queue: {queue.length} people</p>
      </header>

      {!isSubmitted ? (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="tel" placeholder="Phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
            <button type="submit" className="join-btn">Join Queue</button>
          </form>
        </div>
      ) : (
        <div className="card success">
          <h2>#{myIndex} in line</h2>
          <p>Estimated Wait: {myIndex * 5} mins</p>
          <button onClick={() => setIsSubmitted(false)}>Add Another</button>
        </div>
      )}
    </div>
  )
}

export default App