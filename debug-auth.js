const fetch = require('node-fetch');

async function testAuth() {
  try {
    // Test login
    console.log('Testing login...');
    const loginResponse = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      console.log('Login failed:', loginResponse.status, await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData);

    const token = loginData.token;

    // Test get profile
    console.log('\nTesting get profile...');
    const profileResponse = await fetch('http://localhost:5001/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!profileResponse.ok) {
      console.log('Profile failed:', profileResponse.status, await profileResponse.text());
      return;
    }

    const profileData = await profileResponse.json();
    console.log('Profile data:', JSON.stringify(profileData, null, 2));

    // Test create dish
    console.log('\nTesting create dish...');
    const dishResponse = await fetch('http://localhost:5001/api/dishes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Dish',
        description: 'Test description',
        mainLTTP: {
          lttpId: '123',
          lttpName: 'Test LTTP',
          category: 'Test Category'
        },
        ingredients: [],
        servings: 10,
        preparationTime: 30,
        difficulty: 'easy',
        category: 'Test'
      })
    });

    console.log('Dish creation status:', dishResponse.status);
    const dishData = await dishResponse.text();
    console.log('Dish response:', dishData);

  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth(); 