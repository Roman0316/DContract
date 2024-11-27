## Deploy

1. Install dependencies `npm install`
2. Create a service account in Google Cloud Console.
3. Download the JSON file with the credentials.
4. Create .env file based on .env.example
5. You must ensure that the application has access to the following environment variables:

- GOOGLE_CLIENT_EMAIL - The email address of the service account used to authenticate with the Google Sheets API. This is part of the JSON credentials file for your Google Cloud project.
  Example Value: service-account-name@project-id.iam.gserviceaccount.com

- GOOGLE_PRIVATE_KEY - The private key associated with the service account, used to securely authenticate API requests.
  Example Value: "-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkq...-----END PRIVATE KEY-----"

- GOOGLE_SPREADSHEET_ID - The unique identifier for the Google Spreadsheet you want to interact with. You can find this ID in the URL of the Google Spreadsheet. For example, in the URL https://docs.google.com/spreadsheets/d/1CiFzfBD9vM0vMuNWstJZpErhvZtNS3lnWofZcixaG6o/edit, the ID is the part between /d/ and /edit.
  Example Value: 1CiFzfBD9vM0vMuNWstJZpErhvZtNS3lnWofZcixaG6o

6. Start script.
   Example: node index.js username=testUser00004 limit=10 offset=5
