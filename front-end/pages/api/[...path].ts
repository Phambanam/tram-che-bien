import { NextApiRequest, NextApiResponse } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get the path segments and join them
    const { path } = req.query;
    const pathString = Array.isArray(path) ? path.join('/') : path;
    
    // Create the target URL
    const url = `${API_URL}/${pathString}`;
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
      credentials: 'include',
    });
    
    // Get the response data
    const data = await response.json();
    
    // Forward the status and data to the client
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.'
    });
  }
} 