export function generateMapStyle(variables: Record<string, string>) {
  const getColor = (varName: string, fallback: string = '#000000') => {
    return variables[varName] || fallback;
  };

  return {
    version: 8,
    name: 'Custom Theme Style',
    layers: [
      {
        id: 'water',
        type: 'fill',
        paint: {
          'fill-color': getColor('--accent-blue', '#4a90e2'),
          'fill-opacity': 0.6
        }
      },
      {
        id: 'parks',
        type: 'fill',
        paint: {
          'fill-color': getColor('--accent-green', '#7ed321'),
          'fill-opacity': 0.3
        }
      },
      {
        id: 'buildings',
        type: 'fill',
        paint: {
          'fill-color': getColor('--muted', '#6b6275'),
          'fill-opacity': 0.7
        }
      },
      {
        id: 'roads',
        type: 'line',
        paint: {
          'line-color': getColor('--border', '#6b6275'),
          'line-width': 1
        }
      },
      {
        id: 'labels',
        type: 'symbol',
        paint: {
          'text-color': getColor('--foreground', '#f5cdb4'),
          'text-halo-color': getColor('--background', '#4a4a57'),
          'text-halo-width': 1
        }
      },
      {
        id: 'business-active',
        type: 'circle',
        paint: {
          'circle-color': getColor('--success', '#97d8c0'),
          'circle-radius': 8,
          'circle-stroke-color': getColor('--background', '#4a4a57'),
          'circle-stroke-width': 2
        }
      },
      {
        id: 'business-declining',
        type: 'circle',
        paint: {
          'circle-color': getColor('--warning', '#ffcb51'),
          'circle-radius': 8,
          'circle-stroke-color': getColor('--background', '#4a4a57'),
          'circle-stroke-width': 2
        }
      },
      {
        id: 'business-closed',
        type: 'circle',
        paint: {
          'circle-color': getColor('--danger', '#ee5760'),
          'circle-radius': 8,
          'circle-stroke-color': getColor('--background', '#4a4a57'),
          'circle-stroke-width': 2
        }
      }
    ],
    sources: {},
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    sprite: 'mapbox://sprites/mapbox/dark-v11'
  };
}

export function getMapColors(variables: Record<string, string>) {
  return {
    background: variables['--background'] || '#4a4a57',
    water: variables['--accent-blue'] || '#4a90e2',
    parks: variables['--accent-green'] || '#7ed321',
    buildings: variables['--muted'] || '#6b6275',
    roads: variables['--border'] || '#6b6275',
    labels: variables['--foreground'] || '#f5cdb4',
    businessActive: variables['--success'] || '#97d8c0',
    businessDeclining: variables['--warning'] || '#ffcb51',
    businessClosed: variables['--danger'] || '#ee5760',
    border: variables['--border'] || '#6b6275',
    overlay: variables['--map-overlay'] || 'rgba(74, 74, 87, 0.9)'
  };
}

export function generateMapboxStyleCode(variables: Record<string, string>, themeName: string): string {
  const colors = getMapColors(variables);
  
  return `// Mapbox style configuration for ${themeName} theme
export const ${themeName}MapStyle = {
  water: '${colors.water}',
  parks: '${colors.parks}',
  buildings: '${colors.buildings}',
  roads: '${colors.roads}',
  labels: '${colors.labels}',
  background: '${colors.background}',
  markers: {
    active: '${colors.businessActive}',
    declining: '${colors.businessDeclining}',
    closed: '${colors.businessClosed}',
  },
  overlay: '${colors.overlay}',
  border: '${colors.border}'
};

// Apply to map
map.setPaintProperty('water', 'fill-color', '${colors.water}');
map.setPaintProperty('parks', 'fill-color', '${colors.parks}');
map.setPaintProperty('building', 'fill-color', '${colors.buildings}');
map.setPaintProperty('road', 'line-color', '${colors.roads}');
`;
}