# AI Dashboard - Chat to Chart
# The Web App is Live - [here](https://ai-analytics-dashboard-7i5iyzkxt-qamarali01s-projects.vercel.app/)

A powerful AI-powered dashboard that allows users to upload data, get instant insights through AI chat assistance, and create beautiful visualizations.

## 🚀 Features

### 🔐 Authentication
- Secure email/password authentication using Supabase Auth
- User session management
- Protected routes and dashboard access

### 💬 AI Chat Assistant
- **General Mode**: Ask questions and get AI-powered responses
- **Data Analysis Mode**: Context-aware AI responses based on your uploaded datasets
- Real-time chat interface with message history
- Dataset context integration for data-specific insights

### 📊 Dataset Management
- Upload CSV, JSON, and text files
- Automatic data parsing and column detection
- File size and row count tracking
- Dataset metadata management (name, description)
- Sample data preview
- Secure file storage with Supabase Storage

### 📈 Data Visualization
- Interactive charts: Bar, Line, and Pie charts
- Dynamic chart generation based on dataset columns
- Real-time data visualization using Recharts
- Export capabilities (coming soon)
- Data table view for raw data inspection

### 🎨 Modern UI
- Beautiful, responsive design with shadcn/ui components
- Dark/light theme support
- Mobile-friendly interface
- Intuitive navigation with sidebar
- Toast notifications for user feedback

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui + Tailwind CSS + Radix UI
- **Backend**: Supabase (Auth, Database, Storage)
- **Charts**: Recharts
- **State Management**: React Query + React hooks
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd chat-to-chart-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Set up the following tables in your database:
     ```sql
     -- Datasets table
     CREATE TABLE datasets (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
       name TEXT NOT NULL,
       description TEXT,
       file_path TEXT,
       file_size BIGINT,
       row_count INTEGER,
       columns TEXT[],
       sample_data JSONB,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );

     -- Chat messages table
     CREATE TABLE chat_messages (
       id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
       content TEXT NOT NULL,
       is_user BOOLEAN NOT NULL,
       dataset_context TEXT,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
     );
     ```
   - Create a storage bucket named 'datasets' for file uploads
   - Update the Supabase configuration in `src/integrations/supabase/client.ts`

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🎯 Usage

### Getting Started
1. Visit the application and sign up for an account
2. Sign in to access your dashboard
3. Start by uploading a dataset in the "Datasets" tab

### Uploading Data
1. Navigate to the "Datasets" tab
2. Click "New Dataset"
3. Enter a name and description
4. Upload a CSV, JSON, or text file
5. The system will automatically parse and analyze your data

### AI Chat
1. Go to the "AI Chat" tab
2. Choose between "General" or "Data Analysis" mode
3. If using Data Analysis mode, select a dataset for context
4. Ask questions about your data or general topics
5. Get instant AI-powered responses

### Creating Visualizations
1. Navigate to the "Visualize" tab
2. Select a dataset from the dropdown
3. Choose a chart type (Bar, Line, or Pie)
4. Select X and Y axis columns
5. View your interactive chart and data table

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup
1. Enable Row Level Security (RLS) on your tables
2. Set up storage policies for the datasets bucket
3. Configure authentication providers as needed

## 🚀 Deployment

### Using Lovable
Simply open [Lovable](https://lovable.dev/projects/64971f48-3c26-4ffc-ae9d-e58ab5357233) and click on Share -> Publish.

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider
3. Configure environment variables on your hosting platform

## 🔮 Future Enhancements

- [ ] Real AI integration (OpenAI, Anthropic, etc.)
- [ ] Advanced chart types (scatter plots, heatmaps)
- [ ] Data export functionality
- [ ] Collaborative features
- [ ] Advanced data analysis tools
- [ ] Custom dashboard layouts
- [ ] API integrations for external data sources

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ using modern web technologies**
