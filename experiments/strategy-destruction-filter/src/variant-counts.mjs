import { distinctVariants, registryRows, pathsFor } from './h2-contract.mjs';
console.log(JSON.stringify(distinctVariants(registryRows(pathsFor({}).registry)), null, 2));
