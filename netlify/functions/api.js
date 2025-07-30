exports.handler = async (event, context) => {
  const { path, httpMethod } = event;
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Simple API responses
    if (path === '/api/health' || path === '/.netlify/functions/api/health') {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          message: 'Quikpik API is running on Netlify'
        })
      };
    }

    // Default API response
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Quikpik API',
        path: path,
        method: httpMethod,
        timestamp: new Date().toISOString(),
        note: 'This is a simplified version for easy deployment'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};