// Debug API Routing Script
// Add this to service-worker.js temporarily or run in console

async function debugAPIRouting() {
  console.log('🔍 DEBUG: Checking API Routing Configuration');
  
  // Test provider settings
  const textGenSettings = await getProviderSettings();
  console.log('📝 Text Generation Settings:', {
    provider: textGenSettings.provider,
    hasOpenRouterKey: !!textGenSettings.openRouterKey,
    openRouterTextModel: textGenSettings.openRouterTextModel,
    hasGoogleKey: !!textGenSettings.apiKey,
    geminiModel: textGenSettings.geminiModel
  });
  
  // Test image generation settings
  const visualGenSettings = await getProviderSettings();
  console.log('🎨 Visual Generation Settings:', {
    provider: visualGenSettings.provider,
    hasOpenRouterKey: !!visualGenSettings.openRouterKey,
    openRouterImageModel: visualGenSettings.openRouterImageModel,
    hasGoogleKey: !!visualGenSettings.apiKey,
    hasImagenKey: !!visualGenSettings.imagenApiKey
  });
  
  // Test OpenRouter image generation with a simple prompt
  if (visualGenSettings.provider === 'openrouter' && visualGenSettings.openRouterKey) {
    console.log('🧪 Testing OpenRouter Image Generation...');
    try {
      const testResponse = await generateImageWithOpenRouter({
        prompt: 'Test image generation debug'
      }, visualGenSettings);
      console.log('✅ OpenRouter Image Test Result:', testResponse);
    } catch (error) {
      console.error('❌ OpenRouter Image Test Failed:', error);
    }
  }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { debugAPIRouting };
}
