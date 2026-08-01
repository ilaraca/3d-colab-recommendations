import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Função para criar uma nova instância do Prisma com configuração adequada
function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  
  return client;
}

// Garantir que o Prisma seja inicializado corretamente
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Em desenvolvimento, manter a instância global para evitar múltiplas conexões
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}