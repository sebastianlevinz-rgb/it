
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => {
    // If we are in production or have a specific PG URL, use the adapter
    // Note: For local SQLite dev, we might still want the default client if not using PG
    // But based on the user request, they are targeting Vercel Postgres.
    // We'll check if the connection string looks like postgres.

    if (connectionString?.startsWith('postgres') || connectionString?.startsWith('postgresql')) {
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        return new PrismaClient({ adapter });
    }

    // Fallback for local development (e.g. SQLite if still used, or direct connection)
    return new PrismaClient();
};

export const prisma = globalForPrisma.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
