export const translations = {
  en: {
    hero: {
      title: "Jewish Businesses in Berlin",
      subtitle: "A Historical Journey Through Time",
      period: "1900-1945"
    },
    intro: {
      title: "Preserving Memory Through Data",
      mapTitle: "Interactive Visualization",
      paragraph1: "This interactive map documents the presence and fate of Jewish-owned businesses in Berlin from 1900 to 1945. Through careful historical research and data visualization, we preserve the memory of a vibrant commercial community that was systematically destroyed.",
      paragraph2: "Each marker on our map represents not just a business, but a family's livelihood, a community gathering place, and a piece of Berlin's economic and cultural fabric. From small corner shops to large department stores, these establishments were integral to the city's life.",
      paragraph3: "Navigate through time to witness how political changes, economic pressures, and systematic persecution affected these businesses. The visualization tracks their journey from prosperity through decline to forced closure, providing a data-driven testimony to this dark chapter in history."
    },
    preview: {
      title: "Featured Businesses",
      subtitle: "Explore stories from our collection"
    },
    statistics: {
      title: "The Collection",
      totalBusinesses: "Total Businesses",
      timeSpan: "Years Covered",
      categories: "Business Categories",
      peakYear: "Peak Year",
      yearLabel: "Year"
    },
    cta: {
      exploreMap: "Explore the Interactive Map",
      learnMore: "Learn More About the Project"
    },
    language: {
      switchTo: "Deutsch",
      current: "English"
    },
    businessStates: {
      active: "Active",
      declining: "Declining",
      closed: "Closed"
    }
  },
  de: {
    hero: {
      title: "Jüdische Geschäfte in Berlin",
      subtitle: "Eine historische Zeitreise",
      period: "1900-1945"
    },
    intro: {
      title: "Erinnerung durch Daten bewahren",
      mapTitle: "Interaktive Visualisierung",
      paragraph1: "Diese interaktive Karte dokumentiert die Präsenz und das Schicksal jüdischer Geschäfte in Berlin von 1900 bis 1945. Durch sorgfältige historische Forschung und Datenvisualisierung bewahren wir die Erinnerung an eine lebendige Geschäftsgemeinde, die systematisch zerstört wurde.",
      paragraph2: "Jede Markierung auf unserer Karte repräsentiert nicht nur ein Geschäft, sondern den Lebensunterhalt einer Familie, einen Gemeinschaftstreffpunkt und ein Stück des wirtschaftlichen und kulturellen Gefüges Berlins. Von kleinen Eckläden bis zu großen Kaufhäusern waren diese Einrichtungen integraler Bestandteil des städtischen Lebens.",
      paragraph3: "Navigieren Sie durch die Zeit, um zu erleben, wie politische Veränderungen, wirtschaftlicher Druck und systematische Verfolgung diese Geschäfte beeinflussten. Die Visualisierung verfolgt ihren Weg vom Wohlstand über den Niedergang bis zur erzwungenen Schließung und liefert ein datengestütztes Zeugnis dieses dunklen Kapitels der Geschichte."
    },
    preview: {
      title: "Ausgewählte Geschäfte",
      subtitle: "Entdecken Sie Geschichten aus unserer Sammlung"
    },
    statistics: {
      title: "Die Sammlung",
      totalBusinesses: "Geschäfte gesamt",
      timeSpan: "Erfasste Jahre",
      categories: "Geschäftskategorien",
      peakYear: "Spitzenjahr",
      yearLabel: "Jahr"
    },
    cta: {
      exploreMap: "Interaktive Karte erkunden",
      learnMore: "Mehr über das Projekt erfahren"
    },
    language: {
      switchTo: "English",
      current: "Deutsch"
    },
    businessStates: {
      active: "Aktiv",
      declining: "Rückläufig",
      closed: "Geschlossen"
    }
  }
};

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;