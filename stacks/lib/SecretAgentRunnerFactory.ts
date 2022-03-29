import { IRunnerFactory, IRunner } from '@double-agent/runner/interfaces/runner';
import IAssignment from '@double-agent/collect-controller/interfaces/IAssignment';
import ISessionPage from '@double-agent/collect/interfaces/ISessionPage';

import { Agent } from 'secret-agent';
import Core from '@secret-agent/core';

export default class SecretAgentRunnerFactory implements IRunnerFactory {
  connectionServerPort: number;
  connectionToCore: { host: string };

  constructor(port: number) {
    this.connectionServerPort = port;
    this.connectionToCore = {
      host: `localhost:${port}`,
    };
  }

  public runnerId(): string {
      return 'secret-agent';
  }

  public async startFactory() {
    Core.onShutdown = () => process.exit();
    await Core.start({ coreServerPort: this.connectionServerPort });
  }

  public async spawnRunner(assignment: IAssignment): Promise<IRunner> {
    const agent = new Agent({
      connectionToCore: this.connectionToCore,
      userAgent: assignment.userAgentString,
    });
    return new SecretAgentRunner(agent);
  }

  public async stopFactory() {
    return;
  }
}

class SecretAgentRunner implements IRunner {
  lastPage?: ISessionPage;
  agent: Agent;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  public async run(assignment: IAssignment) {
    console.log('--------------------------------------');
    console.log('STARTING ', assignment.id, assignment.userAgentString);
    console.log('Session ID: ', await this.agent.sessionId);
    let counter = 0;
    try {
      for (const pages of Object.values(assignment.pagesByPlugin)) {
        counter = await this.runPluginPages(assignment, pages, counter);
      }
      console.log(`[%s.✔] FINISHED ${assignment.id}`, assignment.num);
    } catch (err) {
      console.log('[%s.x] Error on %s', assignment.num, this.lastPage?.url, err);
      process.exit();
    }
  }

  async runPluginPages(
    assignment: IAssignment,
    pages: ISessionPage[],
    counter: number,
  ) {
    let isFirst = true;
    for (const page of pages) {
      this.lastPage = page;
      const step = `[${assignment.num}.${counter}]`;
      if (page.isRedirect) continue;
      if (isFirst || page.url !== (await this.agent.url)) {
        console.log('%s GOTO -- %s', step, page.url);
        const resource = await this.agent.goto(page.url);
        console.log('%s Waiting for statusCode -- %s', step, page.url);
        const statusCode = await resource.response.statusCode;
        if (statusCode >= 400) {
          console.log(`${statusCode} ERROR: `, await resource.response.text());
          console.log(page.url);
          process.exit();
        }
      }
      isFirst = false;
      console.log('%s waitForPaintingStable -- %s', step, page.url);
      await this.agent.waitForPaintingStable();

      if (page.waitForElementSelector) {
        console.log('%s waitForElementSelector -- %s', step, page.waitForElementSelector);
        const element = this.agent.document.querySelector(page.waitForElementSelector);
        await this.agent.waitForElement(element, { waitForVisible: true, timeoutMs: 60e3 });
      }

      if (page.clickElementSelector) {
        console.log('%s Wait for clickElementSelector -- %s', step, page.clickElementSelector);
        const clickable = this.agent.document.querySelector(page.clickElementSelector);
        await this.agent.waitForElement(clickable, { waitForVisible: true });
        console.log('%s Click -- %s', step, page.clickElementSelector);
        await this.agent.click(clickable);
        await this.agent.waitForLocation('change');
        console.log('%s Location Changed -- %s', step, page.url);
      }
      counter += 1;
    }

    return counter;
  }

  async stop() {
    await this.agent.close();
  }
}
