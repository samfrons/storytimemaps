export const getTranslatedDescription = (
  story: any,
  language: string,
  t: (key: string) => string
): string => {
  // For German translations, provide context-aware descriptions
  if (language === 'de') {
    const businessType = story.businessType?.toLowerCase() || story.category?.toLowerCase() || '';
    const description = story.description?.toLowerCase() || '';
    const title = story.title || '';
    
    // Translate based on the actual content patterns found in descriptions
    
    // Elias Braun Tailor Shop type description
    if (description.includes('tailoring business') || businessType.includes('tailor') || businessType === 'tailoring') {
      const owner = title.split(' - ')[0] || 'der Familie';
      if (description.includes('kristallnacht')) {
        return `Ein kleines Schneidergeschäft im Besitz von ${owner} und seiner Familie. Das Geschäft war bekannt für feine Herrenkleidung. Während der Kristallnacht im November 1938 wurden die Fenster zerschlagen und das Geschäft musste schließen.`;
      }
      return `Ein kleines Schneidergeschäft im Besitz von ${owner}. Das Geschäft war bekannt für hochwertige Handwerkskunst.`;
    }
    
    // Breslauer Brothers type description  
    if (description.includes('department store') || businessType.includes('department') || businessType.includes('store')) {
      if (description.includes('forced to sell')) {
        return `Eines der prominenten jüdischen Kaufhäuser Berlins. Die Inhaber hatten über 15 Jahre ein erfolgreiches Geschäft aufgebaut, bevor sie 1935 im Rahmen der systematischen wirtschaftlichen Verfolgung zum Verkauf unter Druck gezwungen wurden.`;
      }
      return `Eines der prominenten jüdischen Kaufhäuser Berlins. ${title} bot eine breite Produktpalette.`;
    }
    
    // Theater Café type description
    if (description.includes('artists and intellectuals') || businessType.includes('theater') || businessType.includes('cafe') || businessType.includes('café')) {
      return 'Ein beliebtes Café, das von Künstlern und Intellektuellen in der Nähe des Deutschen Theaters frequentiert wurde.';
    }
    
    if (businessType.includes('restaurant')) {
      return `Ein jüdisches Restaurant im Herzen Berlins. ${story.title} war bekannt für traditionelle Küche.`;
    }
    
    if (businessType.includes('bakery') || businessType.includes('bäckerei')) {
      return 'Eine traditionelle jüdische Bäckerei, die für ihre handwerklichen Backwaren bekannt war.';
    }
    
    if (businessType.includes('pharmacy') || businessType.includes('apotheke')) {
      return 'Eine Apotheke im Besitz einer jüdischen Familie, die der lokalen Gemeinschaft diente.';
    }
    
    if (businessType.includes('clothing') || businessType.includes('bekleidung')) {
      return 'Ein Bekleidungsgeschäft, das moderne Mode und traditionelle Handwerkskunst verband.';
    }
    
    if (businessType.includes('jewelry') || businessType.includes('schmuck')) {
      return 'Ein Juweliergeschäft, bekannt für feine Handwerkskunst und exquisite Designs.';
    }
    
    if (businessType.includes('furniture') || businessType.includes('möbel')) {
      return 'Ein Möbelgeschäft, das hochwertige Einrichtungsgegenstände anbot.';
    }
    
    if (businessType.includes('bookstore') || businessType.includes('buchhandlung')) {
      return 'Eine Buchhandlung, die als kulturelles Zentrum der jüdischen Gemeinde diente.';
    }
    
    // More specific patterns found in actual data
    if (description.includes('shoe') || businessType.includes('shoe')) {
      return `Ein Schuhgeschäft im jüdischen Besitz. ${title} bot hochwertige Schuhe und Lederarbeiten.`;
    }
    
    if (description.includes('textile') || businessType.includes('textile')) {
      return `Ein Textilgeschäft, das feine Stoffe und Schneiderbedarf anbot.`;
    }
    
    if (description.includes('optician') || businessType.includes('optical')) {
      return `Ein Optikergeschäft im Besitz einer jüdischen Familie, spezialisiert auf Brillen und optische Instrumente.`;
    }
    
    if (description.includes('hardware') || businessType.includes('hardware')) {
      return `Ein Eisenwarengeschäft, das Werkzeuge und Haushaltswaren verkaufte.`;
    }
    
    if (description.includes('tobacco') || businessType.includes('tobacco')) {
      return `Ein Tabakwarengeschäft, das importierte Zigarren und Tabak anbot.`;
    }
    
    if (description.includes('printing') || businessType.includes('printing')) {
      return `Eine Druckerei im jüdischen Besitz, spezialisiert auf Bücher und Zeitschriften.`;
    }
    
    if (description.includes('forced to close') || description.includes('liquidated')) {
      const year = story.endDate ? new Date(story.endDate).getFullYear() : '1938';
      return `Ein jüdisches Geschäft, das ${year} zwangsweise geschlossen wurde. ${title} war ein wichtiger Teil der lokalen Wirtschaft.`;
    }
    
    if (description.includes('aryanization') || description.includes('aryanized')) {
      return `Ein jüdisches Unternehmen, das im Rahmen der "Arisierung" enteignet wurde. Die Besitzer wurden gezwungen, ihr Geschäft weit unter Wert zu verkaufen.`;
    }
    
    // Default German description with dates if available
    const startYear = story.startDate ? new Date(story.startDate).getFullYear() : null;
    const endYear = story.endDate ? new Date(story.endDate).getFullYear() : null;
    
    if (startYear && endYear) {
      return `Ein jüdisches Geschäft in Berlin, das von ${startYear} bis ${endYear} betrieben wurde. ${title} war Teil des lebendigen jüdischen Geschäftslebens der Stadt.`;
    }
    
    return `Ein jüdisches Geschäft in Berlin. ${title} war ein wichtiger Teil der lokalen Wirtschaft vor der Nazi-Verfolgung.`;
  }
  
  // Return original English description
  return story.description || '';
};

export const getTranslatedBusinessName = (
  title: string,
  language: string
): string => {
  if (language === 'de') {
    // Some businesses might keep their original names for historical accuracy
    // But we can translate common terms
    return title
      .replace('Tailor Shop', 'Schneiderei')
      .replace('Department Store', 'Kaufhaus')
      .replace('Brothers', 'Gebrüder')
      .replace('and Sons', 'und Söhne')
      .replace('& Sons', '& Söhne')
      .replace('Bakery', 'Bäckerei')
      .replace('Pharmacy', 'Apotheke')
      .replace('Bookstore', 'Buchhandlung')
      .replace('Furniture', 'Möbel')
      .replace('Clothing', 'Bekleidung');
  }
  return title;
};