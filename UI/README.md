# A11Y Poster Evaluation - UI

React frontend for the Poster Evaluation accessibility tool.

## Setup

```bash
cd UI
npm install
```

## Run Development Server

```bash
npm run dev
```

The app will run on `http://localhost:3000`

## Build for Production

```bash
npm run build
```

## API Connection

The frontend connects to the Flask backend at `http://localhost:5000`

Make sure the backend is running before starting the frontend.

## Features

- Upload poster images via drag-and-drop or file picker
- Analyze accessibility metrics:
  - Color contrast evaluation
  - Image resolution quality
  - Link validation
  - Component detection (logos, figures, diagrams)
- View detailed analysis results with visual feedback
- Navigate between different analysis views
