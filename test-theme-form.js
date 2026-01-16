// Quick test script to verify theme form data collection
import { getThemeFormData } from './themeModal.js';

console.log('🧪 Testing theme form data collection...');

// Simulate form data
setTimeout(async () => {
    try {
        const testData = await getThemeFormData();
        console.log('✅ Form data collected successfully:', testData);

        if (!testData.name || !testData.slug) {
            console.error('❌ CRITICAL: name or slug is missing!');
            console.log('Name:', testData.name);
            console.log('Slug:', testData.slug);
        } else {
            console.log('✅ All required fields present');
        }
    } catch (error) {
        console.error('❌ Error collecting form data:', error);
    }
}, 1000);
