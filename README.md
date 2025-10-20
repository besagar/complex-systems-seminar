# Modern Theory of Complex Systems & Applications

A complete static website for the student-led chalkboard seminar series at Weizmann Institute of Science, Department of Complex Systems.

## 🎯 About the Seminar

This seminar series aims to establish a space for serious theoretical discussion and long-format presentations centered around complex systems theory. Unlike traditional slide-based seminars, we focus on chalkboard presentations with extended discussion periods, reviving the tradition of deeper, dialogue-oriented sessions.

### Format
- **Duration**: 75-90 minute chalkboard presentations + 30-45 minutes discussion
- **Frequency**: Biweekly sessions
- **Audience**: Graduate students, postdocs, and faculty
- **Topics**: Field theory, replica theory, stochastic processes, active matter, complex networks

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/USERNAME/REPO.git
   cd REPO
   ```

2. **Serve locally** (optional, for development)
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

### GitHub Pages Deployment

1. **Create GitHub repository**
   - Go to [GitHub](https://github.com) and create a new repository
   - Name it something like `complex-systems-seminar`

2. **Upload files**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Complex Systems Seminar website"
   git branch -M main
   git remote add origin https://github.com/besagar/complex-systems-seminar.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` / `(root)`
   - Save

4. **Access your site**
   ```
   https://besagar.github.io/complex-systems-seminar/
   ```

## ⚙️ Configuration

### 1. Update Placeholders

Replace these placeholders throughout the codebase:

- ✅ `USERNAME` → `besagar` (completed)
- ✅ `REPO` → `complex-systems-seminar` (completed)
- `REPLACE_WITH_YOUR_CODE` → Your Formspree endpoint code

### 2. Configure Formspree (Speaker Submissions)

1. Go to [Formspree](https://formspree.io/)
2. Create an account and new form
3. Copy the form endpoint (e.g., `https://formspree.io/f/abcd1234`)
4. Update in `data/settings.json`:
   ```json
   {
     "formspree_action": "https://formspree.io/f/YOUR_CODE_HERE"
   }
   ```

### 3. Update Settings

Edit `data/settings.json` with your information:

```json
{
  "seminar_title": "Your Seminar Title",
  "contact_email": "your.email@institution.edu",
  "calendar_subscribe_url": "https://calendar.google.com/calendar/u/0?cid=YOUR_CALENDAR_ID",
  "mailing_list_url": "https://groups.google.com/g/YOUR_GROUP",
  "repo_url": "https://github.com/besagar/complex-systems-seminar"
}
```

### 4. Add Your Events

Edit `data/schedule.json` to add your seminar events:

```json
[
  {
    "id": "2024-11-13-your-talk",
    "title": "Your Talk Title",
    "speakers": ["Speaker Name"],
    "affiliation": "Your Institution",
    "datetime": "2024-11-13T15:30:00+02:00",
    "duration_min": 120,
    "room": "Room Name",
    "level": "intro",
    "tags": ["tag1", "tag2"],
    "abstract": "Your abstract here...",
    "references": [
      {"label": "Paper Title", "url": "https://doi.org/..."}
    ]
  }
]
```

## 📁 Project Structure

```
├── index.html              # Landing page
├── schedule.html           # Event schedule with filtering
├── submit.html            # Speaker submission form
├── admin.html             # Admin interface (optional)
├── 404.html               # Error page
├── css/
│   └── styles.css         # Main stylesheet
├── js/
│   ├── app.js            # Core functionality
│   ├── schedule.js       # Schedule page logic
│   ├── submit.js         # Form handling
│   └── admin.js          # Admin interface
├── data/
│   ├── schedule.json     # Event data
│   └── settings.json     # Site configuration
├── assets/               # Images, logos, etc.
├── sitemap.xml          # SEO sitemap
├── robots.txt           # Search engine rules
├── feed.xml             # RSS feed
└── README.md            # This file
```

## 🔧 Management

### Adding New Events

**Option 1: Direct File Edit**
1. Edit `data/schedule.json` directly
2. Commit and push changes
3. GitHub Pages will automatically update

**Option 2: Admin Interface**
1. Go to `https://USERNAME.github.io/REPO/admin.html`
2. Enter GitHub Personal Access Token
3. Load and edit JSON files through the web interface
4. Save changes directly to repository

### Creating GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Copy the token (starts with `ghp_`)
4. Use in admin interface

### Calendar Integration

**Google Calendar**
- Events include "Add to Google Calendar" buttons
- Generates proper calendar URLs with timezone support

**ICS Download**
- Each event can be downloaded as `.ics` file
- Compatible with all calendar applications

## 🎨 Customization

### Styling
- Edit `css/styles.css` for visual customization
- CSS variables for easy color scheme changes
- Responsive design with mobile-first approach
- Dark/light theme support via `prefers-color-scheme`

### Content
- All text content can be modified in HTML files
- Event data managed through JSON files
- Multilingual support can be added by duplicating pages

### Features
- Search and filtering on schedule page
- Form validation with real-time feedback
- Timezone conversion for international audiences
- SEO optimized with structured data

## 🔍 SEO & Analytics

### Built-in SEO Features
- Semantic HTML5 structure
- Open Graph and Twitter Card meta tags
- JSON-LD structured data for events
- XML sitemap and robots.txt
- RSS feed for event updates

### Adding Analytics
Add your analytics code before the closing `</head>` tag in each HTML file:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🛠️ Technical Details

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Progressive enhancement for older browsers
- No external dependencies (except Formspree for forms)

### Performance
- Optimized CSS and JavaScript
- Service worker for offline caching
- Compressed images and assets
- Fast loading times

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios

## 📧 Support

For questions about the website:
- **Technical Issues**: Create an issue in this repository
- **Seminar Content**: Contact [roman.gaidarov@weizmann.ac.il](mailto:roman.gaidarov@weizmann.ac.il)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Organizers**: Roma Gaidarov (PhD Student, Amir Group), Pavel Litvinov (MSc Student, Feinerman Group)
- **Institution**: Weizmann Institute of Science, Department of Complex Systems
- **Inspiration**: Traditional chalkboard seminars and theoretical physics community

---

Built with ❤️ for the theoretical physics community
