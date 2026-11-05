async function testSignup() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test' + Math.random() + '@gmail.com',
                password: 'password123',
                role: 'creator'
            })
        });
        const data = await response.json();
        console.log('Signup Result:', data);
    } catch (err) {
        console.error('Signup Fetch Error:', err.message);
    }
}

testSignup();
