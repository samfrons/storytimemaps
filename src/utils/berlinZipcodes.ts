// Berlin district to zipcode mapping based on coordinates
// This is a simplified mapping - Berlin zipcodes are complex but we can approximate based on districts

export function getZipcodeFromCoordinates(lat: number, lng: number): string {
  // Berlin zipcode regions (approximate boundaries)
  const zipcodeRegions = [
    // Mitte (10115-10179)
    { minLat: 52.50, maxLat: 52.54, minLng: 13.35, maxLng: 13.42, zipcode: '10117' }, // Central Mitte
    { minLat: 52.52, maxLat: 52.55, minLng: 13.36, maxLng: 13.40, zipcode: '10115' }, // North Mitte
    { minLat: 52.50, maxLat: 52.52, minLng: 13.38, maxLng: 13.43, zipcode: '10178' }, // East Mitte
    { minLat: 52.49, maxLat: 52.52, minLng: 13.35, maxLng: 13.38, zipcode: '10785' }, // Tiergarten area
    
    // Charlottenburg (10585-10629)
    { minLat: 52.50, maxLat: 52.54, minLng: 13.28, maxLng: 13.35, zipcode: '10623' }, // Central Charlottenburg
    { minLat: 52.48, maxLat: 52.51, minLng: 13.29, maxLng: 13.34, zipcode: '10629' }, // South Charlottenburg
    { minLat: 52.51, maxLat: 52.53, minLng: 13.26, maxLng: 13.31, zipcode: '10585' }, // West Charlottenburg
    
    // Wilmersdorf (10707-10789)
    { minLat: 52.48, maxLat: 52.50, minLng: 13.31, maxLng: 13.35, zipcode: '10707' }, // North Wilmersdorf
    { minLat: 52.46, maxLat: 52.49, minLng: 13.30, maxLng: 13.34, zipcode: '10719' }, // Central Wilmersdorf
    
    // Schöneberg (10777-10829)
    { minLat: 52.47, maxLat: 52.49, minLng: 13.34, maxLng: 13.38, zipcode: '10777' }, // North Schöneberg
    { minLat: 52.46, maxLat: 52.48, minLng: 13.35, maxLng: 13.39, zipcode: '10823' }, // Central Schöneberg
    { minLat: 52.45, maxLat: 52.47, minLng: 13.34, maxLng: 13.38, zipcode: '10827' }, // South Schöneberg
    
    // Kreuzberg (10961-10999)
    { minLat: 52.48, maxLat: 52.51, minLng: 13.38, maxLng: 13.44, zipcode: '10969' }, // North Kreuzberg
    { minLat: 52.49, maxLat: 52.50, minLng: 13.40, maxLng: 13.43, zipcode: '10997' }, // East Kreuzberg
    { minLat: 52.47, maxLat: 52.49, minLng: 13.38, maxLng: 13.42, zipcode: '10961' }, // West Kreuzberg
    
    // Friedrichshain (10243-10249)
    { minLat: 52.50, maxLat: 52.53, minLng: 13.43, maxLng: 13.47, zipcode: '10243' }, // North Friedrichshain
    { minLat: 52.49, maxLat: 52.51, minLng: 13.44, maxLng: 13.48, zipcode: '10247' }, // Central Friedrichshain
    { minLat: 52.48, maxLat: 52.50, minLng: 13.45, maxLng: 13.49, zipcode: '10249' }, // South Friedrichshain
    
    // Prenzlauer Berg (10405-10439)
    { minLat: 52.52, maxLat: 52.55, minLng: 13.40, maxLng: 13.44, zipcode: '10405' }, // West Prenzlauer Berg
    { minLat: 52.53, maxLat: 52.56, minLng: 13.42, maxLng: 13.46, zipcode: '10437' }, // Central Prenzlauer Berg
    { minLat: 52.54, maxLat: 52.57, minLng: 13.43, maxLng: 13.47, zipcode: '10439' }, // East Prenzlauer Berg
    
    // Wedding (13347-13359)
    { minLat: 52.54, maxLat: 52.57, minLng: 13.35, maxLng: 13.39, zipcode: '13347' }, // South Wedding
    { minLat: 52.55, maxLat: 52.58, minLng: 13.34, maxLng: 13.38, zipcode: '13353' }, // Central Wedding
    { minLat: 52.56, maxLat: 52.59, minLng: 13.33, maxLng: 13.37, zipcode: '13357' }, // North Wedding
    
    // Neukölln (12043-12059)
    { minLat: 52.46, maxLat: 52.49, minLng: 13.42, maxLng: 13.46, zipcode: '12043' }, // North Neukölln
    { minLat: 52.45, maxLat: 52.47, minLng: 13.43, maxLng: 13.47, zipcode: '12047' }, // Central Neukölln
    { minLat: 52.44, maxLat: 52.46, minLng: 13.44, maxLng: 13.48, zipcode: '12055' }, // East Neukölln
    
    // Tempelhof (12099-12109)
    { minLat: 52.45, maxLat: 52.47, minLng: 13.38, maxLng: 13.42, zipcode: '12099' }, // North Tempelhof
    { minLat: 52.43, maxLat: 52.46, minLng: 13.37, maxLng: 13.41, zipcode: '12103' }, // Central Tempelhof
    { minLat: 52.42, maxLat: 52.44, minLng: 13.38, maxLng: 13.42, zipcode: '12109' }, // South Tempelhof
    
    // Steglitz (12157-12169)
    { minLat: 52.45, maxLat: 52.47, minLng: 13.31, maxLng: 13.34, zipcode: '12157' }, // North Steglitz
    { minLat: 52.43, maxLat: 52.46, minLng: 13.30, maxLng: 13.33, zipcode: '12161' }, // Central Steglitz
    { minLat: 52.42, maxLat: 52.44, minLng: 13.31, maxLng: 13.34, zipcode: '12169' }, // South Steglitz
    
    // Zehlendorf (14163-14169)
    { minLat: 52.42, maxLat: 52.45, minLng: 13.24, maxLng: 13.29, zipcode: '14163' }, // North Zehlendorf
    { minLat: 52.40, maxLat: 52.43, minLng: 13.25, maxLng: 13.30, zipcode: '14167' }, // Central Zehlendorf
    { minLat: 52.38, maxLat: 52.41, minLng: 13.26, maxLng: 13.31, zipcode: '14169' }, // South Zehlendorf
    
    // Spandau (13581-13597)
    { minLat: 52.52, maxLat: 52.55, minLng: 13.18, maxLng: 13.23, zipcode: '13581' }, // East Spandau
    { minLat: 52.53, maxLat: 52.56, minLng: 13.15, maxLng: 13.20, zipcode: '13585' }, // Central Spandau
    { minLat: 52.51, maxLat: 52.54, minLng: 13.12, maxLng: 13.17, zipcode: '13597' }, // West Spandau
    
    // Reinickendorf (13403-13439)
    { minLat: 52.56, maxLat: 52.59, minLng: 13.30, maxLng: 13.34, zipcode: '13403' }, // South Reinickendorf
    { minLat: 52.58, maxLat: 52.61, minLng: 13.31, maxLng: 13.35, zipcode: '13407' }, // Central Reinickendorf
    { minLat: 52.60, maxLat: 52.63, minLng: 13.32, maxLng: 13.36, zipcode: '13437' }, // North Reinickendorf
    
    // Pankow (13156-13189)
    { minLat: 52.56, maxLat: 52.59, minLng: 13.39, maxLng: 13.43, zipcode: '13156' }, // West Pankow
    { minLat: 52.57, maxLat: 52.60, minLng: 13.41, maxLng: 13.45, zipcode: '13187' }, // Central Pankow
    { minLat: 52.58, maxLat: 52.61, minLng: 13.43, maxLng: 13.47, zipcode: '13189' }, // East Pankow
    
    // Lichtenberg (10315-10369)
    { minLat: 52.50, maxLat: 52.53, minLng: 13.47, maxLng: 13.51, zipcode: '10315' }, // West Lichtenberg
    { minLat: 52.51, maxLat: 52.54, minLng: 13.49, maxLng: 13.53, zipcode: '10317' }, // Central Lichtenberg
    { minLat: 52.49, maxLat: 52.52, minLng: 13.51, maxLng: 13.55, zipcode: '10369' }, // East Lichtenberg
    
    // Treptow (12435-12489)
    { minLat: 52.47, maxLat: 52.50, minLng: 13.47, maxLng: 13.51, zipcode: '12435' }, // North Treptow
    { minLat: 52.45, maxLat: 52.48, minLng: 13.48, maxLng: 13.52, zipcode: '12459' }, // Central Treptow
    { minLat: 52.43, maxLat: 52.46, minLng: 13.49, maxLng: 13.53, zipcode: '12489' }, // South Treptow
    
    // Köpenick (12555-12589)
    { minLat: 52.43, maxLat: 52.46, minLng: 13.54, maxLng: 13.58, zipcode: '12555' }, // North Köpenick
    { minLat: 52.41, maxLat: 52.44, minLng: 13.56, maxLng: 13.60, zipcode: '12559' }, // Central Köpenick
    { minLat: 52.39, maxLat: 52.42, minLng: 13.58, maxLng: 13.62, zipcode: '12589' }, // South Köpenick
    
    // Marzahn (12679-12689)
    { minLat: 52.52, maxLat: 52.55, minLng: 13.53, maxLng: 13.57, zipcode: '12679' }, // West Marzahn
    { minLat: 52.53, maxLat: 52.56, minLng: 13.55, maxLng: 13.59, zipcode: '12685' }, // Central Marzahn
    { minLat: 52.51, maxLat: 52.54, minLng: 13.57, maxLng: 13.61, zipcode: '12689' }, // East Marzahn
    
    // Hellersdorf (12619-12629)
    { minLat: 52.52, maxLat: 52.55, minLng: 13.59, maxLng: 13.63, zipcode: '12619' }, // West Hellersdorf
    { minLat: 52.53, maxLat: 52.56, minLng: 13.61, maxLng: 13.65, zipcode: '12627' }, // Central Hellersdorf
    { minLat: 52.51, maxLat: 52.54, minLng: 13.63, maxLng: 13.67, zipcode: '12629' }, // East Hellersdorf
  ];
  
  // Find the best matching zipcode region
  for (const region of zipcodeRegions) {
    if (lat >= region.minLat && lat <= region.maxLat && 
        lng >= region.minLng && lng <= region.maxLng) {
      return region.zipcode;
    }
  }
  
  // Default fallback for central Berlin if no match found
  return '10117';
}

// Street name to zipcode mapping for more precise results (common streets)
const streetToZipcode: { [key: string]: string } = {
  // Mitte
  'unter den linden': '10117',
  'friedrichstr': '10117',
  'wilhelmstr': '10117',
  'leipziger str': '10117',
  'rosenthaler str': '10119',
  'torstr': '10119',
  'oranienburger str': '10117',
  
  // Charlottenburg
  'kurfürstendamm': '10707',
  'kantstr': '10623',
  'bismarckstr': '10627',
  'wilmersdorfer str': '10627',
  'savignyplatz': '10623',
  
  // Kreuzberg
  'bergmannstr': '10961',
  'gneisenaustr': '10961',
  'oranienstr': '10999',
  'skalitzer str': '10999',
  'kottbusser damm': '10967',
  
  // Prenzlauer Berg
  'schönhauser allee': '10435',
  'kastanienallee': '10435',
  'danziger str': '10435',
  'greifswalder str': '10405',
  
  // Friedrichshain
  'karl-marx-allee': '10243',
  'frankfurter allee': '10247',
  'boxhagener str': '10245',
  
  // Schöneberg
  'hauptstr': '10827',
  'potsdamer str': '10785',
  'nollendorfplatz': '10777',
  
  // Neukölln
  'karl-marx-str': '12043',
  'hermannstr': '12051',
  'sonnenallee': '12045',
};

export function getZipcodeFromAddress(address: string, lat: number, lng: number): string {
  if (!address) return getZipcodeFromCoordinates(lat, lng);
  
  const lowerAddress = address.toLowerCase();
  
  // Check if any known street is in the address
  for (const [street, zipcode] of Object.entries(streetToZipcode)) {
    if (lowerAddress.includes(street)) {
      return zipcode;
    }
  }
  
  // Fall back to coordinate-based lookup
  return getZipcodeFromCoordinates(lat, lng);
}