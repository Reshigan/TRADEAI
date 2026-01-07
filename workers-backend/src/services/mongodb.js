// MongoDB Atlas Data API client for Cloudflare Workers
// This replaces Mongoose with HTTP-based MongoDB access

export class MongoDBClient {
  constructor(env) {
    this.dataApiUrl = env.MONGODB_DATA_API_URL || 'https://data.mongodb-api.com/app/data-api/endpoint/data/v1';
    this.apiKey = env.MONGODB_API_KEY;
    this.dataSource = env.MONGODB_DATA_SOURCE || 'Cluster0';
    this.database = env.MONGODB_DATABASE || 'tradeai';
  }

  async request(action, body) {
    const response = await fetch(`${this.dataApiUrl}/action/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        dataSource: this.dataSource,
        database: this.database,
        ...body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MongoDB API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Find one document
  async findOne(collection, filter, projection = {}) {
    const result = await this.request('findOne', {
      collection,
      filter,
      projection,
    });
    return result.document;
  }

  // Find multiple documents
  async find(collection, filter = {}, options = {}) {
    const result = await this.request('find', {
      collection,
      filter,
      projection: options.projection || {},
      sort: options.sort || {},
      limit: options.limit || 100,
      skip: options.skip || 0,
    });
    return result.documents;
  }

  // Insert one document
  async insertOne(collection, document) {
    const result = await this.request('insertOne', {
      collection,
      document: {
        ...document,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return result.insertedId;
  }

  // Insert multiple documents
  async insertMany(collection, documents) {
    const result = await this.request('insertMany', {
      collection,
      documents: documents.map(doc => ({
        ...doc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    });
    return result.insertedIds;
  }

  // Update one document
  async updateOne(collection, filter, update) {
    const result = await this.request('updateOne', {
      collection,
      filter,
      update: {
        $set: {
          ...update,
          updatedAt: new Date().toISOString(),
        },
      },
    });
    return result;
  }

  // Update multiple documents
  async updateMany(collection, filter, update) {
    const result = await this.request('updateMany', {
      collection,
      filter,
      update: {
        $set: {
          ...update,
          updatedAt: new Date().toISOString(),
        },
      },
    });
    return result;
  }

  // Delete one document
  async deleteOne(collection, filter) {
    const result = await this.request('deleteOne', {
      collection,
      filter,
    });
    return result;
  }

  // Delete multiple documents
  async deleteMany(collection, filter) {
    const result = await this.request('deleteMany', {
      collection,
      filter,
    });
    return result;
  }

  // Count documents
  async countDocuments(collection, filter = {}) {
    const result = await this.request('aggregate', {
      collection,
      pipeline: [
        { $match: filter },
        { $count: 'total' },
      ],
    });
    return result.documents[0]?.total || 0;
  }

  // Aggregate pipeline
  async aggregate(collection, pipeline) {
    const result = await this.request('aggregate', {
      collection,
      pipeline,
    });
    return result.documents;
  }
}

// Helper to get MongoDB client from context
export function getMongoClient(c) {
  if (!c.get('mongodb')) {
    c.set('mongodb', new MongoDBClient(c.env));
  }
  return c.get('mongodb');
}
