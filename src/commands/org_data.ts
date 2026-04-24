import { faker } from '@faker-js/faker';
import { generateNewSeed, ENTITY_STORE_OPTIONS } from '../constants';
import { installPackage } from '../utils/kibana_api';
import { generateEntityStore } from './entity_store';
import { generateRulesAndAlerts } from './rules';

export type OrgSize = 'small' | 'medium' | 'enterprise';

interface OrgSizeConfig {
  users: number;
  hosts: number;
  services: number;
  genericEntities: number;
  rules: number;
  events: number;
}

const SIZE_CONFIG: Record<OrgSize, OrgSizeConfig> = {
  small: {
    users: 50,
    hosts: 30,
    services: 20,
    genericEntities: 10,
    rules: 10,
    events: 100,
  },
  medium: {
    users: 200,
    hosts: 100,
    services: 50,
    genericEntities: 30,
    rules: 50,
    events: 500,
  },
  enterprise: {
    users: 500,
    hosts: 300,
    services: 100,
    genericEntities: 100,
    rules: 100,
    events: 1000,
  },
};

const SECURITY_INTEGRATIONS = [
  'system',
  'windows',
  'linux',
  'network_traffic',
  'endpoint',
  'aws',
  'azure',
  'gcp',
  'okta',
  'o365',
  'google_workspace',
  'crowdstrike',
  'sentinel_one',
  'github',
  '1password',
];

export const generateOrgData = async ({
  size = 'enterprise',
  integrations = true,
  withAlerts = true,
  seed = generateNewSeed(),
  space,
}: {
  size?: OrgSize;
  integrations?: boolean;
  withAlerts?: boolean;
  seed?: number;
  space?: string;
} = {}) => {
  faker.seed(seed);

  const sizeConfig = SIZE_CONFIG[size];

  console.log(`\nGenerating ${size} org data (seed: ${seed})`);
  console.log(
    `  Entities: ${sizeConfig.users} users, ${sizeConfig.hosts} hosts, ${sizeConfig.services} services, ${sizeConfig.genericEntities} generic`,
  );
  console.log(
    `  Rules: ${sizeConfig.rules} detection rules, ${sizeConfig.events} events`,
  );

  if (integrations) {
    console.log('\nInstalling security integrations...');
    for (const pkg of SECURITY_INTEGRATIONS) {
      try {
        await installPackage({ packageName: pkg, space });
        console.log(`  ✓ ${pkg}`);
      } catch (error) {
        console.log(`  ✗ ${pkg} (skipped: ${(error as Error).message})`);
      }
    }
  }

  console.log('\nGenerating entity store data...');
  await generateEntityStore({
    users: sizeConfig.users,
    hosts: sizeConfig.hosts,
    services: sizeConfig.services,
    genericEntities: sizeConfig.genericEntities,
    seed,
    space,
    options: [
      ENTITY_STORE_OPTIONS.criticality,
      ENTITY_STORE_OPTIONS.riskEngine,
      ENTITY_STORE_OPTIONS.rule,
    ],
  });

  if (withAlerts) {
    console.log('\nGenerating detection rules and alerts...');
    await generateRulesAndAlerts(sizeConfig.rules, sizeConfig.events, {
      interval: '5m',
      from: 24,
      gapsPerRule: 0,
    });
    console.log(
      `  Created ${sizeConfig.rules} rules and ${sizeConfig.events} events`,
    );
  }

  console.log('\nFinished generating org data');
};
