const fetch = require('node-fetch');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

// getting parameters from the console
function createParams() {
  const args = process.argv.slice(2);
  const params = {};
  if (args.length === 0) {
    console.log('Enter the arguments in the format: key=value');
    process.exit(1);
  }
  args.forEach((arg) => {
    const [key, value] = arg.split('=');
    if (key && value) {
      params[key] = value;
    } else {
      console.log(`Invalid parameter format: "${arg}". Use key=value.`);
      process.exit(1);
    }
  });
  if (!params.username) {
    console.error('Error: The "username" parameter is required.');
    process.exit(1);
  }

  if (params.limit !== undefined) {
    params.limit = Number(params.limit);
    if (isNaN(params.limit) || params.limit <= 0) {
      console.error('Error: The "limit" parameter must be a positive number.');
      process.exit(1);
    }
  }
  if (params.offset !== undefined) {
    params.offset = Number(params.offset);
    if (isNaN(params.offset) || params.offset < 0) {
      console.error('Error: The "offset" parameter must be a number greater than or equal to zero.');
      process.exit(1);
    }
  }
  return params;
}

async function fetchData(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

async function main({ username, limit = null, offset = null }) {
  const registrationBody = { username };

  // getting  token
  console.log('Registering or logging in...');
  const token = await fetchData('http://94.103.91.4:5000/auth/registration', {
    method: 'POST',
    body: JSON.stringify(registrationBody),
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => fetchData('http://94.103.91.4:5000/auth/login', {
    method: 'POST',
    body: JSON.stringify(registrationBody),
    headers: { 'Content-Type': 'application/json' },
  }));
  if (!token || !token.token) {
    console.error('Error: Unable to authenticate the user.');
    process.exit(1);
  }

  // fetching clients list
  console.log('Fetching clients...');
  let clientsUrl = 'http://94.103.91.4:5000/clients';
  const queryParams = [];
  if (limit) queryParams.push(`limit=${limit}`);
  if (offset) queryParams.push(`offset=${offset}`);
  if (queryParams.length > 0) clientsUrl += `?${queryParams.join('&')}`;
  const clients = await fetchData(clientsUrl, {
    method: 'GET',
    headers: { Authorization: token.token, 'Content-Type': 'application/json' },
  });
  if (!clients.length) {
    console.error('No clients found.');
    process.exit(0);
  }

  // fetching statuses list
  console.log('Fetching statuses...');
  const statuses = await fetchData('http://94.103.91.4:5000/clients', {
    method: 'POST',
    body: JSON.stringify({ userIds: clients.map((item) => item.id) }),
    headers: { Authorization: token.token, 'Content-Type': 'application/json' },
  });

  const mergedArr = clients.map((client) => {
    const statusObj = statuses.find((status) => status.id === client.id);
    return { ...client, status: statusObj ? statusObj.status : null };
  });

  // connecting to Google Sheets
  console.log('Connecting to Google Sheets...');
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];
  if (!sheet) {
    console.error('Error: Google Sheets table not found');
    return;
  }
  console.log('Updating Google Sheets...');
  await sheet.clear();
  await sheet.setHeaderRow(['id', 'firstName', 'lastName', 'gender', 'address', 'city', 'phone', 'email', 'status']);

  await sheet.addRows(mergedArr.map((client) => ({
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    gender: client.gender,
    address: client.address,
    city: client.city,
    phone: client.phone,
    email: client.email,
    status: client.status,
  })));

  console.log('Data successfully added to the table.');
}
const params = createParams();
main(params).then(() => console.log('Done')).catch((err) => {
  console.log('An error occurred:', err.message);
  console.log(err.stack);
});
