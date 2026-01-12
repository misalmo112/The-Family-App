import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../../context/FamilyContext';
import { getFamilies } from '../../services/families';

/**
 * FamilySelect Page
 * Displays list of families and allows selecting one
 */
const FamilySelect = () => {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setActiveFamily } = useFamily();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFamilies();
  }, []);

  /**
   * Fetch families from API
   */
  const fetchFamilies = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getFamilies();
      setFamilies(data || []);
    } catch (err) {
      console.error('Error fetching families:', err);
      if (err.response) {
        if (err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError(err.response.data?.error || 'Failed to load families. Please try again.');
        }
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle family selection
   * @param {object} family - The selected family object
   */
  const handleSelectFamily = (family) => {
    setActiveFamily(family.id, family.name);
    navigate('/feed');
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading families...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <p style={{ color: '#c00', margin: 0 }}>{error}</p>
        </div>
        <button 
          onClick={fetchFamilies}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>No Families Found</h2>
        <p>You don't belong to any families yet.</p>
        <p>Create a family or join one to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Select a Family</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {families.map((family) => (
          <div
            key={family.id}
            onClick={() => handleSelectFamily(family)}
            style={{
              padding: '1.5rem',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: '#fff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.borderColor = '#007bff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
              {family.name}
            </h3>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#666' }}>
              <span>Code: <strong>{family.code}</strong></span>
              {family.created_at && (
                <span>
                  Created: {new Date(family.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FamilySelect;
