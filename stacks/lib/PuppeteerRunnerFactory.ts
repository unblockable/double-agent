import { IRunner, IRunnerFactory } from '@double-agent/runner/interfaces/IRunnerFactory';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import { Browser, launch } from 'puppeteer';
import PuppeteerRunner from './PuppeteerRunner';

export default class PuppeteerRunnerFactory implements IRunnerFactory {
  browser?: Browser;

  public runnerId(): string {
    return 'puppeteer';
  }

  public async startFactory() {
    this.browser = await launch({
      headless: true,
      ignoreHTTPSErrors: true,
    });
  }

  public async spawnRunner(assignment: IAssignment): Promise<IRunner> {
    const browserContext = await this.browser.createIncognitoBrowserContext();
    const page = await browserContext.newPage();
    await page.setUserAgent(assignment.userAgentString);
    return new PuppeteerRunner(page);
  }

  public async stopFactory() {
    await this.browser.close();
  }
}
