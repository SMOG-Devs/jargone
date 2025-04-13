# jarGONE

A Chrome extension that helps decode enterprise jargon and buzzwords.

## Features

- Easily select any text on a webpage containing jargon you want to understand
- Get clear, straightforward explanations of business buzzwords and corporate jargon
- Customize your experience with different explanation levels
- Save your searches for future reference in the history tab
- Create a user profile to personalize explanations based on your role and needs

## Installation

### Prerequisites
- Make sure you have a local API server running on `http://localhost:8000` 
  that can handle jargon explanation requests

### Steps
1. Clone this repository or download the source code
   ```
   git clone https://github.com/yourusername/jargone.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" and select the folder containing the extension files

5. The jarGONE extension icon should now appear in your browser toolbar

## Usage

1. Select text containing jargon on any webpage
2. Click the jarGONE extension icon in your browser toolbar
3. View the explanation in the popup

### Tabs
- **Results**: View explanations for selected text
- **History**: Access your past searches
- **Profile**: Customize your experience

### Profile Settings
- **Explanation Level**: Choose between basic or detailed explanations
- **User Role**: Specify your job role for more personalized explanations
- **Additional Context**: Add default context that applies to all your queries

## Development

This extension connects to a local API server running on port 8000 for processing jargon explanations. The backend API should handle POST requests to the `/explain` endpoint with the following parameters:

- `text`: The selected text containing jargon to explain
- `explanationLevel`: The desired level of detail ("basic" or "detailed")
- `userRole`: The user's professional role for context
- `additionalContext`: Any additional context to help with explanations

## Troubleshooting

- If explanations are not loading, make sure your local API server is running at `http://localhost:8000`
- If text selection is not working, try refreshing the page
- For any issues with saved settings, you may need to clear the extension's storage data
