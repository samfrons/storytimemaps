const fs = require('fs');
const path = require('path');

/**
 * Timeline Creation Batch Script
 * Creates timeline data files for multiple businesses
 */

// Business data for timeline creation
const businesses = [
  {
    id: "5",
    name: "Rosenberg Bookstore",
    title: "Rosenberg Bookstore", 
    address: "Oranienburger Straße 25, Berlin",
    category: "Books & Publishing",
    established: "1928-09-01",
    businessType: "Bookstore",
    periods: [
      {
        start: "1928-09-01",
        end: "1933-05-10",
        title: "Literary Haven",
        description: "A beloved bookstore specializing in German literature, philosophy, and Jewish texts. The Rosenberg family created a cultural gathering place for Berlin's intellectuals and students.",
        longDescription: "Rosenberg Bookstore opened in September 1928, quickly becoming a cultural hub in Berlin's literary district. Samuel Rosenberg, a former university professor, curated an exceptional collection of German philosophy, literature, and Jewish scholarship. The store hosted author readings, intellectual discussions, and book clubs. Students from nearby universities frequented the shop, and it became known as a place where ideas flourished and communities formed around shared intellectual interests."
      },
      {
        start: "1933-05-10",
        end: "1933-05-10", 
        title: "Book Burning Devastation",
        description: "The Nazi book burnings of May 10, 1933 target the Rosenberg collection. Thousands of books are seized and burned, effectively destroying the store's inventory and purpose.",
        longDescription: "On May 10, 1933, Nazi student organizations conducted mass book burnings across Germany. The Rosenberg Bookstore was specifically targeted for its collection of Jewish authors, socialist texts, and works by intellectuals deemed 'un-German.' Storm troopers seized thousands of books from the store, which were then burned in public squares. The destruction of his life's work devastated Samuel Rosenberg, and with no inventory remaining, the store was forced to close permanently."
      }
    ]
  },
  {
    id: "6", 
    name: "Klein Medical Practice",
    title: "Dr. Klein Medical Practice",
    address: "Auguststraße 14, Berlin",
    category: "Healthcare",
    established: "1922-01-15",
    businessType: "Medical Practice",
    periods: [
      {
        start: "1922-01-15",
        end: "1938-07-31",
        title: "Healing the Community", 
        description: "Dr. Klein's practice serves Berlin's working-class families with compassionate healthcare. His clinic becomes known for treating patients regardless of their ability to pay.",
        longDescription: "Dr. Maximilian Klein established his medical practice in January 1922, serving Berlin's diverse Mitte district. Trained at Berlin University, Dr. Klein was known for his dedication to public health and his willingness to treat patients regardless of their economic circumstances. His practice included general medicine, obstetrics, and pediatric care. The doctor employed two nurses and maintained a small pharmacy. During the economic hardships of the late 1920s and early 1930s, Dr. Klein often provided free care to unemployed families."
      },
      {
        start: "1938-08-01",
        end: "1938-08-01",
        title: "License Revocation",
        description: "New Nazi regulations strip Dr. Klein of his medical license. After 16 years of dedicated service, he is forbidden from practicing medicine and forced to close his clinic.",
        longDescription: "In August 1938, new Nazi legislation revoked medical licenses from Jewish physicians. Dr. Klein, despite his excellent reputation and 16 years of community service, was suddenly prohibited from practicing medicine. His clinic was closed, his nurses dismissed, and patients were forced to find new healthcare providers. The loss of trusted medical professionals like Dr. Klein had devastating effects on community health, particularly for poor families who had relied on his charitable care."
      }
    ]
  }
];

// Create timeline JSON files
businesses.forEach(business => {
  const timelineData = {
    business: {
      id: business.id,
      name: business.name,
      address: business.address,
      category: business.category,
      established: business.established,
      businessType: business.businessType
    },
    timeline: business.periods.map(period => ({
      startDate: period.start,
      endDate: period.end,
      title: period.title,
      description: period.description,
      longDescription: period.longDescription,
      media: period.media || []
    }))
  };

  const outputPath = path.join(__dirname, 'public', 'data', 'timeline', `${business.id}.json`);
  
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write the file
  fs.writeFileSync(outputPath, JSON.stringify(timelineData, null, 2));
  console.log(`Created timeline file: ${outputPath}`);
});

console.log(`Successfully created ${businesses.length} timeline files.`);