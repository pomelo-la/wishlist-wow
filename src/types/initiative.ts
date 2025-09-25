export interface Initiative {
  id: string;
  title: string;
  summary: string;
  category: 'mandates' | 'performance' | 'value-prop' | 'new-product';
  vertical: 'processing' | 'core' | 'bin-sponsor' | 'card-mgmt' | 'tokenization' | 'fraud' | 'platform';
  country: 'AR' | 'BR' | 'MX' | 'CL' | 'CO' | 'ROLA' | 'cross-country';
  clientType: 'all' | 'top-issuer' | 'tier1' | 'tier2' | 'tier3';
  status: 'draft' | 'loaded' | 'business-review' | 'product-review' | 'closure' | 'scoring' | 'prioritized' | 'archived';
  economicImpact: 'significant' | 'moderate' | 'low';
  innovationLevel: 'disruptive' | 'incremental' | 'parity';
  score?: number;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  effortEstimate?: 'S' | 'M' | 'L' | 'XL';
  confidence?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetricCard {
  title: string;
  value: number;
  icon: string;
  color: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}