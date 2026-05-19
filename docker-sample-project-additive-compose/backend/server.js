const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;
const dataDir = '/app/data';

app.use(cors());
app.use(express.json());

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function readEnv(name, fallback = '') {
  const value = process.env[name];
  return value === undefined || value === null || value === '' ? fallback : value;
}

function readBooleanEnv(name) {
  const value = String(process.env[name] || '').trim().toLowerCase();
  return value === 'true' || value === '1' || value === 'yes';
}

const ownerEnvName = 'OWNER_NAME';
const ownerName = readEnv(ownerEnvName, 'Sakib');
const nameFieldEnvName = 'ENABLE_NAME_FIELD';
const addressFieldEnvName = 'ENABLE_ADDRESS_FIELD';
const isNameFieldEnabled = readBooleanEnv(nameFieldEnvName);
const isAddressFieldEnabled = readBooleanEnv(addressFieldEnvName);

let currentName = readEnv('NAME_VALUE', ownerName);
let currentAddress = readEnv('ADDRESS_VALUE', 'Dhaka, Bangladesh');

function appendLog(fileName, line) {
  fs.appendFileSync(path.join(dataDir, fileName), line);
}

function readLog(fileName) {
  const fullPath = path.join(dataDir, fileName);

  if (!fs.existsSync(fullPath)) {
    return [];
  }

  return fs
    .readFileSync(fullPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function getConfig() {
  return {
    owner: {
      envVariableName: ownerEnvName,
      value: ownerName
    },
    featureFlags: {
      name: {
        envVariableName: nameFieldEnvName,
        value: process.env[nameFieldEnvName] || '',
        enabled: isNameFieldEnabled
      },
      address: {
        envVariableName: addressFieldEnvName,
        value: process.env[addressFieldEnvName] || '',
        enabled: isAddressFieldEnabled
      }
    },
    fields: [
      isNameFieldEnabled
        ? {
            key: 'name',
            label: 'Name',
            value: currentName,
            placeholder: 'Enter a new name',
            apiPath: '/api/name'
          }
        : null,
      isAddressFieldEnabled
        ? {
            key: 'address',
            label: 'Address',
            value: currentAddress,
            placeholder: 'Enter a new address',
            apiPath: '/api/address'
          }
        : null
    ].filter(Boolean)
  };
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    ownerEnvName,
    ownerName,
    isNameFieldEnabled,
    isAddressFieldEnabled
  });
});

app.get('/api/config', (req, res) => {
  res.json(getConfig());
});

app.get('/api/name', (req, res) => {
  if (!isNameFieldEnabled) {
    return res.status(404).json({
      error: 'Name field is not enabled. Add compose.name.yaml to the docker compose command.',
      requiredComposeFile: 'compose.name.yaml'
    });
  }

  res.json({ name: currentName });
});

app.post('/api/name', (req, res) => {
  if (!isNameFieldEnabled) {
    return res.status(404).json({
      error: 'Name field is not enabled. Add compose.name.yaml to the docker compose command.',
      requiredComposeFile: 'compose.name.yaml'
    });
  }

  const newName = String(req.body.name || '').trim();

  if (!newName) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const oldName = currentName;
  currentName = newName;
  appendLog('name_changes.txt', `${oldName} changed his name to ${newName} - ${new Date().toISOString()}\n`);

  res.json({ message: 'Name updated', name: currentName });
});

app.get('/api/address', (req, res) => {
  if (!isAddressFieldEnabled) {
    return res.status(404).json({
      error: 'Address field is not enabled. Add compose.address.yaml to the docker compose command.',
      requiredComposeFile: 'compose.address.yaml'
    });
  }

  res.json({ address: currentAddress });
});

app.post('/api/address', (req, res) => {
  if (!isAddressFieldEnabled) {
    return res.status(404).json({
      error: 'Address field is not enabled. Add compose.address.yaml to the docker compose command.',
      requiredComposeFile: 'compose.address.yaml'
    });
  }

  const newAddress = String(req.body.address || '').trim();

  if (!newAddress) {
    return res.status(400).json({ error: 'Address is required' });
  }

  const oldAddress = currentAddress;
  currentAddress = newAddress;
  appendLog('address_changes.txt', `${oldAddress} changed his address to ${newAddress} - ${new Date().toISOString()}\n`);

  res.json({ message: 'Address updated', address: currentAddress });
});

app.get('/api/logs', (req, res) => {
  res.json({
    nameChanges: readLog('name_changes.txt'),
    addressChanges: readLog('address_changes.txt')
  });
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
  console.log(`${ownerEnvName}=${ownerName}`);
  console.log(`${nameFieldEnvName}=${process.env[nameFieldEnvName] || ''}`);
  console.log(`${addressFieldEnvName}=${process.env[addressFieldEnvName] || ''}`);
});
