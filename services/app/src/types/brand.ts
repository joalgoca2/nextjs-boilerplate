export interface Brand {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  defaultLocale: string;
  timezone: string;
  currency: string;
  apiKey?: string | null;
  billingWebhookUrl?: string | null;
  generalWebhookUrl?: string | null;
  isWebhookEnabled?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
