import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';

// Swagger definition
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Military Logistics API',
      version: '1.0.0',
      description: 'API documentation for Military Logistics Management System',
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server',
      },
    ],
    // Add basePath to make sure all endpoints have /api prefix
    basePath: '/api',
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Path to the API routes and OpenAPI YAML files
  apis: [
    './src/routes/*.ts', 
    './src/types/*.ts',
    './docs/openapi.yaml',
    './docs/openapi/*.yaml'
  ],
};

const specs = swaggerJsdoc(options);

// Function to ensure all paths have /api prefix
function ensureApiPrefix(spec: any) {
  if (spec && spec.paths) {
    const newPaths: Record<string, any> = {};
    
    // Process each path
    Object.keys(spec.paths).forEach(path => {
      // If the path doesn't start with /api, add it
      const newPath = path.startsWith('/api/') ? path : `/api${path}`;
      newPaths[newPath] = spec.paths[path];
    });
    
    // Replace the paths with the new ones
    spec.paths = newPaths;
  }
  return spec;
}

export function setupSwagger(app: Express) {
  // Ensure all API paths have the /api prefix
  const modifiedSpecs = ensureApiPrefix(specs);
  
  // Swagger page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(modifiedSpecs));

  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(modifiedSpecs);
  });
}