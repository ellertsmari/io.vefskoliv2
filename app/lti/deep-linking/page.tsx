'use client';

import { useState, useEffect } from 'react';
import { Guide } from '../../models/guide';

interface Guide {
  _id: string;
  title: string;
  description: string;
  category: string;
  module: {
    title: string;
    number?: number;
  };
}

export default function DeepLinkingPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedGuides, setSelectedGuides] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const response = await fetch('/api/guides');
      const data = await response.json();
      setGuides(data);
    } catch (error) {
      console.error('Failed to fetch guides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuideToggle = (guideId: string) => {
    setSelectedGuides(prev => 
      prev.includes(guideId) 
        ? prev.filter(id => id !== guideId)
        : [...prev, guideId]
    );
  };

  const handleSubmit = async () => {
    if (selectedGuides.length === 0) {
      alert('Please select at least one guide');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch('/api/lti/deep-linking/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedGuides,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit selection');
      }

      const data = await response.json();
      
      // Submit the deep linking response back to Canvas
      if (data.form) {
        // Create a temporary container to safely handle the form
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = data.form;
        const form = tempContainer.querySelector('form');
        if (form) {
          document.body.appendChild(form);
          form.submit();
        }
      }
      
    } catch (error) {
      console.error('Failed to submit selection:', error);
      alert('Failed to submit selection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        Loading guides...
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '20px auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>Select Guides for Canvas</h1>
      <p>Choose the guides you want to make available in Canvas:</p>

      <div style={{ marginBottom: '20px' }}>
        {guides.map(guide => (
          <div 
            key={guide._id} 
            style={{ 
              border: '1px solid #ddd', 
              padding: '15px', 
              margin: '10px 0',
              borderRadius: '5px',
              backgroundColor: selectedGuides.includes(guide._id) ? '#e7f3ff' : 'white'
            }}
          >
            <label style={{ display: 'flex', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedGuides.includes(guide._id)}
                onChange={() => handleGuideToggle(guide._id)}
                style={{ marginRight: '10px', marginTop: '5px' }}
              />
              <div>
                <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>
                  {guide.title}
                </h3>
                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                  {guide.description}
                </p>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  <span style={{ 
                    background: '#f0f0f0', 
                    padding: '2px 6px', 
                    borderRadius: '3px',
                    marginRight: '5px'
                  }}>
                    {guide.category}
                  </span>
                  <span>
                    {guide.module?.title || 'No module'}
                  </span>
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleSubmit}
          disabled={submitting || selectedGuides.length === 0}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: selectedGuides.length > 0 ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: selectedGuides.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Submitting...' : `Add ${selectedGuides.length} Guide(s) to Canvas`}
        </button>
      </div>
    </div>
  );
}