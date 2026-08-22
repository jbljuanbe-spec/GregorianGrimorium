import type { OfferStatus } from "../drizzle/schema";

export type OfferFilterInput = {
  query?: string;
  location?: string;
  modality?: string;
  contractType?: string;
  area?: string;
  publishedAfter?: Date;
  status?: OfferStatus;
};

export type FilterableOffer = {
  title: string;
  company: string;
  description: string;
  location: string;
  modality: string;
  contractType: string;
  area: string;
  publishedAt: Date | null;
  applicationStatus: OfferStatus;
};

const includes = (value: string, search: string) => value.toLocaleLowerCase("es-ES").includes(search.toLocaleLowerCase("es-ES"));

export function filterOfferRecords<T extends FilterableOffer>(offers: T[], filters: OfferFilterInput): T[] {
  return offers.filter(offer => {
    if (filters.query && ![offer.title, offer.company, offer.description].some(value => includes(value, filters.query!))) return false;
    if (filters.location && !includes(offer.location, filters.location)) return false;
    if (filters.modality && offer.modality !== filters.modality) return false;
    if (filters.contractType && !includes(offer.contractType, filters.contractType)) return false;
    if (filters.area && !includes(offer.area, filters.area)) return false;
    if (filters.publishedAfter && (!offer.publishedAt || offer.publishedAt < filters.publishedAfter)) return false;
    if (filters.status && offer.applicationStatus !== filters.status) return false;
    return true;
  });
}
