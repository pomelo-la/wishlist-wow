import { Initiative } from '@/types/initiative';

export const mockInitiatives: Initiative[] = [
  {
    id: '1',
    title: 'Mejora en el proceso de KYC automático',
    summary: 'Implementar validación automática de documentos para reducir tiempos de onboarding',
    category: 'performance',
    vertical: 'core',
    country: 'BR',
    clientType: 'all',
    status: 'business-review',
    economicImpact: 'significant',
    innovationLevel: 'incremental',
    score: 85,
    quarter: 'Q2',
    effortEstimate: 'M',
    confidence: 80,
    createdBy: 'Juan Pérez',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: '2',
    title: 'Nueva funcionalidad de tokenización avanzada',
    summary: 'Desarrollar sistema de tokenización para pagos cross-border',
    category: 'new-product',
    vertical: 'tokenization',
    country: 'cross-country',
    clientType: 'top-issuer',
    status: 'product-review',
    economicImpact: 'significant',
    innovationLevel: 'disruptive',
    score: 92,
    quarter: 'Q1',
    effortEstimate: 'XL',
    confidence: 65,
    createdBy: 'María García',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-25')
  },
  {
    id: '3',
    title: 'Optimización de alertas de fraude',
    summary: 'Reducir falsos positivos en el sistema de detección de fraude',
    category: 'performance',
    vertical: 'fraud',
    country: 'MX',
    clientType: 'tier1',
    status: 'prioritized',
    economicImpact: 'moderate',
    innovationLevel: 'incremental',
    score: 78,
    quarter: 'Q1',
    effortEstimate: 'L',
    confidence: 90,
    createdBy: 'Carlos López',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-30')
  },
  {
    id: '4',
    title: 'Cumplimiento regulatorio PIX Brasil',
    summary: 'Implementar nuevas reglas regulatorias para PIX en Brasil',
    category: 'mandates',
    vertical: 'processing',
    country: 'BR',
    clientType: 'all',
    status: 'loaded',
    economicImpact: 'significant',
    innovationLevel: 'parity',
    score: 95,
    quarter: 'Q1',
    effortEstimate: 'L',
    confidence: 95,
    createdBy: 'Ana Silva',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: '5',
    title: 'Dashboard de métricas en tiempo real',
    summary: 'Crear dashboard ejecutivo con métricas en tiempo real para issuers',
    category: 'value-prop',
    vertical: 'platform',
    country: 'AR',
    clientType: 'top-issuer',
    status: 'closure',
    economicImpact: 'moderate',
    innovationLevel: 'incremental',
    score: 70,
    quarter: 'Q2',
    effortEstimate: 'M',
    confidence: 85,
    createdBy: 'Luis Rodríguez',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-02-05')
  }
];

export const getInitiativesByStatus = (status: string) => {
  return mockInitiatives.filter(initiative => initiative.status === status);
};

export const getInitiativesMetrics = () => {
  const total = mockInitiatives.length;
  const byStatus = mockInitiatives.reduce((acc, initiative) => {
    acc[initiative.status] = (acc[initiative.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    loaded: byStatus['loaded'] || 0,
    businessReview: byStatus['business-review'] || 0,
    productReview: byStatus['product-review'] || 0,
    closure: byStatus['closure'] || 0,
    prioritized: byStatus['prioritized'] || 0,
    archived: byStatus['archived'] || 0
  };
};