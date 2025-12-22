// API base URL
const API_URL = '/api';

// Format date to readable string
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Convert Editor.js blocks to HTML
function renderEditorJsBlocks(blocks) {
  return blocks.map(block => {
    switch (block.type) {
      case 'header':
        return `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
      case 'paragraph':
        return `<p>${block.data.text}</p>`;
      case 'list':
        const listTag = block.data.style === 'ordered' ? 'ol' : 'ul';
        const items = block.data.items.map(item => `<li>${item}</li>`).join('');
        return `<${listTag}>${items}</${listTag}>`;
      case 'image':
        return `
          <figure class="post-image">
            <img src="${block.data.file.url}" alt="${block.data.caption || ''}">
            ${block.data.caption ? `<figcaption>${block.data.caption}</figcaption>` : ''}
          </figure>
        `;
      case 'quote':
        return `
          <blockquote class="post-quote">
            <p>${block.data.text}</p>
            ${block.data.caption ? `<cite>${block.data.caption}</cite>` : ''}
          </blockquote>
        `;
      case 'code':
        return `
          <pre><code class="language-${block.data.language || 'plaintext'}">${escapeHtml(block.data.code)}</code></pre>
        `;
      case 'delimiter':
        return '<hr class="post-divider">';
      default:
        return '';
    }
  }).join('');
}

// Fetch and display all posts (for homepage)
async function loadPosts(category = null) {
  const container = document.getElementById('posts-container');

  // Show loading state if switching categories
  if (category !== undefined) {
    container.innerHTML = `
          <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Loading articles...</p>
          </div>
      `;
  }

  try {
    const url = category ? `${API_URL}/posts?category=${encodeURIComponent(category)}` : `${API_URL}/posts`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load posts');
    }

    if (data.posts.length === 0) {
      container.innerHTML = '<p class="error">No posts found in this category.</p>';
      return;
    }

    // Render posts in card grid with cover images
    container.innerHTML = data.posts.map((post, index) => `
      <article class="post-card" style="animation: fadeInUp 0.6s ease-out ${index * 0.1}s both;">
        ${post.cover_image ? `
          <div class="post-cover">
            <img src="${post.cover_image}" alt="${escapeHtml(post.title)}" loading="lazy">
          </div>
        ` : ''}
        <div class="post-card-content">
          <div class="post-meta-top">
            <span class="post-category">${escapeHtml(post.category || 'Uncategorized')}</span>
            <span class="post-reading-time">${post.reading_time || 5} min read</span>
          </div>
          <span class="post-author" style="display:none">${escapeHtml(post.author || 'Admin')}</span>
          <h3><a href="/post.html?slug=${post.slug}">${escapeHtml(post.title)}</a></h3>
          <time class="post-date" datetime="${post.created_at}">${formatDate(post.created_at)}</time>
          <p class="post-excerpt">${escapeHtml(post.excerpt)}</p>
          ${post.tags ? `
            <div class="post-tags">
              ${post.tags.split(',').map(tag => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </article>
    `).join('');

  } catch (error) {
    console.error('Error loading posts:', error);
    container.innerHTML = '<p class="error">Failed to load posts. Please try again later.</p>';
  }
}

// Fetch and display categories
async function loadCategories() {
  const container = document.getElementById('category-filter');
  if (!container) return;

  try {
    const response = await fetch(`${API_URL}/categories`);
    const data = await response.json();

    if (data.categories && data.categories.length > 0) {
      let html = `<button class="category-btn active" data-category="">All</button>`;

      html += data.categories.map(cat =>
        `<button class="category-btn" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
      ).join('');

      container.innerHTML = html;

      // Add click listeners
      container.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          // Update active state
          container.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          // Filter posts
          const category = btn.dataset.category || null;
          loadPosts(category);
        });
      });
    }

  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

// Fetch and display single post (for post page)
async function loadSinglePost() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (!slug) {
    document.getElementById('post-content').innerHTML = '<p class="error">Post not found.</p>';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/posts/${slug}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to load post');
    }

    const post = data.post;

    // Update page title and SEO meta tags
    document.getElementById('post-title').textContent = `${post.title} | SOCSignals`;

    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = post.meta_description || post.excerpt || post.title;

    // Update or create meta keywords
    if (post.meta_keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.content = post.meta_keywords;
    }

    // Render post content
    let contentHtml = '';

    try {
      // Try parsing as JSON (Editor.js format)
      const contentData = JSON.parse(post.content);
      if (contentData.blocks && Array.isArray(contentData.blocks)) {
        contentHtml = renderEditorJsBlocks(contentData.blocks);
      } else {
        // JSON but not Editor.js blocks? Fallback to legacy markdown
        throw new Error('Not Editor.js format');
      }
    } catch (e) {
      // Fallback to legacy Markdown
      if (typeof marked !== 'undefined') {
        marked.setOptions({
          highlight: function (code, lang) {
            if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
              try {
                return hljs.highlight(code, { language: lang }).value;
              } catch (err) { }
            }
            return code;
          },
          breaks: true,
          gfm: true
        });
        contentHtml = marked.parse(post.content);
      } else {
        contentHtml = post.content.replace(/\n/g, '<br>');
      }
    }

    document.getElementById('post-content').innerHTML = `
      ${post.cover_image ? `
        <div class="post-cover-full">
          <img src="${post.cover_image}" alt="${escapeHtml(post.title)}">
        </div>
      ` : ''}
      <h1>${escapeHtml(post.title)}</h1>
      <div class="post-meta-full">
        <span class="post-author">👤 ${escapeHtml(post.author || 'Admin')}</span>
        <span class="post-date">📅 ${formatDate(post.created_at)}</span>
        <span class="post-reading-time">⏱️ ${post.reading_time || 5} min read</span>
      </div>
      ${post.tags ? `
        <div class="post-tags-full">
          ${post.tags.split(',').map(tag => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}
        </div>
      ` : ''}
      <div class="post-body editor-js-content">${contentHtml}</div>
    `;

    // Apply syntax highlighting to code blocks (both legacy and new)
    if (typeof hljs !== 'undefined') {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }

  } catch (error) {
    console.error('Error loading post:', error);
    document.getElementById('post-content').innerHTML = '<p class="error">Failed to load post. Please try again later.</p>';
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the homepage or post page
  if (document.getElementById('posts-container')) {
    loadPosts();
    loadCategories();
  } else if (document.getElementById('post-content')) {
    loadSinglePost();
  }
});
