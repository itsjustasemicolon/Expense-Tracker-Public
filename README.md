# Expense Tracker

A comprehensive full-stack expense tracking solution designed to help users manage their personal finances effectively. Built with a modern technology stack featuring React (Vite) for the frontend and Node.js (Express) for the backend, this application leverages the Google Sheets API for reliable and accessible data storage.

### [View Project Demonstration](https://youtu.be/Sqtyaru56o8)

## Tech Stack

### Frontend
- **React (Vite)**: Modern UI library for building the interface.
- **CSS3**: Custom styling with a glassmorphism design.
- **Recharts**: For rendering the interactive charts and graphs.

### Backend
- **Node.js & Express**: Handles API requests and server logic.
- **Google Sheets API**: Acts as the database for storing data.

### Deployment
- **Netlify**: Hosts the frontend and serverless backend functions.

## Key Features

### Smart Savings Management
- **Visual Progress Tracking**: Monitor your savings goals with dynamic progress rings that visually indicate your achievement level.
- **Intelligent Insights**: Receive automated calculations on daily or monthly savings requirements to meet your target dates.
- **Seamless Transactions**: Add funds to or withdraw from your savings goals directly through an intuitive interface.
- **Achievement Recognition**: Celebrate milestones with interactive visual feedback upon reaching your financial targets.

### Financial Analytics
- **Interactive Data Visualization**: Gain insights into your spending habits through detailed Pie Charts and Area Charts.
- **Budget Control**: Establish monthly budgets and track your adherence with real-time visual indicators.
- **Trend Analysis**: Analyze your daily spending patterns over time using sophisticated gradient-filled area charts.
- **Reporting**: Generate and download comprehensive expense reports in PDF format for offline analysis.

### User Experience Design
- **Modern Interface**: Experience a sleek, Apple-inspired design featuring glassmorphism effects, refined typography, and smooth transitions.
- **Theme Support**: Fully integrated dark mode that automatically adapts to your system preferences for comfortable viewing in any environment.
- **Responsive Layout**: A fully responsive design ensures a consistent and optimized experience across desktop, tablet, and mobile devices.

## Architecture

This project utilizes a **Serverless Architecture** where the backend API is deployed as a serverless function on Netlify. The unique aspect of this architecture is the use of **Google Sheets as a Database**. This approach offers several advantages:
- **Zero Cost**: No need for expensive database hosting.
- **Accessibility**: Data can be viewed and edited manually via the familiar Google Sheets interface.
- **Real-time Sync**: Changes made in the app are instantly reflected in the sheet, and vice-versa.

## System Requirements

- **Node.js**: Runtime environment for executing JavaScript code server-side.
- **Google Cloud Platform**: A project with the Google Sheets API enabled.
- **Service Account**: A Google Cloud Service Account with a valid JSON key file.
- **Google Sheet**: A spreadsheet shared with the Service Account's email address for data persistence.

## Installation & Configuration

### 1. Backend Configuration

1. Navigate to the server directory:
   ```bash
   cd server
   npm install
   ```

2. Configure the Google Sheets API integration:
   - Place your Service Account JSON key file in `server/credentials.json`.
   - Rename `.env.example` to `.env` in the `server/` directory and update your Spreadsheet ID:
     ```
     PORT=5000
     SPREADSHEET_ID=your_spreadsheet_id_here
     ```

### 2. Frontend Configuration

1. Navigate to the client directory:
   ```bash
   cd client
   npm install
   ```

2. Configure Security:
   - The default PIN is set to `123456`.
   - To change this, open `client/src/components/PinScreen.jsx` and update the PIN value in the `handleSubmit` function.

## Development Server

You can launch both the client and server simultaneously using the VS Code Task "Run Full Stack", or execute them manually via the terminal:

**Server Application:**
```bash
cd server
npm start
```

**Client Application:**
```bash
cd client
npm run dev
```

The frontend application will be accessible at `http://localhost:5173`, while the backend API will operate at `http://localhost:5000`.

---

## Google Cloud Integration Guide

Follow these detailed steps to configure the Google Sheets API for your application.

### 1. Project Initialization
1. Access the [Google Cloud Console](https://console.cloud.google.com/).
2. Select the project dropdown menu located at the top left.
3. Choose **New Project**.
4. Enter a descriptive project name (e.g., "Expense Tracker") and select **Create**.
5. Select the newly created project from the notifications panel or project dropdown.

### 2. API Activation
1. Navigate to **APIs & Services** > **Library** in the left sidebar.
2. Search for "Google Sheets API".
3. Select **Google Sheets API** from the search results.
4. Click **Enable** to activate the API for your project.

### 3. Service Account Creation
1. Navigate to **APIs & Services** > **Credentials**.
2. Click **+ CREATE CREDENTIALS** and select **Service account**.
3. **Step 1: Service account details**
   - Name: `expense-tracker-bot` (or similar).
   - Description: "Automated service for expense data management".
   - Click **Create and Continue**.
4. **Step 2: Grant access**
   - Role: Select **Basic** > **Editor** (or configure specific Sheets API roles for granular access control).
   - Click **Continue**.
5. **Step 3: User access**
   - This step is optional and can be skipped.
   - Click **Done**.

### 4. Key Generation
1. Return to the **Credentials** dashboard.
2. Under "Service Accounts", select the email address of the newly created service account.
3. Navigate to the **Keys** tab.
4. Click **ADD KEY** > **Create new key**.
5. Select **JSON** format and click **Create**.
6. The JSON key file will automatically download to your local machine.

### 5. Application Configuration
1. Rename the downloaded JSON file to `credentials.json`.
2. Move this file to the `server` directory of your project:
   `server/credentials.json`

### 6. Spreadsheet Access
1. Open the Google Sheet intended for expense tracking.
2. Click the **Share** button in the top right corner.
3. In the "Add people and groups" field, enter the **email address of your Service Account**.
   - This email can be found in the `credentials.json` file (field: `"client_email"`) or in the Google Cloud Console.
4. Ensure the permission level is set to **Editor**.
5. Click **Send**.

### 7. Spreadsheet ID Configuration
1. Locate the URL of your Google Sheet. It follows this format:
   `https://docs.google.com/spreadsheets/d/1aBcD_EfGhIjKlMnOpQrStUvWxYz1234567890/edit#gid=0`
2. Extract the ID string located between `/d/` and `/edit`. In this example: `1aBcD_EfGhIjKlMnOpQrStUvWxYz1234567890`.
3. Open the `server/.env` file in your project.
4. Assign this ID to the `SPREADSHEET_ID` variable:
   ```
   SPREADSHEET_ID=1aBcD_EfGhIjKlMnOpQrStUvWxYz1234567890
   ```

---

## Production Deployment

This project is optimized for deployment on Netlify, utilizing `netlify-lambda` functions to host the backend serverless infrastructure.

### Deployment Procedure

1. **Version Control**: Ensure your project is committed and pushed to a GitHub repository.

2. **Netlify Configuration**: Log in to [Netlify](https://www.netlify.com/).

3. **Site Creation**:
   - Select **Add new site** > **Import an existing project**.
   - Choose **GitHub** as your Git provider.
   - Select your repository.

4. **Build Configuration**:
   Netlify should automatically detect settings from `netlify.toml`. Verify the following:
   - **Base directory**: (leave empty or `/`)
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`

5. **Environment Variables**:
   Navigate to **Site settings > Environment variables** and define the following keys (values are derived from your `server/credentials.json` and `server/.env`):

   | Key | Value |
   |-----|-------|
   | `SPREADSHEET_ID` | Your Google Sheet ID (from `.env`) |
   | `GOOGLE_CLIENT_EMAIL` | The `client_email` value from your `credentials.json` |
   | `GOOGLE_PRIVATE_KEY` | The `private_key` value from your `credentials.json` (Ensure the entire string including `-----BEGIN PRIVATE KEY...` and `\n` is copied) |

6. **Deploy**: Select **Deploy site** to initiate the build process.

### Troubleshooting
- **Private Key Errors**: If you encounter issues related to the private key, verify that the entire string was copied correctly. The application logic is designed to parse the `\n` characters within the private key string automatically.

---

## Academic Integrity & Usage

This project is open-source under the MIT License, meaning you are free to use, modify, and distribute it. However, **if you are a student**, please adhere to the following:

- **Do not submit this code as your own coursework.**
- **Plagiarism is a serious offense.** Using this project to bypass academic requirements is unethical and likely violates your institution's policies.

This repository is intended as a portfolio piece and a learning resource for the developer community.

