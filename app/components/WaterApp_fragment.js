        <div id="side-panel" className={`side-panel ${(isPanelActive && (selectedCity || isLoading)) ? 'active' : ''}`}>
          <button className="close-panel" onClick={() => setIsPanelActive(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          
          <div id="panel-content">
            {isLoading ? (
              <div className="skeleton-container" style={{ padding: '2rem' }}>
                <div className="skeleton" style={{ width: '100%', height: '45px', borderRadius: '100px', marginBottom: '2.5rem' }}></div>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }}></div>
                    <div style={{ flex: 1 }}><div className="skeleton" style={{ width: '70%', height: '12px', marginBottom: '8px' }}></div><div className="skeleton" style={{ width: '40%', height: '8px' }}></div></div>
                  </div>
                ))}
              </div>
            ) : waterData ? (
              waterData.error ? (<div style={{ padding: '2rem', textAlign: 'center' }}>{waterData.error}</div>) : (<WaterReport data={waterData} onShare={handleShare} />)
            ) : null}
          </div>
        </div>
