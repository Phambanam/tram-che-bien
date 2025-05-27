import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

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
  // Path to the API routes
  apis: ['./src/routes/*.ts', './src/types/*.ts'],
};

const specs = swaggerJsdoc(options);

export function setupSwagger(app: Express) {
  // Swagger page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

  // Docs in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}