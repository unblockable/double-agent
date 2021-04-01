import { URL } from 'url';
import { CrossDomain, MainDomain, SubDomain, TlsDomain } from '../index';

export enum DomainType {
  MainDomain = 'MainDomain', // eslint-disable-line no-shadow
  SubDomain = 'SubDomain', // eslint-disable-line no-shadow
  TlsDomain = 'TlsDomain', // eslint-disable-line no-shadow
  CrossDomain = 'CrossDomain', // eslint-disable-line no-shadow
}

export function getDomainType(url: URL | string) {
  const host = typeof url === 'string' ? url : url.host;
  const domain = extractDomainFromHost(host);
  if (domain === MainDomain || domain === DomainType.MainDomain.toLowerCase()) {
    return DomainType.MainDomain;
  }
  if (domain === CrossDomain || domain === DomainType.CrossDomain.toLowerCase()) {
    return DomainType.CrossDomain;
  }
  if (domain === SubDomain || domain === DomainType.SubDomain.toLowerCase()) {
    return DomainType.SubDomain;
  }
  if (domain === TlsDomain || domain === DomainType.TlsDomain.toLowerCase()) {
    return DomainType.TlsDomain;
  }
  throw new Error(`Unknown domain type: ${domain}`);
}

export function isRecognizedDomain(host: string, recognizedDomains: string[]) {
  const domain = extractDomainFromHost(host);
  return recognizedDomains.some(x => x === domain);
}

export function addSessionIdToUrl(url: string, sessionId: string) {
  if (!url) return url;
  const startUrl = new URL(url);
  startUrl.searchParams.set('sessionId', sessionId);
  return startUrl.href;
}

export function addPageIndexToUrl(url: string, pageIndex: number) {
  if (!url) return url;
  const startUrl = new URL(url);
  startUrl.searchParams.set('pageIndex', pageIndex.toString());
  return startUrl.href;
}

export function cleanDomains(url: string) {
  if (!url) return url;

  return url
    .replace(RegExp(SubDomain, 'g'), 'SubDomain')
    .replace(RegExp(TlsDomain, 'g'), 'TlsDomain')
    .replace(RegExp(MainDomain, 'g'), 'MainDomain')
    .replace(RegExp(CrossDomain, 'g'), 'CrossDomain');
}

function extractDomainFromHost(host: string) {
  return host.split(':')[0];
}
