// API base URL
const API_URL = '/api';

// Token management
function getToken() {
    return localStorage.getItem('authToken');
}

function setToken(token) {
    localStorage.setItem('authToken', token);
}

function removeToken() {
    localStorage.removeItem('authToken');
}

function isAuthenticated() {
    return !!getToken();
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/admin/login.html';
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// ===== LOGIN PAGE =====
if (window.location.pathname.includes('login.html')) {
    if (isAuthenticated()) {
        window.location.href = '/admin/dashboard.html';
    }

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('error-message');

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            setToken(data.token);
            window.location.href = '/admin/dashboard.html';

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.add('show');
        }
    });
}

// ===== DASHBOARD PAGE =====
if (window.location.pathname.includes('dashboard.html')) {
    requireAuth();

    requireAuth();

    let currentEditingPostId = null;
    let editor = null;

    // Initialize Editor.js
    function initEditor(data = {}) {
        if (editor) {
            editor.destroy();
            editor = null;
        }

        editor = new EditorJS({
            holder: 'editorjs',
            placeholder: 'Let\'s write an awesome story!',
            tools: {
                header: {
                    class: Header,
                    inlineToolbar: true,
                    config: {
                        placeholder: 'Enter a header',
                        levels: [2, 3, 4],
                        defaultLevel: 2
                    }
                },
                list: {
                    class: List,
                    inlineToolbar: true,
                    config: {
                        defaultStyle: 'unordered'
                    }
                },
                image: {
                    class: ImageTool,
                    config: {
                        endpoints: {
                            byFile: `${API_URL}/upload`, // Your backend file uploader endpoint
                        },
                        additionalRequestHeaders: {
                            'Authorization': `Bearer ${getToken()}`
                        }
                    }
                },
                quote: {
                    class: Quote,
                    inlineToolbar: true,
                    shortcut: 'CMD+SHIFT+O',
                    config: {
                        quotePlaceholder: 'Enter a quote',
                        captionPlaceholder: 'Quote\'s author',
                    },
                },
                code: CodeTool,
                inlineCode: {
                    class: InlineCode,
                    shortcut: 'CMD+SHIFT+M',
                },
                marker: {
                    class: Marker,
                    shortcut: 'CMD+SHIFT+M',
                },
                delimiter: Delimiter,
            },
            data: data,
            onReady: () => {
                new Undo({ editor });
            },
            onChange: () => {
                // Auto-save logic could go here
            }
        });
    }

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        removeToken();
        window.location.href = '/admin/login.html';
    });

    // Load all posts
    async function loadAdminPosts() {
        const postsList = document.getElementById('posts-list');

        try {
            const response = await fetch(`${API_URL}/admin/posts`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    removeToken();
                    window.location.href = '/admin/login.html';
                    return;
                }
                throw new Error(data.error || 'Failed to load posts');
            }

            if (data.posts.length === 0) {
                postsList.innerHTML = '<p class="loading">No posts yet. Create your first post!</p>';
                return;
            }

            postsList.innerHTML = data.posts.map(post => `
        <div class="post-card">
          <div class="post-card-header">
            <div>
              <h3 class="post-card-title">
                ${escapeHtml(post.title)}
                <span class="post-status ${post.published ? 'published' : 'draft'}">
                  ${post.published ? 'Published' : 'Draft'}
                </span>
              </h3>
              <p class="post-card-meta">
                ${post.author || 'Admin'} • ${formatDate(post.created_at)} • ${post.reading_time || 5} min read
                ${post.tags ? ` • ${post.tags}` : ''}
              </p>
            </div>
            <div class="post-card-actions">
              <button class="btn btn-small btn-secondary" onclick="editPost(${post.id})">Edit</button>
              <button class="btn btn-small btn-danger" onclick="deletePost(${post.id}, '${escapeHtml(post.title)}')">Delete</button>
            </div>
          </div>
        </div>
      `).join('');

        } catch (error) {
            console.error('Error loading posts:', error);
            postsList.innerHTML = '<p class="error">Failed to load posts.</p>';
        }
    }

    // Show new post form
    document.getElementById('new-post-btn').addEventListener('click', () => {
        currentEditingPostId = null;
        document.getElementById('editor-title').textContent = 'New Article';
        document.getElementById('post-form').reset();
        document.getElementById('post-id').value = '';
        document.getElementById('post-author-input').value = 'Admin';
        document.getElementById('post-category-input').value = 'Uncategorized';
        document.getElementById('post-category-input').value = 'Uncategorized';

        // Initialize empty editor
        if (editor) {
            editor.destroy();
            editor = null;
        }
        initEditor();

        document.getElementById('preview-container').style.display = 'none';
        document.getElementById('cover-preview').style.display = 'none';
        showView('editor-view');
    });

    // Cancel editing
    document.getElementById('cancel-edit-btn').addEventListener('click', () => {
        showView('posts-view');
    });

    // Edit post
    window.editPost = async (postId) => {
        try {
            const response = await fetch(`${API_URL}/admin/posts`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            const data = await response.json();
            const post = data.posts.find(p => p.id === postId);

            if (!post) {
                alert('Post not found');
                return;
            }

            currentEditingPostId = postId;
            document.getElementById('editor-title').textContent = 'Edit Article';
            document.getElementById('post-id').value = post.id;
            document.getElementById('post-title-input').value = post.title;
            document.getElementById('post-author-input').value = post.author || 'Admin';
            document.getElementById('post-cover-input').value = post.cover_image || '';
            document.getElementById('post-excerpt-input').value = post.excerpt || '';
            document.getElementById('post-meta-desc-input').value = post.meta_description || '';
            document.getElementById('post-meta-keywords-input').value = post.meta_keywords || '';
            document.getElementById('post-meta-keywords-input').value = post.meta_keywords || '';
            document.getElementById('post-tags-input').value = post.tags || '';
            document.getElementById('post-category-input').value = post.category || 'Uncategorized';
            document.getElementById('post-category-input').value = post.category || 'Uncategorized';

            // Handle content (Markdown vs JSON)
            let editorData = {};
            try {
                // Try parsing as JSON first (for new posts)
                editorData = JSON.parse(post.content);
            } catch (e) {
                // If parsing fails, it's likely old markdown. 
                // We'll create a simple block with the markdown content for now, 
                // or you could use a markdown-to-blocks converter here.
                // For simplicity, we put it all in one paragraph or try to preserve it.
                // Better approach for now: Encapsulate it in a code block or paragraph
                console.log('Legacy markdown content detected');
                editorData = {
                    blocks: [
                        {
                            type: "paragraph",
                            data: {
                                text: post.content.replace(/\n/g, '<br>') // Basic line break handling
                            }
                        }
                    ]
                };
            }

            // Initialize editor with data
            if (editor) {
                editor.destroy();
                editor = null;
            }
            initEditor(editorData);

            document.getElementById('post-published-input').checked = post.published === 1;
            document.getElementById('preview-container').style.display = 'none';

            // Show cover image preview if exists
            if (post.cover_image) {
                showCoverPreview(post.cover_image);
            } else {
                document.getElementById('cover-preview').style.display = 'none';
            }

            showView('editor-view');

        } catch (error) {
            console.error('Error loading post:', error);
            alert('Failed to load post');
        }
    };

    // Delete post
    window.deletePost = async (postId, postTitle) => {
        if (!confirm(`Are you sure you want to delete "${postTitle}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete post');
            }

            loadAdminPosts();

        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post: ' + error.message);
        }
    };

    // Cover image upload
    document.getElementById('upload-cover-btn').addEventListener('click', () => {
        document.getElementById('cover-file-input').click();
    });

    document.getElementById('cover-file-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            document.getElementById('post-cover-input').value = data.url;
            showCoverPreview(data.url);

        } catch (error) {
            alert('Failed to upload image: ' + error.message);
        }
    });

    // Show cover preview
    function showCoverPreview(url) {
        document.getElementById('cover-preview-img').src = url;
        document.getElementById('cover-preview').style.display = 'block';
    }

    // Remove cover image
    document.getElementById('remove-cover-btn').addEventListener('click', () => {
        document.getElementById('post-cover-input').value = '';
        document.getElementById('cover-preview').style.display = 'none';
    });

    // Update cover preview when URL changes
    document.getElementById('post-cover-input').addEventListener('change', (e) => {
        const url = e.target.value;
        if (url) {
            showCoverPreview(url);
        } else {
            document.getElementById('cover-preview').style.display = 'none';
        }
    });

    // Markdown toolbar actions
    // Toolbar Removed


    // Save post (create or update)
    document.getElementById('post-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const postId = document.getElementById('post-id').value;
        const title = document.getElementById('post-title-input').value;
        const author = document.getElementById('post-author-input').value;
        const cover_image = document.getElementById('post-cover-input').value;
        const excerpt = document.getElementById('post-excerpt-input').value;
        const meta_description = document.getElementById('post-meta-desc-input').value;
        const meta_keywords = document.getElementById('post-meta-keywords-input').value;
        const tags = document.getElementById('post-tags-input').value;
        const category = document.getElementById('post-category-input').value;

        let content = '';
        try {
            const savedData = await editor.save();
            content = JSON.stringify(savedData);
        } catch (error) {
            console.error('Saving failed: ', error);
            alert('Failed to get editor content');
            return;
        }
        const published = document.getElementById('post-published-input').checked;

        const postData = {
            title,
            author,
            cover_image,
            excerpt,
            meta_description,
            meta_keywords,
            tags,
            category,
            content,
            published
        };

        try {
            let response;

            if (postId) {
                // Update existing post
                response = await fetch(`${API_URL}/posts/${postId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`
                    },
                    body: JSON.stringify(postData)
                });
            } else {
                // Create new post
                response = await fetch(`${API_URL}/posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${getToken()}`
                    },
                    body: JSON.stringify(postData)
                });
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save post');
            }

            alert('Post saved successfully!');
            showView('posts-view');
            loadAdminPosts();

        } catch (error) {
            console.error('Error saving post:', error);
            alert('Failed to save post: ' + error.message);
        }
    });

    // Preview markdown with syntax highlighting
    // Preview functionality can be updated or removed since Editor.js is WYSIWYG
    document.getElementById('preview-btn').style.display = 'none';

    // Switch between views
    function showView(viewId) {
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
        document.getElementById(viewId).style.display = 'block';
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initial load
    loadAdminPosts();
}
