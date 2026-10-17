import { cedarCrossing } from './cedar-crossing.js';
import { elderTree } from './elder-tree.js';
import { falls } from './falls.js';
import { lighthouse } from './lighthouse.js';
import { mooncapGlade } from './mooncap-glade.js';
import { mossGate } from './moss-gate.js';
import { overlook } from './overlook.js';
import { singingStones } from './singing-stones.js';
import { spring } from './spring.js';
import { stargazer } from './stargazer.js';
import { tidePools } from './tide-pools.js';
import { wreck } from './wreck.js';

/**
 * Every discoverable place, in the order the journal lists them.
 * To add a landmark: give it a spot in world/layout.js PLACES, write a module with
 * { id, name, message, build(context) }, and add it here.
 */
export const LANDMARKS = [
  singingStones, elderTree, cedarCrossing, mossGate, falls, spring,
  stargazer, mooncapGlade, overlook, wreck, lighthouse, tidePools,
];
