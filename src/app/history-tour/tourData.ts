// Data for the Berlin history tour — a scroll-driven cinematic tour through
// the businesses of the curated story list (ids 1–15 in data/storymaps.json),
// ordered chronologically by the date each business was forced to close.
//
// Coordinates are the centroids of each stop's 1930 building footprint
// (see footprints1930.ts): the surviving buildings' cadastral outlines, or
// parcels traced from the 1928 aerial survey where the building is gone.
// Story texts are taken verbatim from the archive. Building notes describe
// the documented architecture of each street and district in the period.

export interface TourCamera {
  zoom: number
  pitch: number
  bearing: number
}

export type FateKind = 'boycott' | 'banned' | 'forced-sale' | 'liquidated' | 'destroyed'

export interface TourStop {
  id: string
  title: string
  address: string
  district: string
  lat: number
  lng: number
  startDate: string
  endDate: string
  story: string
  building: string
  fate: string
  fateKind: FateKind
  image: string
  imageCredit: string
  cam: TourCamera
}

export interface EraEvent {
  date: string
  label: string
}

// Time axis range shown at the bottom of the tour.
export const AXIS_START = 1925
export const AXIS_END = 1945

export const ERA_EVENTS: EraEvent[] = [
  { date: '1933-01-30', label: 'Nazi seizure of power' },
  { date: '1933-04-01', label: 'Organized boycott of Jewish businesses' },
  { date: '1935-09-15', label: 'Nuremberg Laws' },
  { date: '1938-11-09', label: 'November pogrom' },
]

export const INTRO_CAM = {
  lng: 13.397,
  lat: 52.5165,
  zoom: 11.6,
  pitch: 38,
  bearing: -16,
  year: AXIS_START,
}

export const OUTRO_CAM = {
  lng: 13.395,
  lat: 52.519,
  zoom: 12.3,
  pitch: 46,
  bearing: 18,
  year: AXIS_END,
}

export const TOUR_STOPS: TourStop[] = [
  {
    id: '3',
    title: 'Deutsches Theater Café',
    address: 'Schumannstraße 13a',
    district: 'Friedrich-Wilhelm-Stadt, Mitte',
    lat: 52.524454,
    lng: 13.382335,
    startDate: '1928-06-01',
    endDate: '1933-03-30',
    story:
      'A popular café frequented by artists and intellectuals near the Deutsches Theater. Owned by the Goldstein family, it was boycotted and closed in early 1933 as part of the initial wave of anti-Jewish business actions.',
    building:
      'Schumannstraße is a quiet street of plain 1850s row houses in the Friedrich-Wilhelm-Stadt, their stucco fronts pressed close to the pavement. The Deutsches Theater sits back behind a garden forecourt — a neoclassical playhouse of 1850 with a pedimented portico, its interior remade for Max Reinhardt’s stage. In the Weimar years its doors emptied actors, critics and stagehands straight into the cafés across the street.',
    fate: 'Boycotted — closed 30 March 1933',
    fateKind: 'boycott',
    image: '/images/dtheater/dtheater.webp',
    imageCredit: 'Theater Archive',
    cam: { zoom: 17.0, pitch: 56, bearing: -24 },
  },
  {
    id: '9',
    title: 'Jonas & Co. Law Firm',
    address: 'Neue Friedrichstraße 60',
    district: 'Klosterviertel, Alt-Berlin',
    lat: 52.517062,
    lng: 13.414785,
    startDate: '1908-01-01',
    endDate: '1933-04-01',
    story:
      'A respected law firm that had practiced in Berlin for 25 years. Dr. Jonas and his partners were prohibited from practicing law under the new racial laws in April 1933.',
    building:
      'The Klosterviertel was Berlin’s legal quarter: around the corner on Littenstraße, the Land- und Amtsgericht (1896–1905) raised its neo-baroque dome over a stair hall of swirling Jugendstil balustrades. Neue Friedrichstraße itself was lined with sober Wilhelmine office houses — sandstone piers, tall first-floor windows — whose brass plates announced lawyers and notaries within reach of the courts and the medieval Parochialkirche.',
    fate: 'Excluded from the bar — April 1933',
    fateKind: 'banned',
    image: '/images/jonassco/jonassco.webp',
    imageCredit: 'Legal Archive',
    cam: { zoom: 16.9, pitch: 58, bearing: 42 },
  },
  {
    id: '2',
    title: 'Breslauer Brothers Department Store',
    address: 'Unter den Linden 15',
    district: 'Dorotheenstadt, Mitte',
    lat: 52.516617,
    lng: 13.387243,
    startDate: '1920-03-15',
    endDate: '1935-04-01',
    story:
      'One of Berlin’s prominent Jewish-owned department stores. The Breslauer Brothers had built a successful business over 15 years before being forced to sell under duress in 1935 as part of the systematic economic persecution.',
    building:
      'Unter den Linden was the parade axis of the old capital — a double allée of lime trees between neoclassical palais, embassy fronts and Wilhelmine banking houses in pale sandstone. By the 1920s, plate-glass display windows had been cut into the ground floors, and store buildings carried bronze lettering and awnings beneath the stucco cornices of an earlier century.',
    fate: 'Forced sale under duress — April 1935',
    fateKind: 'forced-sale',
    image: '/images/breslaur/breslaur1.webp',
    imageCredit: 'Private Collection',
    cam: { zoom: 16.5, pitch: 52, bearing: -18 },
  },
  {
    id: '8',
    title: 'Eggs & Dairy Distributors',
    address: 'Hackescher Markt 12',
    district: 'Am Hackeschen Markt, Mitte',
    lat: 52.523462,
    lng: 13.402631,
    startDate: '1923-02-01',
    endDate: '1935-06-30',
    story:
      'A family-run business distributing dairy products and eggs throughout Berlin. The Rosenberg family had built strong relationships with local farmers before being forced out of business.',
    building:
      'Hackescher Markt lived under the brick arcades of the Stadtbahn viaduct of 1882 — trains rumbling overhead while provisioners worked out of the vaulted arches and the Gründerzeit corner houses ringing the square. Carts came in from the countryside before dawn; the wholesale food trade ran through these arches into every district of the city.',
    fate: 'Forced out of business — June 1935',
    fateKind: 'liquidated',
    image: '/images/eggs/eggs.webp',
    imageCredit: 'Agricultural Records',
    cam: { zoom: 17.1, pitch: 60, bearing: 64 },
  },
  {
    id: '14',
    title: 'Butter & Fine Foods',
    address: 'Gendarmenmarkt 8',
    district: 'Friedrichstadt, Mitte',
    lat: 52.513703,
    lng: 13.390891,
    startDate: '1927-03-01',
    endDate: '1936-10-15',
    story:
      'A gourmet food shop specializing in imported delicacies and fine foods. The Stern family business catered to Berlin’s upper class before being boycotted and forced to close.',
    building:
      'Gendarmenmarkt was the most composed square in Berlin: Schinkel’s colonnaded Schauspielhaus of 1821 set between the twin domed towers of the German and French cathedrals. The Friderician townhouses framing the square kept delicatessens, wine merchants and publishers behind flat plaster fronts — an address that signalled quality more than any sign could.',
    fate: 'Boycotted — closed October 1936',
    fateKind: 'boycott',
    image: '/images/butter/butter.webp',
    imageCredit: 'Food Archive',
    cam: { zoom: 16.7, pitch: 54, bearing: -40 },
  },
  {
    id: '7',
    title: 'Product X Manufacturing',
    address: 'Warschauer Straße 45',
    district: 'Friedrichshain',
    lat: 52.503767,
    lng: 13.446978,
    startDate: '1926-04-01',
    endDate: '1936-12-01',
    story:
      'A small manufacturing company producing household goods. The business employed 25 workers before being systematically excluded from supply chains and forced to close.',
    building:
      'Warschauer Straße belonged to the industrial east: deep parcels with a Mietshaus on the street and brick loft factories — the Berlin Fabriketagen — stacked around rear courtyards, their cast-iron columns carrying whole floors of machinery. At the street’s southern end the Oberbaumbrücke (1896) crossed the Spree with double-deck brick towers, the elevated railway clattering across to Kreuzberg.',
    fate: 'Cut from supply chains — closed December 1936',
    fateKind: 'liquidated',
    image: '/images/productx/productx.webp',
    imageCredit: 'Industrial Archive',
    cam: { zoom: 16.9, pitch: 57, bearing: -52 },
  },
  {
    id: '6',
    title: 'Pelz Furrier',
    address: 'Friedrichstraße 180',
    district: 'Friedrichstadt, Mitte',
    lat: 52.512211,
    lng: 13.389319,
    startDate: '1918-11-01',
    endDate: '1937-08-15',
    story:
      'A luxury furrier shop owned by the Pelz family. Known for high-quality fur coats and accessories, the business served Berlin’s wealthy clientele before being forced to close in 1937.',
    building:
      'Friedrichstraße was the commercial canyon of the old city — narrow-fronted Geschäftshäuser of five and six storeys, stone piers alternating with glass, and glass-roofed arcades like the Kaisergalerie threading between the blocks. By the late 1920s the street read as one continuous shopfront, electric letters over furriers, glovers, hotels and cafés burning into the evening.',
    fate: 'Forced to close — August 1937',
    fateKind: 'liquidated',
    image: '/images/pelz/pelz.webp',
    imageCredit: 'Fashion Archive',
    cam: { zoom: 16.8, pitch: 58, bearing: 28 },
  },
  {
    id: '11',
    title: 'P. Kunst Gallery',
    address: 'Unter den Linden 35',
    district: 'Am Forum Fridericianum, Mitte',
    lat: 52.516806,
    lng: 13.391025,
    startDate: '1924-05-01',
    endDate: '1937-11-20',
    story:
      'An art gallery showcasing contemporary and traditional works. Paul Kunst had built relationships with artists across Europe before being forced to sell his collection and close the gallery.',
    building:
      'The eastern end of the Linden opened into the Forum Fridericianum — Knobelsdorff’s opera house of 1743, the domed St. Hedwig’s Cathedral behind it, the royal library’s curved baroque front on the square later named Bebelplatz. In the Kronprinzenpalais a few hundred metres east, the Nationalgalerie’s modern department had shown the very painters who in 1937 were seized from German museums as “degenerate”.',
    fate: 'Collection sold under duress — November 1937',
    fateKind: 'forced-sale',
    image: '/images/pkunst/pkunst.webp',
    imageCredit: 'Art Archive',
    cam: { zoom: 16.6, pitch: 53, bearing: 18 },
  },
  {
    id: '10',
    title: 'Kutschera Photography Studio',
    address: 'Potsdamer Straße 125',
    district: 'Schöneberg',
    lat: 52.49836,
    lng: 13.36294,
    startDate: '1930-01-01',
    endDate: '1938-03-15',
    story:
      'A modern photography studio offering portraits and commercial photography. The Kutschera family had invested in the latest equipment before being forced to sell at far below market value.',
    building:
      'Potsdamer Straße ran south-west in a canyon of heavy 1870s stucco Mietshäuser, their upper floors holding studios and ateliers behind tall north-facing glass. The street’s mixture was pure interwar Berlin: photography studios and print shops above, showrooms below — and at its head, by Potsdamer Platz, Mendelsohn’s steel-ribboned Columbushaus (1932) announcing the Neue Sachlichkeit.',
    fate: 'Sold far below value — March 1938',
    fateKind: 'forced-sale',
    image: '/images/kutschera/kutschera.webp',
    imageCredit: 'Photography Archive',
    cam: { zoom: 16.9, pitch: 59, bearing: -30 },
  },
  {
    id: '12',
    title: 'Ruilos Import Export',
    address: 'Spandauer Straße 15',
    district: 'Alt-Berlin, am Nikolaiviertel',
    lat: 52.520185,
    lng: 13.404076,
    startDate: '1921-08-01',
    endDate: '1938-06-30',
    story:
      'An import-export business with connections across Eastern Europe. The Ruilos family business was a vital link in trade networks before being systematically excluded.',
    building:
      'Spandauer Straße had been a trading street since the Middle Ages, running past the twin-spired Nikolaikirche — the city’s oldest church — where baroque gabled houses still stood shoulder to shoulder with Gründerzeit warehouse blocks. Import firms kept their counting rooms here for the eastward trade, close to the Spree wharves and the old town’s freight yards.',
    fate: 'Systematically excluded — closed June 1938',
    fateKind: 'liquidated',
    image: '/images/ruilos/ruilos.webp',
    imageCredit: 'Trade Archive',
    cam: { zoom: 17.1, pitch: 61, bearing: 48 },
  },
  {
    id: '13',
    title: 'Wassermann Medical Practice',
    address: 'Rosenstraße 22',
    district: 'Alt-Berlin, Mitte',
    lat: 52.521591,
    lng: 13.404991,
    startDate: '1915-01-01',
    endDate: '1938-09-30',
    story:
      'Dr. Wassermann had served the community as a physician for over 20 years. His practice was closed and his medical license revoked under the racial laws in September 1938.',
    building:
      'Rosenstraße was a modest lane of flat-fronted Bürgerhäuser between Spandauer Straße and the Stadtbahn arches, the practice rooms in the Beletage above a shop floor. Just off the lane, in Heidereutergasse, stood Berlin’s oldest synagogue, the Alte Synagoge of 1714. In 1943 the street would give its name to the Rosenstraße protest, when non-Jewish wives faced down the Gestapo here for their husbands’ release.',
    fate: 'Medical license revoked — 30 September 1938',
    fateKind: 'banned',
    image: '/images/wassermann/wassermann.webp',
    imageCredit: 'Medical Archive',
    cam: { zoom: 17.2, pitch: 60, bearing: -14 },
  },
  {
    id: '1',
    title: 'Elias Braun — Tailor Shop',
    address: 'Rosenthaler Straße 40',
    district: 'Spandauer Vorstadt, Mitte',
    lat: 52.524723,
    lng: 13.40125,
    startDate: '1925-01-01',
    endDate: '1938-11-09',
    story:
      'A small tailoring business owned by Elias Braun and his family. The shop was known for fine men’s clothing and had been operating since 1925. During Kristallnacht in November 1938 the windows were smashed and the business was forced to close.',
    building:
      'Rosenthaler Straße 40–41 is the street front of the Hackesche Höfe: August Endell’s Jugendstil courtyard city of 1906, its first court sheathed in glazed polychrome brick, with workshops, flats, a ballroom and shops threaded through eight linked Höfe. The surrounding Spandauer Vorstadt was the heart of Jewish Berlin — tailors’ workshops in the courtyards, prayer rooms upstairs, Hebrew booksellers in the side streets.',
    fate: 'Destroyed in the November pogrom — 9 November 1938',
    fateKind: 'destroyed',
    image: '/images/ebraun/ebraun1.webp',
    imageCredit: 'Berlin State Archive',
    cam: { zoom: 17.1, pitch: 58, bearing: 36 },
  },
  {
    id: '5',
    title: 'Hoxter & Sons Bookshop',
    address: 'Oranienburger Straße 28',
    district: 'Spandauer Vorstadt, Mitte',
    lat: 52.524726,
    lng: 13.394784,
    startDate: '1910-01-01',
    endDate: '1938-11-10',
    story:
      'An established bookshop that had served Berlin’s intellectual community for nearly three decades. The shop specialized in literature, philosophy and Jewish texts. It was destroyed during Kristallnacht.',
    building:
      'Two doors along, at Oranienburger Straße 30, the gilded ribs of the Neue Synagoge’s dome rose over the street — Knoblauch’s Moorish-revival synagogue of 1866, seating three thousand, the proudest building of German Jewry. The shop itself sat in a Gründerzeit row, cast-iron columns between the display windows, books stacked to the mezzanine ceiling. On the night of 9–10 November 1938 the district’s pavements lay under broken glass.',
    fate: 'Destroyed in the November pogrom — 10 November 1938',
    fateKind: 'destroyed',
    image: '/images/hoxter/hoxter.webp',
    imageCredit: 'Library Archive',
    cam: { zoom: 17.0, pitch: 57, bearing: -44 },
  },
  {
    id: '15',
    title: 'YVA Photography Agency',
    address: 'Kaiserdamm 118',
    district: 'Westend, Charlottenburg',
    lat: 52.510524,
    lng: 13.296587,
    startDate: '1925-07-01',
    endDate: '1938-12-01',
    story:
      'A pioneering photography agency founded by Else Neuländer-Simon (YVA). The agency was known for innovative fashion and advertising photography before being forced to close during the persecution.',
    building:
      'The Kaiserdamm was cut through in 1906 as the west’s parade axis: massive reform-era apartment blocks with bays, loggias and lifts, their plaster fronts calmer than the ornament of the Gründerzeit. At its western end lay Reichskanzlerplatz, and nearby the icons of modern Berlin — the Funkturm (1926) and Poelzig’s brick Haus des Rundfunks (1931) — the same new city Yva’s fashion pages were made for.',
    fate: 'Forced to close — December 1938',
    fateKind: 'liquidated',
    image: '/images/yva/yva.webp',
    imageCredit: 'Photography Museum',
    cam: { zoom: 16.6, pitch: 54, bearing: 22 },
  },
  {
    id: '4',
    title: 'Ebro Textiles',
    address: 'Alexanderstraße 125',
    district: 'Am Alexanderplatz, Mitte',
    lat: 52.515648,
    lng: 13.418512,
    startDate: '1922-09-01',
    endDate: '1939-01-15',
    story:
      'A textile import business specializing in fine fabrics from across Europe. The Ebro family business employed twelve people before being forced to liquidate in early 1939.',
    building:
      'At Alexanderplatz the old and new city collided: Behrens’ travertine-and-glass office slabs, Alexanderhaus and Berolinahaus (1932), rose out of the U-Bahn excavations while the surrounding streets kept their Gründerzeit cloth-trade warehouses. Alexanderstraße carried that older Berlin — loading gates, hoist beams, the sample rooms of the textile wholesalers — south toward the Spree.',
    fate: 'Forced liquidation — January 1939',
    fateKind: 'liquidated',
    image: '/images/ebro/erbo.webp',
    imageCredit: 'Business Registry',
    cam: { zoom: 16.8, pitch: 56, bearing: -32 },
  },
]

// Fractional year (e.g. 1938.86) for positioning on the time axis.
export function toDecimalYear(iso: string): number {
  const d = new Date(iso)
  const start = Date.UTC(d.getUTCFullYear(), 0, 1)
  const end = Date.UTC(d.getUTCFullYear() + 1, 0, 1)
  return d.getUTCFullYear() + (d.getTime() - start) / (end - start)
}

// Project display convention: MM.YYYY
export function formatMonthYear(decimalYear: number): string {
  const year = Math.floor(decimalYear)
  const month = Math.min(11, Math.max(0, Math.floor((decimalYear - year) * 12)))
  return `${String(month + 1).padStart(2, '0')}.${year}`
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`
}

export function axisPercent(decimalYear: number): number {
  const p = ((decimalYear - AXIS_START) / (AXIS_END - AXIS_START)) * 100
  return Math.min(100, Math.max(0, p))
}
