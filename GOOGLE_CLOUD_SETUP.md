# Google Cloud Setup Guide for Expense Tracker

Follow these steps to configure the Google Sheets API for your application.

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project dropdown at the top left (next to the Google Cloud logo).
3. Click **New Project**.
4. Enter a project name (e.g., "Expense Tracker") and click **Create**.
5. Select the newly created project from the notification or the project dropdown.

## 2. Enable Google Sheets API
1. In the left sidebar, navigate to **APIs & Services** > **Library**.
2. Search for "Google Sheets API".
3. Click on **Google Sheets API** in the results.
4. Click **Enable**.

## 3. Create a Service Account
1. In the left sidebar, navigate to **APIs & Services** > **Credentials**.
2. Click **+ CREATE CREDENTIALS** at the top and select **Service account**.
3. **Step 1: Service account details**
   - Name: `expense-tracker-bot` (or similar).
   - Description: "Bot to append expenses to sheet".
   - Click **Create and Continue**.
4. **Step 2: Grant this service account access to project**
   - Role: Select **Basic** > **Editor** (or specifically Sheets API roles if you prefer stricter permissions).
   - Click **Continue**.
5. **Step 3: Grant users access to this service account**
   - You can skip this step.
   - Click **Done**.

## 4. Generate and Download Keys
1. You should now be back on the **Credentials** page.
2. Under "Service Accounts", click on the email address of the service account you just created (e.g., `expense-tracker-bot@your-project.iam.gserviceaccount.com`).
3. Go to the **Keys** tab.
4. Click **ADD KEY** > **Create new key**.
5. Select **JSON** and click **Create**.
6. A JSON file will automatically download to your computer.

## 5. Configure the Application
1. Rename the downloaded JSON file to `credentials.json`.
2. Move this `credentials.json` file into the `server` folder of your project:
   `server/credentials.json`

## 6. Share Your Google Sheet
1. Open the Google Sheet you want to use for tracking expenses.
2. Click the **Share** button in the top right corner.
3. In the "Add people and groups" field, paste the **email address of your Service Account**.
   - You can find this email in the `credentials.json` file (look for `"client_email"`) or in the Google Cloud Console under Service Accounts.
4. Ensure the permission is set to **Editor**.
5. Click **Send** (uncheck "Notify people" if you want, it doesn't matter for bots).

## 7. Get Spreadsheet ID
1. Look at the URL of your Google Sheet. It looks like this:
   `https://docs.google.com/spreadsheets/d/1aBcD_EfGhIjKlMnOpQrStUvWxYz1234567890/edit#gid=0`
2. The ID is the long string between `/d/` and `/edit`. In this example: `1aBcD_EfGhIjKlMnOpQrStUvWxYz1234567890`.
3. Open `server/.env` in your project.
4. Paste this ID as the value for `SPREADSHEET_ID`.
   ```
   SPREADSHEET_ID=1aBcD_EfGhIjKlMnOpQrStUvWxYz1234567890
   ```

You are now ready to run the application!
