'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Guide {
  _id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  module: {
    title: string;
    number?: number;
  };
}

export default function LTIContentPage() {
  const params = useParams();
  const guideId = params.id as string;
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (guideId) {
      fetchGuide();
    }
  }, [guideId]);

  const fetchGuide = async () => {
    try {
      const response = await fetch(`/api/guides/${guideId}`);
      if (!response.ok) {
        throw new Error('Guide not found');
      }
      const data = await response.json();
      setGuide(data);
    } catch (error) {
      console.error('Failed to fetch guide:', error);
      setError('Failed to load guide content');
    } finally {
      setLoading(false);
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
        Loading guide...
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        flexDirection: 'column'
      }}>
        <h2>Error</h2>
        <p>{error || 'Guide not found'}</p>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.6'
    }}>
      <header style={{ 
        borderBottom: '2px solid #007bff', 
        paddingBottom: '20px', 
        marginBottom: '30px' 
      }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
          <span style={{ 
            background: '#f0f0f0', 
            padding: '2px 6px', 
            borderRadius: '3px',
            marginRight: '10px'
          }}>
            {guide.category}
          </span>
          {guide.module?.title && (
            <span>{guide.module.title}</span>
          )}
        </div>
        <h1 style={{ 
          color: '#333', 
          margin: '10px 0',
          fontSize: '2.5em'
        }}>
          {guide.title}
        </h1>
        {guide.description && (
          <p style={{ 
            color: '#666', 
            fontSize: '1.1em',
            fontStyle: 'italic'
          }}>
            {guide.description}
          </p>
        )}
      </header>

      <main>
        {guide.content ? (
          <div 
            style={{ fontSize: '16px', color: '#333' }}
          >
            {/* Content should be properly sanitized before display */}
            {guide.content}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            color: '#666'
          }}>
            <h3>Content Coming Soon</h3>
            <p>This guide is being developed. Please check back later.</p>
          </div>
        )}
      </main>

      <footer style={{ 
        marginTop: '40px', 
        paddingTop: '20px', 
        borderTop: '1px solid #eee',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        <p>This content is provided by the Learning Management System</p>
        <a 
          href="/LMS/dashboard" 
          target="_blank"
          style={{ 
            color: '#007bff', 
            textDecoration: 'none',
            padding: '8px 16px',
            border: '1px solid #007bff',
            borderRadius: '4px',
            display: 'inline-block',
            marginTop: '10px'
          }}
        >
          Open Full LMS
        </a>
      </footer>
    </div>
  );
}