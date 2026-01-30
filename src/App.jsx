import React, { useState, useEffect } from 'react';
import PlasmidVisualization from './components/PlasmidVisualization.jsx';
import './css/styles.css';

function App() {
  const [data, setData] = useState(null);
  const [width, setWidth] = useState(window.innerWidth - 300);
  const [height, setHeight] = useState(window.innerHeight);
  const [dataText, setDataText] = useState('');
  const [parseError, setParseError] = useState('');

  // Load initial data
  useEffect(() => {
    fetch('/data/example_circular.json')
      .then(response => response.json())
      .then(jsonData => {
        setData(jsonData);
        setDataText(JSON.stringify(jsonData, null, 2));
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setParseError('Error loading initial data: ' + error.message);
      });
  }, []);

  const handleDataChange = (e) => {
    const text = e.target.value;
    setDataText(text);
    
    try {
      const parsedData = JSON.parse(text);
      setData(parsedData);
      setParseError('');
    } catch (error) {
      setParseError('Invalid JSON: ' + error.message);
    }
  };

  const handleDownload = () => {
    // This will be called from the PlasmidVisualization component
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row-reverse',
      margin: 0,
      padding: 0,
      fontFamily: 'Arial, Helvetica, sans-serif'
    }}>
      <div style={{
        width: '300px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        overflowY: 'auto',
        height: '100vh',
        boxSizing: 'border-box'
      }}>
        <h3 style={{ marginTop: 0 }}>Controls</h3>
        
        <label style={{
          display: 'block',
          marginBottom: '5px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>Width:</label>
        <input 
          type="number" 
          value={width}
          onChange={(e) => setWidth(parseInt(e.target.value) || (window.innerWidth - 300))}
          style={{
            width: '100%',
            padding: '5px',
            marginBottom: '15px',
            boxSizing: 'border-box',
            fontSize: '14px'
          }}
        />

        <label style={{
          display: 'block',
          marginBottom: '5px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>Height:</label>
        <input 
          type="number" 
          value={height}
          onChange={(e) => setHeight(parseInt(e.target.value) || window.innerHeight)}
          style={{
            width: '100%',
            padding: '5px',
            marginBottom: '15px',
            boxSizing: 'border-box',
            fontSize: '14px'
          }}
        />

        <label style={{
          display: 'block',
          marginBottom: '5px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>Data (JSON):</label>
        <textarea 
          rows="20" 
          value={dataText}
          onChange={handleDataChange}
          style={{
            width: '100%',
            padding: '5px',
            marginBottom: '15px',
            boxSizing: 'border-box',
            fontFamily: 'monospace',
            fontSize: '12px',
            resize: 'vertical'
          }}
        />
        
        {parseError && (
          <div style={{
            color: 'red',
            fontSize: '12px',
            marginTop: '-10px',
            marginBottom: '15px'
          }}>
            {parseError}
          </div>
        )}

        <button 
          onClick={handleDownload}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Download PNG
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {data && (
          <PlasmidVisualization 
            data={data} 
            width={width} 
            height={height}
            onDownload={handleDownload}
          />
        )}
      </div>
    </div>
  );
}

export default App;
