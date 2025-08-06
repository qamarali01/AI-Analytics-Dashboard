# AI Dashboard Setup Guide

This guide will help you set up and deploy the AI Dashboard application.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account
- Git

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd chat-to-chart-main

# Install dependencies
npm install
```

## Step 2: Supabase Setup

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2.2 Set Up Database Schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Run the SQL script

### 2.3 Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `datasets`
3. Set it as private (not public)
4. Set file size limit to 50MB
5. Add allowed MIME types: `text/csv`, `application/json`, `text/plain`

### 2.4 Configure Authentication

1. Go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Add redirect URLs for your domain

## Step 3: Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Update Supabase Client

Update `src/integrations/supabase/client.ts` with your credentials:

```typescript
const SUPABASE_URL = "your_supabase_project_url";
const SUPABASE_PUBLISHABLE_KEY = "your_supabase_anon_key";
```

## Step 5: Test the Application

```bash
# Start the development server
npm run dev
```

Visit `http://localhost:5173` and test:
1. User registration and login
2. Dataset upload (use the sample CSV/JSON files)
3. AI chat functionality
4. Data visualization

## Step 6: Deployment

### Option A: Deploy with Lovable

1. Push your code to GitHub
2. Connect your repository to Lovable
3. Deploy directly from Lovable dashboard

### Option B: Manual Deployment

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

#### Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard

#### Other Platforms
1. Build: `npm run build`
2. Upload `dist` folder to your hosting provider
3. Configure environment variables

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check your Supabase URL and key
   - Verify redirect URLs in Supabase settings
   - Ensure RLS policies are enabled

2. **File upload failing**
   - Verify storage bucket exists and is named `datasets`
   - Check storage policies are correctly set
   - Ensure file size is under 50MB

3. **Database errors**
   - Run the schema SQL script again
   - Check that all tables and policies exist
   - Verify RLS is enabled on tables

4. **Build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run lint`
   - Ensure all dependencies are installed

### Development Tips

1. **Testing with sample data**
   - Use the provided `sample-data.csv` and `sample-data.json` files
   - These files are designed to work with the visualization features

2. **Local development**
   - Use `npm run dev` for hot reloading
   - Check browser console for errors
   - Use Supabase dashboard to monitor database activity

3. **Debugging**
   - Enable Supabase logging in dashboard
   - Check network tab for API calls
   - Use React DevTools for component debugging

## Security Considerations

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use different keys for development and production

2. **Supabase Security**
   - Keep your service role key secret
   - Use RLS policies to restrict data access
   - Regularly review and update policies

3. **File Upload Security**
   - Validate file types on both client and server
   - Implement file size limits
   - Scan uploaded files for malware (consider additional services)

## Performance Optimization

1. **Database**
   - Add indexes for frequently queried columns
   - Use pagination for large datasets
   - Implement caching where appropriate

2. **Frontend**
   - Lazy load components
   - Optimize bundle size
   - Use React.memo for expensive components

3. **File Storage**
   - Compress large files before upload
   - Implement progressive loading for large datasets
   - Consider CDN for file delivery

## Monitoring and Analytics

1. **Supabase Dashboard**
   - Monitor database performance
   - Track storage usage
   - Review authentication logs

2. **Application Monitoring**
   - Add error tracking (Sentry, LogRocket)
   - Monitor user analytics
   - Track performance metrics

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Supabase documentation
3. Open an issue in the GitHub repository
4. Contact the development team

---

**Happy coding! 🚀** 