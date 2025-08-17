export const getTranslatedDescription = (
  story: any,
  language: string,
  t: (key: string) => string
): string => {
  // For German translations, provide context-aware descriptions
  if (language === 'de') {
    const businessType = story.businessType?.toLowerCase() || story.category?.toLowerCase() || '';
    
    // Check for specific business patterns
    if (businessType.includes('tailor') || businessType === 'tailoring') {
      return `Ein kleines Schneidergeschäft im Besitz von ${story.owner || story.title.split(' - ')[0]}. Das Geschäft war bekannt für hochwertige Handwerkskunst.`;
    }
    
    if (businessType.includes('department') || businessType.includes('store')) {
      return `Eines der prominenten jüdischen Kaufhäuser Berlins. ${story.title} bot eine breite Produktpalette.`;
    }
    
    if (businessType.includes('theater') || businessType.includes('cafe') || businessType.includes('café')) {
      return 'Ein beliebtes Café, das von Künstlern und Intellektuellen frequentiert wurde.';
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
    
    // Default German description
    return `Ein jüdisches Geschäft in Berlin, das von ${story.startDate ? new Date(story.startDate).getFullYear() : '1900'} bis ${story.endDate ? new Date(story.endDate).getFullYear() : '1945'} betrieben wurde.`;
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