# Minimal Blog

A clean, typography-focused personal blog with backend management capabilities. Inspired by [r1ru.github.io](https://r1ru.github.io/).

## Features

### Public Side
- 📝 Clean homepage with blog post list
- 📄 Individual post pages with markdown rendering
- 🎨 Minimal, typography-focused design
- 📱 Fully responsive layout
- ⚡ Fast loading times
- 🔍 SEO-friendly HTML structure

### Admin Side
- 🔐 Secure JWT-based authentication
- ✏️ Create, edit, and delete blog posts
- 📝 Markdown editor with live preview
- 🎯 Publish/unpublish posts
- 🚀 Simple, intuitive dashboard

## Technology Stack

**Frontend:**
- HTML5
- CSS3 (minimal, clean design)
- Vanilla JavaScript
- Marked.js (markdown rendering)

**Backend:**
- Node.js
- Express.js
- SQLite
- JWT authentication
- bcrypt (password hashing)
### Backend Technology Stack

The backend uses the following technologies (see `backend_tech.txt` for the full list):

- Language: JavaScript (Node.js)
- Web framework: Express
- Environment configuration: dotenv
- CORS handling: cors
- Static file serving: express.static (built‑in)
- Database abstraction: custom switch between SQLite and MySQL
- SQLite driver: sqlite3
- MySQL driver: mysql2
- Password hashing: bcrypt
- Utilities: path, express.json, express.urlencoded

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm

### Setup Instructions

1. **Clone or navigate to the project directory:**
   ```bash
   cd /home/bear/Desktop/Blog
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file (optional):**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to customize your JWT secret and port.

4. **Initialize the database:**
   ```bash
   npm run init-db
   ```
   This creates the SQLite database, tables, admin user, and sample posts.

5. **Start the server:**
   ```bash
   npm start
   ```

6. **Open your browser:**
   - Public blog: `http://localhost:3001`
   - Admin login: `http://localhost:3001/admin/login.html`

## Default Credentials

**Username:** `admin`  
**Password:** `admin123`

⚠️ **Important:** Change the default password after first login by updating the database directly or implementing a password change feature.

## Project Structure

```
Blog/
├── config/
│   └── database.js          # SQLite database configuration
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── routes/
│   ├── auth.js              # Login endpoint
│   └── posts.js             # Blog posts CRUD API
├── scripts/
│   └── init-db.js           # Database initialization script
├── public/
│   ├── index.html           # Homepage
│   ├── post.html            # Single post page
│   ├── css/
│   │   └── style.css        # Public site styles
│   ├── js/
│   │   └── main.js          # Public site JavaScript
│   └── admin/
│       ├── login.html       # Admin login page
│       ├── dashboard.html   # Admin dashboard
│       ├── css/
│       │   └── admin.css    # Admin styles
│       └── js/
│           └── admin.js     # Admin JavaScript
├── server.js                # Express server
├── package.json             # Dependencies
├── .env.example             # Environment variables template
└── README.md                # This file
```

## API Endpoints

### Public Endpoints

- `GET /api/posts` - Get all published posts
- `GET /api/posts/:slug` - Get single post by slug

### Authentication

- `POST /api/login` - Admin login
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```

### Protected Endpoints (require JWT token)

- `GET /api/admin/posts` - Get all posts (including drafts)
- `POST /api/posts` - Create new post
  ```json
  {
    "title": "Post Title",
    "content": "# Markdown content",
    "excerpt": "Short description",
    "published": true
  }
  ```
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

**Authentication Header:**
```
Authorization: Bearer <your-jwt-token>
```

## Usage

### Creating a Blog Post

1. Navigate to `http://localhost:3001/admin/login.html`
2. Login with admin credentials
3. Click "New Post" button
4. Fill in:
   - Title (required)
   - Excerpt (optional, shown on homepage)
   - Content (required, supports Markdown)
   - Published checkbox (checked = visible to public)
5. Click "Preview" to see how it will look
6. Click "Save Post"

### Markdown Support

The blog supports full Markdown syntax:

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*

- Bullet list
1. Numbered list

[Link text](https://example.com)

`inline code`

\`\`\`
code block
\`\`\`

> Blockquote
```

## Deployment

### Option 1: Deploy Together (Simple)

Deploy the entire application to a Node.js hosting service:

**Recommended Services:**
- Heroku
- Railway
- Render
- DigitalOcean App Platform

**Steps:**
1. Push code to GitHub
2. Connect repository to hosting service
3. Set environment variables (JWT_SECRET, PORT)
4. Deploy

### Option 2: Deploy Separately (Advanced)

**Backend Deployment:**
1. Deploy backend to Node.js hosting (Heroku, Railway, etc.)
2. Set environment variables
3. Note the backend URL (e.g., `https://your-api.herokuapp.com`)

**Frontend Deployment:**
1. Update API_URL in `public/js/main.js` and `public/admin/js/admin.js`:
   ```javascript
   const API_URL = 'https://your-api.herokuapp.com/api';
   ```
2. Deploy `public/` folder to static hosting:
   - Netlify
   - Vercel
   - GitHub Pages
   - Cloudflare Pages

**CORS Configuration:**
If deploying separately, update `server.js` to allow your frontend domain:
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

### Environment Variables for Production

Set these in your hosting service:

```
PORT=3001
JWT_SECRET=<generate-a-strong-random-secret>
NODE_ENV=production
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Security Considerations

1. **Change default admin password** immediately after deployment
2. **Use a strong JWT secret** in production
3. **Enable HTTPS** on your hosting service
4. **Regularly update dependencies** with `npm update`
5. **Consider rate limiting** for login endpoint to prevent brute force attacks

## Customization

### Change Site Title and Description

Edit `public/index.html`:
```html
<h1 class="site-title">Your Blog Name</h1>
<p class="site-description">Your tagline</p>
```

### Customize Styling

Edit `public/css/style.css` to change:
- Colors
- Fonts
- Spacing
- Layout

### Add Google Analytics

Add tracking code to `public/index.html` and `public/post.html` before `</head>`.

## Troubleshooting

**Database not found:**
```bash
npm run init-db
```

**Port already in use:**
Change PORT in `.env` or:
```bash
PORT=3002 npm start
```

**Login not working:**
- Check browser console for errors
- Verify JWT_SECRET is set
- Clear browser localStorage and try again

**Posts not loading:**
- Check server console for errors
- Verify database.db exists
- Check API endpoints in browser DevTools Network tab

## License

MIT License - feel free to use this for your own blog!

## Support

For issues or questions, please check:
1. This README
2. Server console logs
3. Browser console (DevTools)

---

**Happy blogging! 📝**
