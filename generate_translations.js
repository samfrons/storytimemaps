const fs = require('fs');
const path = require('path');

/**
 * Translation Generation Script
 * Generates translation files for timeline content in German and Yiddish
 */

// Sample timeline translations
const translations = {
  en: {
    "timeline": {
      "eliasBraun": {
        "period1": {
          "description": "A thriving tailor shop in the heart of Berlin's bustling Rosenthaler Straße. Elias Braun and his family built a respected reputation for fine men's clothing, serving both Jewish and non-Jewish customers from across the city.",
          "longDescription": "Founded in 1925, Elias Braun's tailor shop quickly became a cornerstone of the Rosenthaler Straße business district. The shop specialized in custom men's suits, attracting customers from Berlin's growing middle class. Elias, trained in traditional tailoring techniques, employed three skilled seamstresses and maintained a steady stream of orders. The family lived above the shop, with the workshop on the ground floor and large windows displaying the latest fashions. During this period, the business flourished as Berlin's economy recovered from the post-war recession.",
          "media1": {
            "caption": "The thriving tailor shop in its heyday, 1920s"
          },
          "media2": {
            "caption": "Elias Braun with his family and employees, circa 1930"
          }
        },
        "period2": {
          "description": "As Nazi persecution intensifies, the tailor shop struggles under increasing restrictions and boycotts. Non-Jewish customers stay away, and new regulations make business operations increasingly difficult for the Braun family.",
          "longDescription": "After Hitler's rise to power in January 1933, Elias Braun's shop immediately faced difficulties. The Nazi boycott of Jewish businesses in April 1933 marked the beginning of systematic economic persecution. Regular customers stopped coming, fearing association with Jewish-owned establishments. New regulations required special permits for Jewish businesses, and Elias was forced to dismiss his non-Jewish employees. The family struggled to maintain the business as their customer base dwindled to primarily Jewish patrons. Windows were occasionally marked with antisemitic graffiti, and the once-thriving shop became a shadow of its former self.",
          "media1": {
            "caption": "The shop during the boycott period - empty streets and marked windows"
          }
        },
        "period3": {
          "description": "The tailor shop is destroyed during Kristallnacht. Windows are smashed, inventory stolen, and the family is forced to flee. The business that served Berlin's community for over a decade is lost forever.",
          "longDescription": "On the night of November 9-10, 1938, during the coordinated attacks known as Kristallnacht, Elias Braun's tailor shop was targeted by SA storm troopers and local civilians. The shop windows were smashed, bolts of fabric were destroyed or stolen, and sewing machines were damaged beyond repair. The family, fearing for their safety, fled their home above the shop that same night. Elias attempted to return days later to salvage what remained, but found the premises had been completely ransacked. The building was later seized by the Nazi authorities, and the space was eventually converted to a non-Jewish business. The Braun family's decade of hard work and community presence was erased in a single night of violence.",
          "media1": {
            "caption": "Aftermath of Kristallnacht - the destroyed tailor shop, November 1938"
          }
        }
      },
      "changeIndicator": "Content changes at {date}"
    }
  }
};

// Generate translation files
Object.keys(translations).forEach(lang => {
  const businessJsonPath = path.join(__dirname, 'public', 'locales', lang, 'business.json');
  
  // Read existing business.json if it exists
  let existingTranslations = {};
  if (fs.existsSync(businessJsonPath)) {
    try {
      existingTranslations = JSON.parse(fs.readFileSync(businessJsonPath, 'utf8'));
    } catch (error) {
      console.warn(`Could not read existing ${lang} translations:`, error.message);
    }
  }

  // Merge timeline translations with existing ones
  const updatedTranslations = {
    ...existingTranslations,
    ...translations[lang]
  };

  // Ensure directory exists
  const dir = path.dirname(businessJsonPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write updated translations
  fs.writeFileSync(businessJsonPath, JSON.stringify(updatedTranslations, null, 2));
  console.log(`Updated ${lang} business translations: ${businessJsonPath}`);
});

console.log('Translation files updated successfully.');