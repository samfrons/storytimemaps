'use client'

import React, { useEffect, useState, useCallback } from 'react'
import MapboxMap from '../components/MapboxMap'

interface Business {
  name: string
  alternative_names: string[]
  business_type: string
  category: string
  address: string
  date_range: string
  registration_date: string
  takeover_date: string
  liquidation_date: string
  geocode_confidence: number
}

interface BusinessFeature {
  type: 'Feature'
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
  properties: Business
}

interface GeoJSON {
  type: 'FeatureCollection'
  features: BusinessFeature[]
}

export default function JewishBusinessesPage() {
  const [businesses, setBusinesses] = useState<GeoJSON | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [filteredBusinesses, setFilteredBusinesses] = useState<GeoJSON | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    // Load the GeoJSON data
    fetch('/jewish_businesses.geojson')
      .then(res => res.json())
      .then(data => {
        setBusinesses(data)
        setFilteredBusinesses(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading businesses:', err)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (!businesses) return

    let filtered = businesses.features

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.properties.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.properties.business_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.properties.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.properties.category === categoryFilter)
    }

    setFilteredBusinesses({
      type: 'FeatureCollection',
      features: filtered
    })
  }, [searchTerm, categoryFilter, businesses])

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedBusiness(id)
  }, [])

  const getBusinessState = (business: Business) => {
    if (business.liquidation_date) return 'closed'
    if (business.takeover_date) return 'declining'
    return 'active'
  }

  const markers = filteredBusinesses?.features.map(feature => ({
    id: feature.properties.name,
    position: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]] as [number, number],
    popup: feature.properties.category || feature.properties.business_type || 'Business',
    state: getBusinessState(feature.properties)
  })) || []

  const selectedBusinessData = filteredBusinesses?.features.find(
    f => f.properties.name === selectedBusiness
  )

  // Get unique categories
  const categories = businesses ? 
    Array.from(new Set(businesses.features.map(f => f.properties.category).filter(Boolean))) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-lg text-muted-foreground">Loading Jewish businesses database...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-96 border-r border-border overflow-y-auto bg-card relative">
        {/* Background texture overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundColor: 'rgba(244, 182, 67, 0.03)',
          mixBlendMode: 'overlay'
        }} />
        <div className="p-6 border-b relative" style={{
          backgroundColor: '#8b7aa8',
          borderBottomColor: '#a392c1'
        }}>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'white' }}>
            Jewish Businesses in Berlin
          </h1>
          <p className="text-sm mb-4" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
            Historical database of Jewish-owned businesses (1900-1945)
          </p>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 mb-3"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#2d3748'
            }}
          />
          
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg text-foreground focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: '#2d3748'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Business List */}
        <div className="p-4">
          <div className="text-sm mb-3 font-semibold" style={{ color: '#f4b643' }}>
            {filteredBusinesses?.features.length || 0} businesses found
          </div>
          
          <div className="space-y-3">
            {filteredBusinesses?.features.slice(0, 50).map(feature => (
              <div
                key={feature.properties.name}
                onClick={() => setSelectedBusiness(feature.properties.name)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedBusiness === feature.properties.name
                    ? 'border-2'
                    : 'border-border hover:shadow-sm'
                }`}
                style={{
                  borderColor: selectedBusiness === feature.properties.name ? '#f4b643' : undefined,
                  backgroundColor: selectedBusiness === feature.properties.name ? 'rgba(244, 182, 67, 0.08)' : undefined
                }}
              >
                <h3 className="font-semibold mb-1" style={{ color: selectedBusiness === feature.properties.name ? '#8b7aa8' : '#2d3748' }}>
                  {feature.properties.name}
                </h3>
                <p className="text-sm mb-1" style={{ color: '#8a7d71' }}>
                  {feature.properties.business_type}
                  {feature.properties.category && ` (${feature.properties.category})`}
                </p>
                <p className="text-xs" style={{ color: '#a8a199' }}>
                  {feature.properties.address}
                </p>
                {feature.properties.date_range && (
                  <p className="text-xs mt-1" style={{ 
                    color: '#f4b643',
                    fontWeight: 600
                  }}>
                    {feature.properties.date_range}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapboxMap
          center={[52.52, 13.405]}
          zoom={11}
          markers={markers}
          onMarkerClick={handleMarkerClick}
          activeMarkerId={selectedBusiness}
        />
        
        {/* Selected Business Info Overlay */}
        {selectedBusinessData && (
          <div className="absolute bottom-4 left-4 right-4 max-w-md p-4 rounded-lg shadow-xl" style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderColor: '#8b7aa8',
            borderWidth: '2px',
            borderStyle: 'solid'
          }}>
            <button
              onClick={() => setSelectedBusiness(null)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="font-bold text-lg mb-2" style={{ color: '#8b7aa8' }}>
              {selectedBusinessData.properties.name}
            </h3>
            
            {selectedBusinessData.properties.alternative_names?.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-muted-foreground">Also known as:</span>
                <div className="text-sm text-foreground">
                  {selectedBusinessData.properties.alternative_names.slice(0, 2).join(', ')}
                </div>
              </div>
            )}
            
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Type: </span>
                <span className="text-foreground">{selectedBusinessData.properties.business_type}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Category: </span>
                <span className="text-foreground">{selectedBusinessData.properties.category}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Address: </span>
                <span className="text-foreground">{selectedBusinessData.properties.address}</span>
              </div>
              {selectedBusinessData.properties.date_range && (
                <div>
                  <span className="text-muted-foreground">Active: </span>
                  <span style={{ 
                    color: '#f4b643',
                    fontWeight: 600 
                  }}>{selectedBusinessData.properties.date_range}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="absolute top-4 left-4 p-3 rounded-lg shadow-lg" style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderColor: '#f4b643',
          borderWidth: '2px',
          borderStyle: 'solid'
        }}>
          <h4 className="text-xs font-semibold text-foreground mb-2">Business Status</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b7aa8' }}></div>
              <span className="text-xs text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f4b643' }}></div>
              <span className="text-xs text-muted-foreground">Ownership Changed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#d67b5a' }}></div>
              <span className="text-xs text-muted-foreground">Closed/Liquidated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}