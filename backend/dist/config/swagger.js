"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwagger = setupSwagger;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
// Swagger definition
const options = {
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
const specs = (0, swagger_jsdoc_1.default)(options);
// Function to ensure all paths have /api prefix
function ensureApiPrefix(spec) {
    if (spec && spec.paths) {
        const newPaths = {};
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
function setupSwagger(app) {
    // Ensure all API paths have the /api prefix
    const modifiedSpecs = ensureApiPrefix(specs);
    // Swagger page
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(modifiedSpecs));
    // Docs in JSON format
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(modifiedSpecs);
    });
}
