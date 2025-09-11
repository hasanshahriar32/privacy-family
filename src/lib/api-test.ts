// Test script to verify API connection
import { apiClient } from './api-client';

async function testApiConnection() {
  console.log('Testing API connection...');
  
  try {
    // Test with invalid credentials first
    console.log('Testing with invalid credentials...');
    await apiClient.login({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('Expected error for invalid credentials:', errorMessage);
  }

  // You can add more tests here with valid credentials
  console.log('API test completed');
}

// This would be used for testing in development
// testApiConnection();

export { testApiConnection };
