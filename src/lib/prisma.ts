
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => {
    // Resilience: Check for database connection string
    if (!connectionString) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('DATABASE_URL or POSTGRES_PRISMA_URL is missing. Cannot initialize Prisma Client in production.');
        } else {
            console.warn('Warning: DATABASE_URL is missing. Prisma Client will try to use default local configuration or fail.');
        }
    }

    // If we are in production or have a specific PG URL, use the adapter
    if (connectionString?.startsWith('postgres') || connectionString?.startsWith('postgresql')) {
        const pool = new Pool({
            connectionString,
            max: 10, // Default to 10 connections
            connectionTimeoutMillis: 5000, // Timeout after 5s
        });

        // Resilience: Handle pool errors without crashing
        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            // Don't exit process here, let the handler manage it or Vercel restart
        });

        const adapter = new PrismaPg(pool);
        return new PrismaClient({ adapter });
    }

    // Fallback for local development (e.g. SQLite if still used, or direct connection)
    return new PrismaClient();
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
