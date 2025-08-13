import Homepage from '../components/Homepage';
import { TranslationProvider } from '../../i18n/TranslationContext';
import fs from 'fs';
import path from 'path';

async function getBusinessData() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'jewish_businesses.geojson');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.features || [];
  } catch (error) {
    console.error('Error loading business data:', error);
    return [];
  }
}

async function getStoryMapData() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'storymaps.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data || [];
  } catch (error) {
    console.error('Error loading storymap data:', error);
    return [];
  }
}

export default async function HomepageRoute() {
  const businessData = await getBusinessData();
  const storyMapData = await getStoryMapData();
  
  return (
    <TranslationProvider>
      <Homepage businessData={businessData} storyMapData={storyMapData} />
    </TranslationProvider>
  );
}