import StringCheck from '@double-agent/analyze/lib/checks/StringCheck';
import ITlsClienthelloProfile from '@double-agent/collect-tls-clienthello/interfaces/IProfile';
import IClientHello from '@double-agent/tls-server/interfaces/IClientHello';
import NumberCheck from '@double-agent/analyze/lib/checks/NumberCheck';
import BooleanCheck from '@double-agent/analyze/lib/checks/BooleanCheck';

export const extensionTypes: Set<string> = new Set();
export const usedExtensionTypes: Set<string> = new Set();

export default class CheckGenerator {
  public readonly checks = [];

  private readonly userAgentId: string;
  private readonly clientHello: IClientHello;
  private hasGrease = false;

  constructor(profile: ITlsClienthelloProfile) {
    this.userAgentId = profile.userAgentId;
    this.clientHello = profile.data.clientHello;
    this.createVersionCheck();
    this.createCipherChecks();
    this.createExtensionChecks();
    this.createCurveChecks();
    this.createPointFormatChecks();
    this.createSupportedVersionChecks();
    this.createSignatureAlgos();
    this.createAlpnChecks();
    this.createGreaseCheck();
  }

  private createVersionCheck() {
    const { userAgentId, clientHello } = this;
    const matches = clientHello.version.match(/^([^\s]+)\s\((.+)\)$/);
    const valueInt = Number(matches[1]);
    const valueStr = matches[2];
    this.checks.push(
      new NumberCheck({ userAgentId }, { path: 'clientHello.version' }, valueInt, valueStr),
    );
  }

  private createCipherChecks() {
    const { userAgentId, clientHello } = this;

    for (const cipher of clientHello.ciphers) {
      const matches = cipher.match(/^\{(.+)\}\s(.+)$/);
      const valueInt = parseInt(matches[1].replace(/0x/g, '').replace(', ', ''), 16);
      const valueStr = matches[2];
      if (this.isGreased(valueInt)) continue;
      this.checks.push(
        new NumberCheck({ userAgentId }, { path: 'clientHello.ciphers' }, valueInt, valueStr),
      );
    }
  }

  private createExtensionChecks() {
    const { userAgentId, clientHello } = this;
    if (!clientHello.extensions) return;

    const path = 'clientHello.extensions.decimal';
    for (const extension of clientHello.extensions) {
      if (this.isGreased(extension.decimal)) continue;
      extensionTypes.add(extension.type);
      this.checks.push(
        new NumberCheck({ userAgentId }, { path }, extension.decimal, extension.type),
      );
    }
  }

  private createCurveChecks() {
    const { userAgentId, clientHello } = this;
    if (!clientHello.extensions) return;

    usedExtensionTypes.add('supported_groups');
    const path = 'clientHello.extensions.supported_groups';
    const extension = clientHello.extensions.find(x => x.type === 'supported_groups');
    const values: string[] = extension?.values || [];

    for (const value of values) {
      const matches = value.match(/^([^\s]+).*\((\d+)\)/);
      const valueStr = matches[1];
      const valueInt = Number(matches[2]);
      if (this.isGreased(valueInt)) continue;
      this.checks.push(new NumberCheck({ userAgentId }, { path }, valueInt, valueStr));
    }
  }

  private createPointFormatChecks() {
    const { userAgentId, clientHello } = this;
    if (!clientHello.extensions) return;

    usedExtensionTypes.add('ec_point_formats');
    const path = 'clientHello.extensions.ec_point_formats';
    const extension = clientHello.extensions.find(x => x.type === 'ec_point_formats');
    const values: string[] = extension?.values || [];

    for (const value of values) {
      const valueInt = Number(value.match(/\((\d+)\)/)[1]);
      if (this.isGreased(valueInt)) continue;
      this.checks.push(new StringCheck({ userAgentId }, { path }, value));
    }
  }

  private createSupportedVersionChecks() {
    const { userAgentId, clientHello } = this;
    if (!clientHello.extensions) return;

    usedExtensionTypes.add('supported_versions');
    const path = 'clientHello.extensions.supported_versions';
    const extension = clientHello.extensions.find(x => x.type === 'supported_versions');
    const values: string[] = extension?.values || [];

    for (const value of values) {
      const valueInt = Number(value.match(/\((\d+)\)/)[1]);
      if (this.isGreased(valueInt)) continue;
      this.checks.push(new StringCheck({ userAgentId }, { path }, value));
    }
  }

  private createSignatureAlgos() {
    const { userAgentId, clientHello } = this;
    if (!clientHello.extensions) return;

    usedExtensionTypes.add('signature_algorithms');
    const path = 'clientHello.extensions.signature_algorithms';
    const extension = clientHello.extensions.find(x => x.type === 'signature_algorithms');
    const values: string[] = extension?.values || [];

    for (const value of values) {
      const valueInt = Number(value.split('(').pop().replace(')', ''));
      if (this.isGreased(valueInt)) continue;
      this.checks.push(new StringCheck({ userAgentId }, { path }, value));
    }
  }

  private createAlpnChecks() {
    const { userAgentId, clientHello } = this;
    if (!clientHello.extensions) return;

    usedExtensionTypes.add('application_layer_protocol_negotiation');
    const path = 'clientHello.extensions.application_layer_protocol_negotiation';
    const extension = clientHello.extensions.find(
      x => x.type === 'application_layer_protocol_negotiation',
    );
    const values: string[] = extension?.values || [];

    for (const value of values) {
      this.checks.push(new StringCheck({ userAgentId }, { path }, value));
    }
  }

  private createGreaseCheck() {
    const { userAgentId, hasGrease } = this;

    const path = 'clientHello.isGreased';
    this.checks.push(new BooleanCheck({ userAgentId }, { path }, hasGrease));
  }

  private isGreased(num: number) {
    const hasGrease = greaseCiphers.includes(num);
    if (hasGrease) this.hasGrease = true;
    return hasGrease;
  }
}

const greaseCiphers = [
  0x0a0a, 0x1a1a, 0x2a2a, 0x3a3a, 0x4a4a, 0x5a5a, 0x6a6a, 0x7a7a, 0x8a8a, 0x9a9a, 0xaaaa, 0xbaba,
  0xcaca, 0xdada, 0xeaea, 0xfafa,
];
