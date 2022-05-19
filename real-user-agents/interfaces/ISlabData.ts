export default interface ISlabData {
  userAgents: { id: string; string: string; osId: string }[];
  chromiumBuildVersions: string[];
  browserReleaseDates: IReleaseDates;
  osReleaseDates: IReleaseDates;
  marketshare: {
    byOsId: { [osId: string]: number };
    byBrowserId: { [browserId: string]: number };
  };
  darwinToMacOsVersionMap: { [version: string]: string };
  macOsNameToVersionMap: { [name: string]: string };
  macOsVersionAliasMap: { [version: string]: string };
  winOsNameToVersionMap: { [name: string]: string };
}

export interface IReleaseDates {
  [key: string]: string;
}
