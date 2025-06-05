import { NextApiRequest, NextApiResponse } from 'next';

// API URL cho server-side proxy (trong Docker network sử dụng service name)
const getAPIUrl = () => {
  // Trong Docker, frontend proxy sẽ gọi tới backend service
  // Kiểm tra xem có đang chạy trong Docker không
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_API_URL?.includes('backend:')) {
    return 'http://backend:5001/api';
  }
  
  // Fallback cho local development
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the path segments and join them
    const { path } = req.query;
    const pathString = Array.isArray(path) ? path.join('/') : path;
    
    // Create the target URL using Docker service name for server-side calls
    const apiUrl = getAPIUrl();
    const url = `${apiUrl}/${pathString}`;
    console.log(`Proxying request to: ${url}`);
    
    // Get the token from the request headers
    const token = req.headers.authorization;
    
    // Create headers for the backend request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = token;
    }
    
    // Forward the request to the backend
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    // Check if response is ok
    if (!response.ok) {
      console.error(`Backend responded with status: ${response.status}`);
    }
    
    // Get the response data
    const data = await response.json();
    
    // Forward the status and data to the client
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 