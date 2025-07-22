# Runway AI - Fashion & Pageantry Training Platform

A beautiful AI-powered platform for runway, pageantry, and fashion training with virtual try-on capabilities.

## Features

- 🎭 **Virtual Dress Try-On** - AI-powered fashion try-on using Fashn AI
- 💬 **Interview Coach** - Communication and presentation training
- 📅 **Pageant Calendar** - Event management and scheduling
- 🎯 **Live Routine** - Real-time performance tracking
- 🏠 **Dashboard** - Beautiful overview with progress tracking

## Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Fashn AI Configuration
FASHN_API_KEY=your_fashn_ai_api_key_here

# Supabase Configuration (for database)
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NODE_ENV=development
```

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy the example above into a `.env` file
   - Replace with your actual API keys

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## Fashn AI Integration

### Security Features

- ✅ **Environment Variables**: API key stored securely in `.env` file
- ✅ **Server-Side Proxy**: All Fashn AI calls made from backend
- ✅ **Authorization Headers**: Proper `Bearer` token authentication
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **GitIgnore Protection**: `.env` files excluded from version control

### API Endpoints

#### Service Status Check
```http
GET /api/fashn/status
```
Returns the current status of the Fashn AI integration.

#### Test Connection
```http
GET /api/fashn/test
```
Tests the connection to Fashn AI API with the configured API key.

#### Check Credits
```http
GET /api/fashn/credits
```
Returns your current Fashn AI credits balance.

#### Start Virtual Try-On
```http
POST /api/fashn/tryon
Content-Type: application/json

{
  "personImage": "base64_or_url",
  "garmentImage": "base64_or_url", 
  "options": {
    // Additional options
  }
}
```
Returns a prediction ID for status checking.

#### Check Prediction Status
```http
GET /api/fashn/status/:id
```
Check the status of a specific prediction using its ID.

#### Image Upload
```http
POST /api/fashn/upload
Content-Type: multipart/form-data

FormData: image file
```

#### Run Model
```http
POST /api/fashn/run
Content-Type: application/json

{
  "model": "model_name",
  "parameters": {
    // Model parameters
  }
}
```

### Usage Example

```typescript
// 1. Start a virtual try-on prediction
const tryonResponse = await fetch('/api/fashn/tryon', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    personImage: personImageUrl,
    garmentImage: garmentImageUrl,
    options: {
      // Additional options
    }
  })
});

const tryonResult = await tryonResponse.json();
const predictionId = tryonResult.data.id; // Get prediction ID

// 2. Check prediction status
const statusResponse = await fetch(`/api/fashn/status/${predictionId}`);
const statusResult = await statusResponse.json();

// 3. Check your credits balance
const creditsResponse = await fetch('/api/fashn/credits');
const creditsResult = await creditsResponse.json();
console.log('Credits:', creditsResult.data.credits);
```

## Deployment

### Environment Variables for Production

When deploying to production platforms (Vercel, Netlify, etc.), add these environment variables in your deployment dashboard:

- `FASHN_API_KEY` - Your Fashn AI API key
- `SUPABASE_URL` - Your Supabase project URL  
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `NODE_ENV=production`

### Security Notes

- **Never expose the Fashn API key in client-side code**
- **Always use the backend proxy for API calls**
- **Keep `.env` files out of version control**
- **Use environment variables in all deployment environments**

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **AI Integration**: Fashn AI API
- **Deployment**: Ready for Vercel/Netlify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

Private - All rights reserved


