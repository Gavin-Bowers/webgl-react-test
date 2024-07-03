import { useState } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState("");

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={async () => {
          let res = await fetch("http://localhost:3001/hello");
          let obj = await res.json();
          setMessage(obj.message);
        }}>
          server says: {message}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
