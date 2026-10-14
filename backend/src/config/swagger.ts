import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../package.json';
import { Schema, SchemaType } from 'mongoose';
import fs from 'fs';
import path from 'path';
import { User, Group, Transaction, Proposal, Notification, AIReport } from '../models';

interface ApiSchema {
  type?: string;
  properties?: Record<string, ApiSchema>;
  items?: ApiSchema;
  enum?: unknown[];
  format?: string;
  pattern?: string;
  required?: string[];
  additionalProperties?: boolean;
  oneOf?: ApiSchema[];
  $ref?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}
const modelSchemas = { User: User.schema, Group: Group.schema, Transaction: Transaction.schema,
  Proposal: Proposal.schema, Notification: Notification.schema, AIReport: AIReport.schema };
const privateFields = new Set(['password', 'refreshTokens', 'passwordResetToken', 'passwordResetExpires',
  'emailVerificationToken', 'deviceTokens', 'sessionVersion', 'tokensValidAfter', 'invitationCode',
  'eventKey', 'pushLeaseUntil', 'pushDeliveredAt', 'pushExpoDeliveredAt', 'pushFcmDeliveredAt']);
const identifier: ApiSchema = { type: 'string', pattern: '^[a-fA-F0-9]{24}$' };

function fieldSchema(field: SchemaType): ApiSchema {
  const embedded = field.getEmbeddedSchemaType();
  const nested = (field as SchemaType & { schema?: Schema }).schema;
  let result: ApiSchema;
  if (field.instance === 'Array') result = { type: 'array', items: nested ? publicSchema(nested) : embedded ? fieldSchema(embedded) : {} };
  else if (nested) result = publicSchema(nested);
  else if (field.instance === 'ObjectId') {
    const reference = field.options.ref;
    result = typeof reference === 'string' && reference in modelSchemas
      ? { oneOf: [identifier, { $ref: `#/components/schemas/${reference}` }] } : { ...identifier };
  } else if (field.instance === 'Date') result = { type: 'string', format: 'date-time' };
  else if (field.instance === 'Boolean') result = { type: 'boolean' };
  else if (field.instance === 'Number' || field.instance === 'Decimal128') result = { type: 'number' };
  else if (field.instance === 'String') result = { type: 'string' };
  else result = { type: 'object', additionalProperties: true };
  const values = (field as SchemaType & { enumValues?: unknown[] }).enumValues;
  if (values?.length) result.enum = values;
  for (const [option, attribute] of [['min', 'minimum'], ['max', 'maximum'], ['minlength', 'minLength'], ['maxlength', 'maxLength']] as const) {
    if (typeof field.options[option] === 'number') result[attribute] = field.options[option];
  }
  return result;
}
/** Build DTO documentation from the actual model fields/enums, excluding credentials and internal delivery fields. */
function publicSchema(schema: Schema): ApiSchema {
  const result: ApiSchema = { type: 'object', properties: {} };
  schema.eachPath((name, field) => {
    const parts = name.split('.');
    if (name === '__v' || parts.some(part => privateFields.has(part))) return;
    let parent = result;
    for (const part of parts.slice(0, -1)) {
      parent.properties ||= {};
      parent.properties[part] ||= { type: 'object', properties: {} };
      parent = parent.properties[part];
    }
    const leaf = parts[parts.length - 1];
    parent.properties ||= {};
    parent.properties[leaf] = fieldSchema(field);
    if (field.options.required === true) { parent.required ||= []; parent.required.push(leaf); }
  });
  return result;
}

/** Source execution and dist-only releases both resolve paths relative to this module, never the process cwd. */
export function createSwaggerSpec(runtimeRoot = path.resolve(__dirname, '..')) {
  const extension = fs.existsSync(path.join(runtimeRoot, 'routes', 'auth.routes.js')) ? 'js' : 'ts';
  const apis = ['routes', 'controllers', 'models'].map(directory => path.join(runtimeRoot, directory, `*.${extension}`).replace(/\\/g, '/'));
  const definition = {
    openapi: '3.0.0',
    info: { title: 'Badenya API', version, description: 'Contrats de gestion collaborative des groupes, cotisations et décisions.' },
    servers: [{ url: (process.env.API_URL || 'https://badenya-api.naimba.com').replace(/\/api\/v1\/?$/, '').replace(/\/$/, ''), description: 'Serveur API' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        adminCookie: { type: 'apiKey', in: 'cookie', name: 'admin_token' } },
      schemas: {
        Error: { type: 'object', properties: { status: { type: 'string', enum: ['error'] }, message: { type: 'string' }, code: { type: 'string' } } },
        Success: { type: 'object', properties: { status: { type: 'string', enum: ['success'] }, message: { type: 'string' }, data: { type: 'object', additionalProperties: true } } },
        ...Object.fromEntries(Object.entries(modelSchemas).map(([name, schema]) => [name, publicSchema(schema)])),
      },
    },
  };
  const spec = swaggerJSDoc({ swaggerDefinition: definition, apis }) as {
    paths: Record<string, Record<string, unknown>>; components: typeof definition.components; servers: typeof definition.servers;
  };
  // Include routes without an annotation so new operational endpoints are discoverable in every release.
  const mounts: Record<string, string> = { auth: '/auth', user: '/users', group: '/groups', admin: '/admin', upload: '/uploads',
    transaction: '', proposal: '', notification: '/notifications', report: '/groups', contact: '/contact', ai: '' };
  const tagNames: Record<string, string> = { auth: 'Auth', user: 'Users', group: 'Groups', admin: 'Administration', upload: 'Uploads', transaction: 'Transactions', proposal: 'Proposals', notification: 'Notifications', report: 'Reports', contact: 'Contact', ai: 'AI Insights' };
  for (const [name, prefix] of Object.entries(mounts)) {
    const file = path.join(runtimeRoot, 'routes', `${name}.routes.${extension}`);
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/router\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/g)) {
      const method = match[1];
      const endpoint = `/api/v1${prefix}${match[2] === '/' ? '' : match[2]}`.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
      spec.paths[endpoint] ||= {};
      if (spec.paths[endpoint][method]) continue;
      const isPublic = name === 'contact' || (name === 'auth' && ['register', 'login', 'refresh-token', 'forgot-password', 'reset-password'].some(route => match[2] === `/${route}`));
      spec.paths[endpoint][method] = {
        summary: `${method.toUpperCase()} ${endpoint}`, tags: [tagNames[name]],
        ...(isPublic ? {} : { security: [{ bearerAuth: [] }, { adminCookie: [] }] }),
        parameters: Array.from(endpoint.matchAll(/\{([^}]+)\}/g)).map(parameter => ({ name: parameter[1], in: 'path', required: true, schema: { type: 'string' } })),
        responses: { '200': { description: 'Consulter les contrats API pour les enveloppes et règles métier.' }, '400': { description: 'Entrée invalide' } },
      };
    }
  }
  spec.paths['/api/v1/capabilities'] ||= { get: { summary: 'Configuration des services facultatifs', responses: { '200': { description: 'data: {ai, push, email}' } } } };
  return spec;
}

export default createSwaggerSpec();
