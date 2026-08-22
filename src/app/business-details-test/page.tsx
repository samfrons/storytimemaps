'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import SiteFooter from '../components/SiteFooter'

// Sample business data
interface BusinessData {
  id: string
  name: string
  address: string
  formerAddress?: string
  years: string
  category: string
  description: string
  sources: string[]
  image?: string
}

const sampleBusinesses: BusinessData[] = [
  {
    id: '1',
    name: 'Breslaur Optical',
    address: '1247 Broadway',
    formerAddress: '1185 Broadway (1920-1932)',
    years: '1920-1965',
    category: 'Optical Services',
    description:
      'A family-owned optical shop that served the community for over four decades. Known for high-quality eyewear and professional eye examinations.',
    sources: ['City Directory 1920-1965', 'Business License Records', 'Oral History Collection'],
    image: '/images/breslaur/breslaur1.png',
  },
  {
    id: '2',
    name: 'Wassermann Import Co.',
    address: '428 Market Street',
    years: '1895-1943',
    category: 'Import/Export',
    description:
      'Specialized in importing fine goods from Europe, particularly textiles and household items. One of the oldest established businesses in the district.',
    sources: ['Chamber of Commerce Records', 'Port Authority Import Logs', 'Family Archives'],
    image: '/images/wassermann/wassermann.png',
  },
  {
    id: '3',
    name: 'Jonassco Paper Goods',
    address: '312 Pine Avenue',
    formerAddress: '298 Pine Avenue (1910-1925)',
    years: '1910-1955',
    category: 'Paper & Stationery',
    description:
      'Wholesale paper goods distributor serving local businesses and institutions. Expanded operations multiple times during peak business years.',
    sources: ['Trade Association Records', 'Building Permits', 'Newspaper Archives'],
    image: '/images/jonassco/jonassco.png',
  },
]

// Modal Overlay Component with true expansion from card
const ModalOverlay: React.FC<{
  business: BusinessData
  isOpen: boolean
  onClose: () => void
  originRect: DOMRect | null
}> = ({ business, isOpen, onClose, originRect }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && originRect) {
      setIsVisible(true)
      // Start expansion after a frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsExpanded(true)
          // Show content after expansion starts
          setTimeout(() => setShowContent(true), 300)
        })
      })
    } else if (!isOpen) {
      setShowContent(false)
      setIsExpanded(false)
      setTimeout(() => setIsVisible(false), 500)
    }
  }, [isOpen, originRect])

  if (!isVisible || !originRect) return null

  // Calculate the transform origin and initial position
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const modalWidth = Math.min(672, viewportWidth - 32) // max-w-2xl with padding
  const modalHeight = viewportHeight * 0.9

  const finalX = (viewportWidth - modalWidth) / 2
  const finalY = (viewportHeight - modalHeight) / 2

  const initialScaleX = originRect.width / modalWidth
  const initialScaleY = originRect.height / modalHeight
  const initialX = originRect.left - finalX
  const initialY = originRect.top - finalY

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black backdrop-blur-sm transition-all duration-500 ease-out ${
          isExpanded ? 'bg-opacity-60' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Expanding Modal */}
      <div
        ref={modalRef}
        className={`absolute bg-background border border-border shadow-2xl transition-all duration-700 ease-out`}
        style={{
          width: `${modalWidth}px`,
          height: `${modalHeight}px`,
          left: `${finalX}px`,
          top: `${finalY}px`,
          transform: isExpanded
            ? 'translate(0, 0) scale(1)'
            : `translate(${initialX}px, ${initialY}px) scale(${initialScaleX}, ${initialScaleY})`,
          transformOrigin: 'top left',
          transitionTimingFunction: isExpanded
            ? 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Simple Header - visible during expansion */}
        <div
          className={`flex items-center justify-between p-6 border-b border-border transition-opacity duration-300 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h2 className="text-xl font-semibold text-foreground font-mono">{business.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/20 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <svg
              className="w-5 h-5 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content - fades in after expansion */}
        <div
          className={`p-6 overflow-y-auto h-[calc(100%-80px)] transition-opacity duration-500 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="space-y-6">
            {/* Image */}
            {business.image && (
              <div className="w-full h-48 bg-muted/20 border border-border overflow-hidden relative">
                <Image src={business.image} alt={business.name} fill className="object-cover" />
              </div>
            )}

            {/* Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Location
                  </h3>
                  <p className="font-mono text-sm text-foreground">{business.address}</p>
                  {business.formerAddress && (
                    <p className="font-mono text-xs text-muted mt-1">
                      Formerly: {business.formerAddress}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Active Period
                  </h3>
                  <p className="font-mono text-sm text-foreground">{business.years}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-2">
                    Category
                  </h3>
                  <p className="font-mono text-sm text-foreground">{business.category}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-3">
                Description
              </h3>
              <p className="font-mono text-sm text-foreground leading-relaxed">
                {business.description}
              </p>
            </div>

            {/* Sources */}
            <div>
              <h3 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-3">
                Sources
              </h3>
              <ul className="space-y-2">
                {business.sources.map((source, index) => (
                  <li
                    key={index}
                    className="font-mono text-sm text-foreground flex items-start gap-2"
                  >
                    <span className="text-primary mt-1">•</span>
                    {source}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button className="flex-1 font-mono text-xs font-semibold py-3 px-4 bg-background border border-border text-foreground hover:bg-muted/10 transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wide">
                View on Map
              </button>
              <button className="flex-1 font-mono text-xs font-semibold py-3 px-4 bg-primary text-white border border-primary hover:bg-primary-light transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wide">
                Share Business
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Sliding Panel Component with slide from card position
const SlidingPanel: React.FC<{
  business: BusinessData
  isOpen: boolean
  onClose: () => void
  originRect: DOMRect | null
}> = ({ business, isOpen, onClose, originRect }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen && originRect) {
      setIsVisible(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsExpanded(true)
          setTimeout(() => setShowContent(true), 200)
        })
      })
    } else if (!isOpen) {
      setShowContent(false)
      setIsExpanded(false)
      setTimeout(() => setIsVisible(false), 600)
    }
  }, [isOpen, originRect])

  if (!isVisible || !originRect) return null

  const panelWidth = Math.min(512, window.innerWidth) // max-w-lg
  const startX = originRect.left - (window.innerWidth - panelWidth)
  const startY = originRect.top

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black backdrop-blur-sm transition-all duration-500 ease-out ${
          isExpanded ? 'bg-opacity-60' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Expanding Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-lg bg-background border-l border-border shadow-2xl transition-all duration-600`}
        style={{
          transform: isExpanded
            ? 'translateX(0) translateY(0) scale(1)'
            : `translateX(${startX}px) translateY(${startY}px) scale(${originRect.width / panelWidth}, ${originRect.height / window.innerHeight})`,
          transformOrigin: 'top right',
          transitionTimingFunction: isExpanded
            ? 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            : 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b border-border transition-opacity duration-300 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <h2 className="text-lg font-semibold text-foreground font-mono">{business.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/20 transition-all duration-200 hover:rotate-90"
          >
            <svg
              className="w-5 h-5 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          className={`p-6 overflow-y-auto h-[calc(100%-80px)] transition-opacity duration-400 ${
            showContent ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="space-y-6">
            {/* Image */}
            {business.image && (
              <div className="w-full h-48 bg-muted/20 border border-border overflow-hidden relative">
                <Image src={business.image} alt={business.name} fill className="object-cover" />
              </div>
            )}

            {/* Business Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Location
                </h3>
                <p className="font-mono text-sm text-foreground">{business.address}</p>
                {business.formerAddress && (
                  <p className="font-mono text-xs text-muted mt-1">
                    Formerly: {business.formerAddress}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Active Period
                </h3>
                <p className="font-mono text-sm text-foreground">{business.years}</p>
              </div>

              <div>
                <h3 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Category
                </h3>
                <p className="font-mono text-sm text-foreground">{business.category}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-3">
                Description
              </h3>
              <p className="font-mono text-sm text-foreground leading-relaxed">
                {business.description}
              </p>
            </div>

            {/* Sources */}
            <div>
              <h3 className="font-mono text-xs font-bold text-muted uppercase tracking-wider mb-3">
                Sources
              </h3>
              <ul className="space-y-2">
                {business.sources.map((source, index) => (
                  <li
                    key={index}
                    className="font-mono text-sm text-foreground flex items-start gap-2"
                  >
                    <span className="text-primary mt-1">•</span>
                    {source}
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-border">
              <button className="w-full font-mono text-xs font-semibold py-3 px-4 bg-background border border-border text-foreground hover:bg-muted/10 transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wide">
                View on Map
              </button>
              <button className="w-full font-mono text-xs font-semibold py-3 px-4 bg-primary text-white border border-primary hover:bg-primary-light transition-all duration-200 shadow-sm hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wide">
                Share Business
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Business Card Component
const BusinessCard: React.FC<{
  business: BusinessData
  onClick: (rect: DOMRect) => void
  variant: 'modal' | 'panel'
  isActive?: boolean
}> = ({ business, onClick, variant, isActive }) => {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleClick = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      onClick(rect)
    }
  }

  return (
    <div
      ref={cardRef}
      className={`bg-background border border-border p-4 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
        isActive ? 'opacity-0 pointer-events-none' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        {business.image && (
          <div className="w-16 h-16 bg-muted/20 border border-border overflow-hidden flex-shrink-0 relative">
            <Image src={business.image} alt={business.name} fill className="object-cover" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-1 truncate">
            {business.name}
          </h3>
          <p className="font-mono text-xs text-muted mb-1">{business.address}</p>
          <p className="font-mono text-xs text-muted mb-2">{business.years}</p>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-primary bg-primary/10 px-2 py-1 border border-primary/20">
              {business.category}
            </span>
            <span className="font-mono text-xs text-muted">
              Click to {variant === 'modal' ? 'expand' : 'view details'}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

// Main Component
export default function BusinessDetailsTest() {
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [originRect, setOriginRect] = useState<DOMRect | null>(null)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  const openModal = (business: BusinessData, rect: DOMRect) => {
    setOriginRect(rect)
    setSelectedBusiness(business)
    setActiveCardId(business.id)
    setModalOpen(true)
  }

  const openPanel = (business: BusinessData, rect: DOMRect) => {
    setOriginRect(rect)
    setSelectedBusiness(business)
    setActiveCardId(business.id)
    setPanelOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setTimeout(() => {
      setSelectedBusiness(null)
      setOriginRect(null)
      setActiveCardId(null)
    }, 600)
  }

  const closePanel = () => {
    setPanelOpen(false)
    setTimeout(() => {
      setSelectedBusiness(null)
      setOriginRect(null)
      setActiveCardId(null)
    }, 700)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mock Map Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(151,216,192,0.1),transparent_50%)]"></div>
          <div className="w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(238,87,96,0.1),transparent_50%)]"></div>
          <div className="w-full h-full bg-[radial-gradient(circle_at_40%_40%,rgba(255,203,81,0.1),transparent_50%)]"></div>
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground font-mono mb-2">
            Business Details Test
          </h1>
          <p className="text-muted font-mono text-sm">
            Two different UX patterns with true expansion from card position
          </p>
        </div>

        {/* Two Columns Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Modal Pattern */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground font-mono border-b border-border pb-2">
              Option 1: Modal Expansion
            </h2>
            <p className="text-xs text-muted font-mono mb-4">
              Card expands from its position to center modal
            </p>

            <div className="space-y-3">
              {sampleBusinesses.map((business) => (
                <BusinessCard
                  key={`modal-${business.id}`}
                  business={business}
                  onClick={(rect) => openModal(business, rect)}
                  variant="modal"
                  isActive={modalOpen && activeCardId === business.id}
                />
              ))}
            </div>
          </div>

          {/* Sliding Panel Pattern */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground font-mono border-b border-border pb-2">
              Option 2: Panel Expansion
            </h2>
            <p className="text-xs text-muted font-mono mb-4">
              Card morphs and slides to side panel
            </p>

            <div className="space-y-3">
              {sampleBusinesses.map((business) => (
                <BusinessCard
                  key={`panel-${business.id}`}
                  business={business}
                  onClick={(rect) => openPanel(business, rect)}
                  variant="panel"
                  isActive={panelOpen && activeCardId === business.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Animation Notes */}
        <div className="mt-12 p-6 bg-background/50 border border-border backdrop-blur-sm">
          <h3 className="font-mono text-sm font-bold text-foreground mb-3">
            True Expansion Animation:
          </h3>
          <ul className="space-y-2 text-xs text-muted font-mono">
            <li>• Cards expand from their exact position to final destination</li>
            <li>• Modal: Expands from card to centered overlay</li>
            <li>• Panel: Morphs from card to side panel</li>
            <li>• Original card fades out during expansion</li>
            <li>• Reverse animation collapses back to card position</li>
            <li>• Content fades in after structural animation completes</li>
          </ul>
        </div>
      </div>

      {/* Modal Overlay */}
      {selectedBusiness && (
        <ModalOverlay
          business={selectedBusiness}
          isOpen={modalOpen}
          onClose={closeModal}
          originRect={originRect}
        />
      )}

      {/* Sliding Panel */}
      {selectedBusiness && (
        <SlidingPanel
          business={selectedBusiness}
          isOpen={panelOpen}
          onClose={closePanel}
          originRect={originRect}
        />
      )}

      <div className="relative z-10">
        <SiteFooter />
      </div>
    </div>
  )
}
